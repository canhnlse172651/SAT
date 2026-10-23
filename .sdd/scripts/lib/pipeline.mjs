// Headless orchestrator: one fresh `claude -p` session per phase. Artifacts on disk are the only
// hand-off between phases, so no phase inherits a polluted context from the previous one.
// Deterministic gates run in between; the pipeline stops at the first red gate.
import { spawn } from 'node:child_process';
import { atLeast, SddError } from './core.mjs';
import { listFeatures, resolveFeature, parseTasks, taskSummary, readVerdict } from './features.mjs';
import { gate } from './checks.mjs';
import { approve } from './lifecycle.mjs';

export const PIPELINE = ['spec', 'clarify', 'plan', 'tasks', 'analyze', 'implement', 'verify', 'ship'];

// Status a feature must reach for the phase to count as done.
const EXPECTED_STATUS = {
  spec: 'draft', clarify: 'clarified', plan: 'planned', tasks: 'tasked',
  analyze: 'tasked', implement: 'implementing', verify: 'verified', ship: 'shipped',
};

export function nextPhase(ctx, f) {
  switch (f.status) {
    case 'draft': return 'clarify';
    case 'clarified':
    case 'approved': return 'plan';
    case 'planned': return 'tasks';
    case 'tasked': {
      const v = readVerdict(f.read('analysis.md'));
      return ctx.config.gates.requireAnalysis && (!v || v === 'FAIL') ? 'analyze' : 'implement';
    }
    case 'implementing': {
      const s = taskSummary(parseTasks(f.read('tasks.md') ?? ''));
      return s.done === s.total ? 'verify' : 'implement';
    }
    case 'verified': return 'ship';
    default: return null;
  }
}

export async function runPipeline(ctx, { idea, feature: ref, from, to = 'verify', dryRun = false, log = console.log }) {
  let feature = ref ? resolveFeature(ctx, ref) : null;
  if (!feature && !idea) throw new SddError('pipeline needs an idea ("<description>") or --feature <id>.');
  const start = from ?? (feature ? nextPhase(ctx, feature) : 'spec');
  if (!start) return log(`✔ ${feature.name} is already ${feature.status}. Nothing to do.`);
  const [i0, i1] = [PIPELINE.indexOf(start), PIPELINE.indexOf(to)];
  if (i0 < 0 || i1 < 0) throw new SddError(`Phases must be one of: ${PIPELINE.join(', ')}`);

  for (const phase of PIPELINE.slice(i0, i1 + 1)) {
    if (feature) feature = resolveFeature(ctx, feature.id);

    if (phase === 'plan' && feature.status === 'clarified') {
      if (ctx.config.gates.humanApproval.spec) {
        log(`\n⏸  Human gate: review ${feature.relDir}/spec.md, then run:\n` +
            `     node .sdd/scripts/sdd.mjs approve ${feature.id} --by "<your name>"\n` +
            `     node .sdd/scripts/sdd.mjs pipeline --feature ${feature.id}`);
        return;
      }
      log('ℹ  gates.humanApproval.spec=false → auto-approving spec');
      if (!dryRun) approve(ctx, feature, 'sdd-pipeline (auto)');
      feature = resolveFeature(ctx, feature.id);
    }

    if (feature) {
      const g = gate(ctx, phase, feature);
      if (!g.ok) {
        log(`\n⛔ Gate "${phase}" is closed for ${feature.name}:\n${g.reasons.map((r) => `   - ${r}`).join('\n')}`);
        process.exitCode = 1;
        return;
      }
    }

    const prompt = phase === 'spec'
      ? `/sdd-spec --headless ${idea}`
      : `/sdd-${phase} ${feature.id} --headless`;

    // implement may need several sessions: keep going while each session makes progress.
    const maxRounds = phase === 'implement' ? 10 : 1;
    for (let round = 1; round <= maxRounds; round++) {
      const before = feature ? taskSummary(parseTasks(feature.read('tasks.md') ?? '')).done : 0;
      const known = new Set(listFeatures(ctx).map((f) => f.id));
      log(`\n━━ ${phase}${maxRounds > 1 ? ` (round ${round})` : ''} ━━  ${prompt}`);
      if (dryRun) break;

      const res = await invokeClaude(ctx, prompt);
      if (res.json) {
        log(res.json.result ?? '');
        log(`   ↳ turns=${res.json.num_turns ?? '?'} cost=$${(res.json.total_cost_usd ?? 0).toFixed(2)} session=${res.json.session_id ?? '?'}`);
      }
      if (!res.ok) {
        log(`✗ claude exited with ${res.error ?? `code ${res.code}`}${res.json?.subtype ? ` (${res.json.subtype})` : ''}`);
        process.exitCode = 1;
        return;
      }

      if (phase === 'spec') {
        const created = listFeatures(ctx).filter((f) => !known.has(f.id));
        if (created.length !== 1) throw new SddError('spec phase finished but no single new feature folder was created.');
        feature = created[0];
      }
      feature = resolveFeature(ctx, feature.id);
      if (phase !== 'implement') break;
      const s = taskSummary(parseTasks(feature.read('tasks.md') ?? ''));
      if (s.done === s.total) break;
      if (s.done === before) {
        log(`✗ implement made no progress this round (${s.done}/${s.total} done, ${s.blocked} blocked). Stopping.`);
        process.exitCode = 1;
        return;
      }
    }

    if (!dryRun && !atLeast(feature.status, EXPECTED_STATUS[phase])) {
      log(`✗ after ${phase}, ${feature.name} is "${feature.status}" (expected ≥ "${EXPECTED_STATUS[phase]}"). Stopping.`);
      process.exitCode = 1;
      return;
    }
    if (!dryRun && phase === 'analyze' && readVerdict(feature.read('analysis.md')) === 'FAIL') {
      log('✗ analysis verdict is FAIL. Resolve the CRITICAL findings in analysis.md, then resume.');
      process.exitCode = 1;
      return;
    }
  }
  log(`\n✔ pipeline reached "${to}"${feature ? ` for ${feature.name} (status: ${feature.status})` : ''}.`);
}

function invokeClaude(ctx, prompt) {
  const p = ctx.config.pipeline;
  const bin = process.env.SDD_CLAUDE_BIN || p.claudeBin;
  const args = ['-p', '--output-format', 'json', '--permission-mode', p.permissionMode, '--max-turns', String(p.maxTurnsPerPhase)];
  if (p.model) args.push('--model', p.model);
  return new Promise((resolve) => {
    // Prompt goes through stdin: no shell-quoting pitfalls on Windows.
    const child = spawn(bin, args, {
      cwd: ctx.root,
      shell: process.platform === 'win32',
      stdio: ['pipe', 'pipe', 'inherit'],
      env: { ...process.env, SDD_HEADLESS: '1' },
    });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.on('error', (e) => resolve({ ok: false, error: e.message }));
    child.on('close', (code) => {
      let json = null;
      try {
        json = JSON.parse(out);
      } catch { /* non-JSON output: treated as failure below */ }
      resolve({ ok: code === 0 && !!json && !json.is_error, code, json });
    });
    child.stdin.end(prompt);
  });
}

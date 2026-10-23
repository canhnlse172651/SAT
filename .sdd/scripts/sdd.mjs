#!/usr/bin/env node
// sdd — Spec-Driven Development CLI. Deterministic plumbing for the agent pipeline:
// agents write the artifacts, this CLI validates them and moves features between states.
import { SddError, loadContext, STATUSES, writeText } from './lib/core.mjs';
import { listFeatures, resolveFeature, parseTasks, taskSummary } from './lib/features.mjs';
import { checkFeature, traceFeature, renderTraceMarkdown, scanTestRefs, gate, PHASES } from './lib/checks.mjs';
import { newFeature, approve, setStatus, setTaskState } from './lib/lifecycle.mjs';
import { runTool, CI_STEPS } from './lib/runner.mjs';
import { runPipeline, nextPhase, PIPELINE } from './lib/pipeline.mjs';

const HELP = `sdd — Spec-Driven Development CLI

Usage: node .sdd/scripts/sdd.mjs <command> [args] [--json]

Features
  new "<title>" [--slug s] [--no-branch]   Create specs/NNN-slug/spec.md (+ git branch)
  status                                    Table of all features and task progress
  current                                   Resolve the active feature (arg › $SDD_FEATURE › branch)
  approve [feature] --by "<name>"           HUMAN gate: clarified → approved
  set-status <feature> <status> [--reason]  Advance one step (validated) or move back (needs --reason)
  task <T###> <todo|doing|done|blocked> [--feature f] [--note "..."]
  next-task [feature]                       Next task to execute

Quality gates
  check [feature] [--all]                   Lint artifacts required by the feature's status
  trace [feature] [--write]                 AC → task → test traceability matrix
  gate <phase> [feature]                    Can <phase> start? phases: ${PHASES.join(', ')}

Toolchain contract (.sdd/config.json → toolchain)
  run <task> [--required] [-- args]         Run a toolchain command (lint, test, build, deploy:staging…)
  ci [--e2e]                                ${CI_STEPS.join(' → ')} (+ test:e2e) + check --all

Automation
  pipeline "<idea>" | --feature f [--from p] [--to p] [--dry-run]
                                            Headless: one fresh \`claude -p\` per phase, gates between.
                                            Phases: ${PIPELINE.join(' → ')} (default --to verify)

Statuses: ${STATUSES.join(' → ')}`;

const BOOL_FLAGS = new Set(['json', 'all', 'write', 'required', 'dry-run', 'no-branch', 'e2e', 'help']);

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  const passthrough = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') {
      passthrough.push(...argv.slice(i + 1));
      break;
    }
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split(/=(.*)/s);
      if (v !== undefined) flags[k] = v;
      else if (BOOL_FLAGS.has(k)) flags[k] = true;
      else flags[k] = argv[++i];
    } else if (a === '-h') flags.help = true;
    else positional.push(a);
  }
  return { positional, flags, passthrough };
}

const print = (flags, data, human) => console.log(flags.json ? JSON.stringify(data, null, 2) : human(data));

function reportCheck(r) {
  const head = `${r.errors.length ? '✗' : '✔'} ${r.feature} [${r.status}] — ${r.errors.length} error(s), ${r.warnings.length} warning(s)`;
  return [head, ...r.errors.map((e) => `   ✗ ${e}`), ...r.warnings.map((w) => `   ⚠ ${w}`)].join('\n');
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const { positional: args, flags, passthrough } = parseArgs(rest);
  if (!cmd || cmd === 'help' || flags.help) return console.log(HELP);
  const ctx = loadContext();

  switch (cmd) {
    case 'new': {
      const res = newFeature(ctx, args.join(' '), { slug: flags.slug, branch: !flags['no-branch'] });
      return print(flags, res, (r) => `✔ Created ${r.spec}${r.branch ? ` on branch ${r.branch}` : ' (no branch created)'}`);
    }

    case 'status':
    case 'list': {
      const rows = listFeatures(ctx).map((f) => {
        const s = taskSummary(parseTasks(f.read('tasks.md') ?? ''));
        return { id: f.id, feature: f.name, status: f.status, phase: nextPhase(ctx, f), done: s.done, total: s.total, blocked: s.blocked, next: s.next?.id ?? null };
      });
      const phaseLabel = (r) => (r.status === 'clarified' && ctx.config.gates.humanApproval.spec ? 'HUMAN:approve' : r.phase ? `/sdd-${r.phase}` : '—');
      return print(flags, rows, (rs) => {
        if (!rs.length) return 'No features yet. Start with: /sdd-spec <idea>  (or: sdd new "<title>")';
        const w = Math.max(7, ...rs.map((r) => r.feature.length));
        return [
          `${'FEATURE'.padEnd(w)}  ${'STATUS'.padEnd(12)}  ${'NEXT'.padEnd(13)}  TASKS     NEXT TASK`,
          ...rs.map((r) => `${r.feature.padEnd(w)}  ${r.status.padEnd(12)}  ${phaseLabel(r).padEnd(13)}  ${r.total ? `${r.done}/${r.total}`.padEnd(8) : '—'.padEnd(8)}${r.blocked ? '⛔' : '  '}${r.next ?? ''}`),
        ].join('\n');
      });
    }

    case 'current': {
      const f = resolveFeature(ctx, args[0]);
      return print(flags, { id: f.id, name: f.name, status: f.status, dir: f.relDir }, (r) => `${r.name} [${r.status}] → ${r.dir}`);
    }

    case 'approve': {
      const f = resolveFeature(ctx, args[0]);
      approve(ctx, f, flags.by);
      return console.log(`✔ ${f.name} approved by ${flags.by}`);
    }

    case 'set-status': {
      const [ref, target] = args.length >= 2 ? args : [undefined, args[0]];
      const f = resolveFeature(ctx, ref);
      setStatus(ctx, f, target, { reason: flags.reason });
      return console.log(`✔ ${f.name}: ${f.status} → ${target}`);
    }

    case 'task': {
      const [taskId, state] = args;
      if (!/^T\d{3,}$/.test(taskId ?? '')) throw new SddError('Usage: sdd task <T###> <todo|doing|done|blocked> [--feature f] [--note "..."]');
      const f = setTaskState(ctx, resolveFeature(ctx, flags.feature), taskId, state, flags.note);
      const s = taskSummary(parseTasks(f.read('tasks.md')));
      return console.log(`✔ ${f.name} ${taskId} → ${state}  (${s.done}/${s.total} done${s.next ? `, next: ${s.next.id}` : ''})`);
    }

    case 'next-task': {
      const f = resolveFeature(ctx, args[0]);
      const s = taskSummary(parseTasks(f.read('tasks.md') ?? ''));
      return print(flags, { feature: f.name, ...s }, (r) => (r.next ? `${r.next.id} ${r.next.text}` : `No pending tasks in ${r.feature} (${r.done}/${r.total} done).`));
    }

    case 'check': {
      const features = flags.all ? listFeatures(ctx) : [resolveFeature(ctx, args[0])];
      const results = features.map((f) => checkFeature(ctx, f));
      print(flags, results, (rs) => rs.map(reportCheck).join('\n') || 'No features to check.');
      if (results.some((r) => r.errors.length)) process.exitCode = 1;
      return;
    }

    case 'trace': {
      const f = resolveFeature(ctx, args[0]);
      const t = traceFeature(ctx, f, scanTestRefs(ctx));
      if (flags.write) writeText(f.path('traceability.md'), renderTraceMarkdown(t));
      print(flags, t, (x) => renderTraceMarkdown(x) + (flags.write ? `\n✔ wrote ${f.relDir}/traceability.md` : ''));
      if (t.gaps.length) process.exitCode = 1;
      return;
    }

    case 'gate': {
      const [phase, ref] = args;
      const g = gate(ctx, phase, resolveFeature(ctx, ref));
      print(flags, g, (r) => (r.ok ? `✔ gate "${r.phase}" open for ${r.feature}` : `⛔ gate "${r.phase}" closed for ${r.feature}:\n${r.reasons.map((x) => `   - ${x}`).join('\n')}`));
      if (!g.ok) process.exitCode = 1;
      return;
    }

    case 'run': {
      if (!args[0]) throw new SddError('Usage: sdd run <task> [--required] [-- extra args]');
      process.exitCode = runTool(ctx, args[0], passthrough, { required: flags.required });
      return;
    }

    case 'ci': {
      for (const step of [...CI_STEPS, ...(flags.e2e ? ['test:e2e'] : [])]) {
        const code = runTool(ctx, step);
        if (code !== 0) {
          console.error(`✗ ci: "${step}" failed (exit ${code})`);
          process.exitCode = code;
          return;
        }
      }
      const results = listFeatures(ctx).map((f) => checkFeature(ctx, f));
      if (results.length) console.log(results.map(reportCheck).join('\n'));
      if (results.some((r) => r.errors.length)) {
        console.error('✗ ci: spec artifacts have errors');
        process.exitCode = 1;
        return;
      }
      return console.log('✔ ci passed');
    }

    case 'pipeline':
      return runPipeline(ctx, {
        idea: args.join(' ') || undefined,
        feature: flags.feature,
        from: flags.from,
        to: flags.to,
        dryRun: flags['dry-run'],
      });

    default:
      throw new SddError(`Unknown command "${cmd}". Run: sdd help`);
  }
}

main().catch((e) => {
  console.error(e instanceof SddError ? `✗ ${e.message}` : e.stack);
  process.exitCode = e instanceof SddError ? 2 : 1;
});

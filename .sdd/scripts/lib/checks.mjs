// Quality gates: artifact lint (check), spec→task→test traceability (trace), phase gates (gate).
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname, basename } from 'node:path';
import { STATUSES, atLeast, readText } from './core.mjs';
import { parseSpec, parseTasks, taskSummary, readVerdict, isEars } from './features.mjs';

const TASK_TAGS_WITHOUT_AC = new Set(['infra', 'setup', 'docs', 'ops', 'chore']);

// Lint every artifact the feature's status says should exist. `status` may be overridden
// to ask "would this feature be valid if it were promoted to X?" (used by set-status/approve).
export function checkFeature(ctx, f, status = f.status) {
  const errors = [];
  const warnings = [];
  const strictFrom = (min) => (atLeast(status, min) ? errors : warnings);

  const specText = f.read('spec.md');
  if (!specText) {
    errors.push('spec.md: missing');
    return { feature: f.name, status, errors, warnings };
  }
  if (!STATUSES.includes(status)) errors.push(`spec.md: unknown status "${status}" (expected: ${STATUSES.join(' → ')})`);
  if (f.meta.id && f.meta.id !== f.id) errors.push(`spec.md: frontmatter id "${f.meta.id}" ≠ folder id "${f.id}"`);

  const spec = parseSpec(specText);
  if (!spec.requirements.length) strictFrom('clarified').push('spec.md: no requirements found (expected "### REQ-n: ..." headings)');
  for (const dup of duplicates(spec.requirements.map((r) => r.id))) errors.push(`spec.md: duplicate ${dup}`);
  for (const dup of duplicates(spec.criteria.map((c) => c.id))) errors.push(`spec.md: duplicate ${dup}`);
  for (const ac of spec.orphans) errors.push(`spec.md:${ac.line}: ${ac.id} is not under any REQ heading`);
  for (const req of spec.requirements) {
    if (!req.criteria.length) strictFrom('clarified').push(`spec.md:${req.line}: ${req.id} has no acceptance criteria`);
    for (const ac of req.criteria) {
      if (ac.req !== req.num) errors.push(`spec.md:${ac.line}: ${ac.id} is listed under ${req.id}`);
      if (!isEars(ac.text)) strictFrom('clarified').push(`spec.md:${ac.line}: ${ac.id} is not EARS (WHEN/IF/WHILE/WHERE/THE … SHALL …)`);
    }
  }
  for (const nfr of spec.nfrs) {
    if (!/\d/.test(nfr.text)) warnings.push(`spec.md:${nfr.line}: ${nfr.id} has no measurable target (no number)`);
  }
  if (spec.clarifications.length) {
    strictFrom('clarified').push(`spec.md: ${spec.clarifications.length} unresolved [NEEDS CLARIFICATION] marker(s)`);
  }
  if (/\{\{[A-Z_]+\}\}/.test(specText)) strictFrom('clarified').push('spec.md: unfilled template placeholders ({{...}})');
  if (atLeast(status, 'approved') && !f.meta.approved_by) errors.push('spec.md: status ≥ approved but approved_by is empty');

  if (atLeast(status, 'planned')) {
    const plan = f.read('plan.md');
    if (!plan) errors.push('plan.md: missing (required from status "planned")');
    else {
      if (/\[NEEDS CLARIFICATION/.test(plan)) errors.push('plan.md: unresolved [NEEDS CLARIFICATION] marker(s)');
      if (!/^#+\s.*constitution check/im.test(plan)) warnings.push('plan.md: no "Constitution Check" section');
      for (const req of spec.requirements) {
        if (!new RegExp(`\\b${req.id}\\b`).test(plan)) warnings.push(`plan.md: ${req.id} is never referenced`);
      }
    }
  }

  let tasks = [];
  if (atLeast(status, 'tasked')) {
    const text = f.read('tasks.md');
    if (!text) errors.push('tasks.md: missing (required from status "tasked")');
    else {
      tasks = parseTasks(text);
      if (!tasks.length) errors.push('tasks.md: no tasks found (expected "- [ ] T001 ...")');
      for (const dup of duplicates(tasks.map((t) => t.id))) errors.push(`tasks.md: duplicate ${dup}`);
      const known = new Set(spec.criteria.map((c) => c.id));
      const covered = new Set();
      for (const t of tasks) {
        for (const ac of t.acs) {
          if (known.has(ac)) covered.add(ac);
          else errors.push(`tasks.md:${t.line}: ${t.id} references unknown ${ac}`);
        }
        if (!t.acs.length && !t.tags.some((tag) => TASK_TAGS_WITHOUT_AC.has(tag))) {
          warnings.push(`tasks.md:${t.line}: ${t.id} maps to no AC (tag it [infra]/[docs] if intentional)`);
        }
      }
      for (const ac of spec.criteria) if (!covered.has(ac.id)) errors.push(`tasks.md: ${ac.id} is not covered by any task`);
    }
  }

  if (atLeast(status, 'implementing') && ctx.config.gates.requireAnalysis) {
    const verdict = readVerdict(f.read('analysis.md'));
    if (!verdict || verdict === 'FAIL') errors.push(`analysis.md: verdict is ${verdict ?? 'missing'} (run /sdd-analyze)`);
  }

  if (atLeast(status, 'verified')) {
    const s = taskSummary(tasks);
    if (s.done !== s.total) errors.push(`tasks.md: ${s.total - s.done} task(s) not done`);
    const verdict = readVerdict(f.read('verification.md'));
    if (verdict !== 'PASS' && verdict !== 'PASS_WITH_WARNINGS') errors.push(`verification.md: verdict is ${verdict ?? 'missing'}`);
    if (ctx.config.gates.requireTraceability) {
      for (const gap of traceFeature(ctx, f).gaps) errors.push(`trace: ${gap}`);
    }
  }

  return { feature: f.name, status, errors, warnings };
}

// ---------- traceability ----------

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'out', 'coverage', '.venv', 'venv', '__pycache__',
  'target', 'bin', 'obj', '.next', '.nuxt', '.turbo', 'vendor', '.gradle', '.idea', '.vscode',
]);
const BINARY_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.svg', '.pdf', '.zip', '.gz', '.tar', '.woff',
  '.woff2', '.ttf', '.eot', '.mp4', '.mp3', '.wasm', '.jar', '.class', '.exe', '.dll', '.so', '.lock',
]);
const TEST_FILE_RE = /(^test_|_test\.[a-z0-9]+$|\.(test|spec)\.[a-z0-9]+$|Tests?\.[a-z0-9]+$|_spec\.[a-z0-9]+$)/i;

// Test files cite criteria with a feature-qualified token, e.g. `it('[001:AC-1.2] rejects ...')`,
// because AC numbering restarts in every feature.
export function scanTestRefs(ctx) {
  const refs = new Map();
  const walk = (dir, everyFileIsTest) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(full, everyFileIsTest || /^(tests?|__tests__|e2e|spec)$/i.test(entry.name));
        continue;
      }
      if (BINARY_EXT.has(extname(entry.name).toLowerCase())) continue;
      if (!everyFileIsTest && !TEST_FILE_RE.test(basename(entry.name))) continue;
      if (statSync(full).size > 1_000_000) continue;
      const rel = relative(ctx.root, full).split('\\').join('/');
      for (const m of readText(full).matchAll(/\b(\d{3}):(AC-\d+\.\d+)\b/g)) {
        const key = `${m[1]}:${m[2]}`;
        if (!refs.has(key)) refs.set(key, new Set());
        refs.get(key).add(rel);
      }
    }
  };
  for (const d of [].concat(ctx.config.paths.tests ?? [])) walk(join(ctx.root, d), true);
  for (const d of [].concat(ctx.config.paths.src ?? [])) walk(join(ctx.root, d), false);
  return refs;
}

export function traceFeature(ctx, f, refs = scanTestRefs(ctx)) {
  const spec = parseSpec(f.read('spec.md') ?? '');
  const tasks = parseTasks(f.read('tasks.md') ?? '');
  const rows = spec.criteria.map((ac) => {
    const ts = tasks.filter((t) => t.acs.includes(ac.id));
    const tests = [...(refs.get(`${f.id}:${ac.id}`) ?? [])];
    return {
      ac: ac.id,
      req: ac.parent,
      text: ac.text,
      tasks: ts.map((t) => t.id),
      tasksDone: ts.length > 0 && ts.every((t) => t.state === 'done'),
      tests,
    };
  });
  const gaps = [];
  for (const r of rows) {
    if (!r.tasks.length) gaps.push(`${r.ac} has no task`);
    if (!r.tests.length) gaps.push(`${r.ac} has no test citing "${f.id}:${r.ac}"`);
  }
  const known = new Set(spec.criteria.map((c) => c.id));
  for (const key of refs.keys()) {
    const [fid, ac] = key.split(':');
    if (fid === f.id && !known.has(ac)) gaps.push(`tests cite ${key}, which is not in spec.md (${[...refs.get(key)].join(', ')})`);
  }
  return { feature: f.name, rows, gaps };
}

export function renderTraceMarkdown(trace) {
  const esc = (s) => s.replace(/\|/g, '\\|');
  const lines = [
    `# Traceability — ${trace.feature}`,
    '',
    '<!-- Generated by `sdd trace --write`. Do not edit by hand. -->',
    '',
    '| AC | REQ | Criterion | Tasks | Tests | Status |',
    '|----|-----|-----------|-------|-------|--------|',
    ...trace.rows.map((r) =>
      `| ${r.ac} | ${r.req ?? '-'} | ${esc(r.text)} | ${r.tasks.join(', ') || '—'} | ${r.tests.map((t) => `\`${t}\``).join('<br>') || '—'} | ${r.tasks.length && r.tests.length ? (r.tasksDone ? '✅' : '🟡') : '❌'} |`,
    ),
    '',
    trace.gaps.length ? `## Gaps\n\n${trace.gaps.map((g) => `- ${g}`).join('\n')}` : '## Gaps\n\nNone.',
    '',
  ];
  return lines.join('\n');
}

// ---------- phase gates ----------

// Preconditions to START a phase. Each returns a list of blocking reasons (empty = open).
const PHASE_PRECONDITIONS = {
  spec: () => [],
  clarify: () => [],
  plan: (ctx, f) => (f.status === 'approved' || atLeast(f.status, 'planned') ? [] : [
    `spec status is "${f.status}"; a human must approve it first: sdd approve ${f.id} --by "<name>"`,
  ]),
  tasks: (ctx, f) => (atLeast(f.status, 'planned') ? [] : [`status is "${f.status}"; run /sdd-plan first`]),
  analyze: (ctx, f) => (atLeast(f.status, 'tasked') ? [] : [`status is "${f.status}"; run /sdd-tasks first`]),
  implement: (ctx, f) => {
    if (!atLeast(f.status, 'tasked')) return [`status is "${f.status}"; run /sdd-tasks first`];
    if (!ctx.config.gates.requireAnalysis) return [];
    const v = readVerdict(f.read('analysis.md'));
    return v && v !== 'FAIL' ? [] : [`analysis.md verdict is ${v ?? 'missing'}; run /sdd-analyze and fix CRITICAL findings`];
  },
  verify: (ctx, f) => {
    if (!atLeast(f.status, 'implementing')) return [`status is "${f.status}"; run /sdd-implement first`];
    const s = taskSummary(parseTasks(f.read('tasks.md') ?? ''));
    return s.done === s.total ? [] : [`${s.total - s.done} task(s) not done (${s.blocked} blocked)`];
  },
  ship: (ctx, f) => (atLeast(f.status, 'verified') ? [] : [`status is "${f.status}"; run /sdd-verify first`]),
};

export const PHASES = Object.keys(PHASE_PRECONDITIONS);

export function gate(ctx, phase, f) {
  const pre = PHASE_PRECONDITIONS[phase];
  if (!pre) return { ok: false, phase, reasons: [`unknown phase "${phase}" (expected: ${PHASES.join(', ')})`] };
  const reasons = [...pre(ctx, f)];
  if (phase !== 'spec' && phase !== 'clarify') reasons.push(...checkFeature(ctx, f).errors);
  return { ok: reasons.length === 0, phase, feature: f.name, reasons };
}

function duplicates(ids) {
  const seen = new Set();
  return [...new Set(ids.filter((id) => seen.has(id) || !seen.add(id)))];
}

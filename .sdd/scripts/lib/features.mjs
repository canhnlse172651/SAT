// Feature discovery + parsing of spec.md / tasks.md into structured data.
import { existsSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { SddError, git, parseFrontmatter, readIf, stripNonContent, STATUSES } from './core.mjs';

const FEATURE_DIR_RE = /^(\d{3})-([a-z0-9][a-z0-9-]*)$/;

export function specsDir(ctx) {
  return join(ctx.root, ctx.config.paths.specs);
}

export function listFeatures(ctx) {
  const dir = specsDir(ctx);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && FEATURE_DIR_RE.test(d.name))
    .map((d) => loadFeature(ctx, d.name))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function loadFeature(ctx, dirName) {
  const [, id, slug] = FEATURE_DIR_RE.exec(dirName);
  const dir = join(specsDir(ctx), dirName);
  const path = (name) => join(dir, name);
  const specText = readIf(path('spec.md'));
  const meta = specText ? parseFrontmatter(specText).data : {};
  return {
    id,
    slug,
    name: dirName,
    dir,
    relDir: relative(ctx.root, dir).split('\\').join('/'),
    status: STATUSES.includes(meta.status) ? meta.status : meta.status || 'draft',
    meta,
    path,
    read: (name) => readIf(path(name)),
  };
}

// Resolve a feature from an explicit ref ("001", "001-slug", a path), $SDD_FEATURE,
// the current git branch, or — failing that — the single active feature.
export function resolveFeature(ctx, ref) {
  const features = listFeatures(ctx);
  if (!features.length) throw new SddError(`No features under ${ctx.config.paths.specs}/. Run: sdd new "<title>"`);

  const byRef = (r) => {
    const m = /(\d{3})(?:-|$|\/|\\)/.exec(String(r).replace(/\\/g, '/') + '/');
    return m ? features.find((f) => f.id === m[1]) : undefined;
  };

  for (const candidate of [ref, process.env.SDD_FEATURE]) {
    if (!candidate) continue;
    const f = byRef(candidate);
    if (f) return f;
    throw new SddError(`Feature "${candidate}" not found.`);
  }

  const branch = git(ctx.root, ['rev-parse', '--abbrev-ref', 'HEAD']);
  const fromBranch = branch && byRef(branch.slice(branch.lastIndexOf('/') + 1));
  if (fromBranch) return fromBranch;

  const active = features.filter((f) => f.status !== 'shipped');
  if (active.length === 1) return active[0];
  if (active.length > 1) {
    throw new SddError(
      `Several active features (${active.map((f) => f.name).join(', ')}). Pass one explicitly or check out its branch.`,
    );
  }
  return features.at(-1);
}

// ---------- spec.md ----------

const REQ_RE = /^#{2,4}\s+\**(REQ-(\d+))\**\b\s*[:.\-–—]?\s*(.*)$/;
const AC_RE = /^\s*[-*]\s+\**(AC-(\d+)\.(\d+))\**\s*[:.\-–—]?\**\s*(.*)$/;
const NFR_RE = /^\s*[-*]\s+\**(NFR-(\d+))\**\s*[:.\-–—]?\**\s*(.*)$/;
const EARS_START_RE = /^(WHEN|IF|WHILE|WHERE|THE)\b/;

export function parseSpec(text) {
  const { data, body } = parseFrontmatter(text);
  const requirements = [];
  const nfrs = [];
  let current = null;
  const content = stripNonContent(body);
  const lines = content.split(/\r?\n/);
  lines.forEach((line, i) => {
    let m;
    if ((m = REQ_RE.exec(line))) {
      current = { id: m[1], num: Number(m[2]), title: m[3].trim(), line: i + 1, criteria: [] };
      requirements.push(current);
    } else if ((m = AC_RE.exec(line))) {
      const ac = { id: m[1], req: Number(m[2]), text: m[4].trim(), line: i + 1, parent: current?.id ?? null };
      (current ? current.criteria : (requirements.orphans ??= [])).push(ac);
    } else if ((m = NFR_RE.exec(line))) {
      nfrs.push({ id: m[1], text: m[3].trim(), line: i + 1 });
    } else if (/^#{1,2}\s/.test(line)) {
      current = null; // a new top-level section ends the current requirement
    }
  });
  const criteria = requirements.flatMap((r) => r.criteria);
  const clarifications = [...content.matchAll(/\[NEEDS CLARIFICATION[^\]]*\]/g)].map((m) => m[0]);
  return { meta: data, requirements, criteria, orphans: requirements.orphans ?? [], nfrs, clarifications };
}

export function isEars(text) {
  return /\bSHALL\b/.test(text) && EARS_START_RE.test(text);
}

// ---------- tasks.md ----------

const TASK_RE = /^\s*[-*]\s+\[([ xX~!])\]\s+\**(T\d{3,})\**\b(.*)$/;
const TASK_STATE = { ' ': 'todo', x: 'done', X: 'done', '~': 'in-progress', '!': 'blocked' };

export function parseTasks(text) {
  const tasks = [];
  stripNonContent(text)
    .split(/\r?\n/)
    .forEach((line, i) => {
      const m = TASK_RE.exec(line);
      if (!m) return;
      const rest = m[3];
      tasks.push({
        id: m[2],
        state: TASK_STATE[m[1]],
        text: rest.replace(/^\s*[:.\-–—]?\s*/, '').trim(),
        tags: [...rest.matchAll(/\[([A-Za-z]+)\]/g)].map((t) => t[1].toLowerCase()),
        acs: [...new Set([...rest.matchAll(/\bAC-\d+\.\d+\b/g)].map((t) => t[0]))],
        line: i + 1,
      });
    });
  return tasks;
}

export function taskSummary(tasks) {
  const count = (s) => tasks.filter((t) => t.state === s).length;
  return {
    total: tasks.length,
    done: count('done'),
    todo: count('todo'),
    inProgress: count('in-progress'),
    blocked: count('blocked'),
    next: tasks.find((t) => t.state === 'in-progress') ?? tasks.find((t) => t.state === 'todo') ?? null,
  };
}

// verification.md / analysis.md carry a machine-readable verdict line.
export function readVerdict(text) {
  const m = text && /^\s*\**Verdict\**\s*:\s*\**\s*(PASS|FAIL|PASS_WITH_WARNINGS)\b/im.exec(text);
  return m ? m[1].toUpperCase() : null;
}

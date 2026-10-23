// State transitions. Every status change goes through here so the rules live in one place:
// forward moves must pass the destination's checks; only a human may approve a spec.
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { SddError, STATUSES, statusIndex, git, readText, writeText, setFrontmatter, slugify, today } from './core.mjs';
import { listFeatures, specsDir, loadFeature } from './features.mjs';
import { checkFeature } from './checks.mjs';

export function newFeature(ctx, title, { slug, branch = true } = {}) {
  if (!title?.trim()) throw new SddError('Usage: sdd new "<feature title>" [--slug short-name] [--no-branch]');
  const s = slugify(slug || title);
  if (!s) throw new SddError('Could not derive a slug from the title; pass --slug.');
  const features = listFeatures(ctx);
  const id = String((features.length ? Number(features.at(-1).id) : 0) + 1).padStart(3, '0');
  const name = `${id}-${s}`;
  const branchName = `${ctx.config.git.branchPrefix}${name}`;
  const dir = join(specsDir(ctx), name);
  if (existsSync(dir)) throw new SddError(`${dir} already exists.`);

  let createdBranch = null;
  if (branch && git(ctx.root, ['rev-parse', '--git-dir'])) {
    createdBranch = git(ctx.root, ['checkout', '-b', branchName]) !== null ? branchName : null;
  }

  mkdirSync(dir, { recursive: true });
  const template = readText(join(ctx.root, '.sdd', 'templates', 'spec-template.md'));
  const fill = { FEATURE_ID: id, FEATURE_SLUG: s, FEATURE_TITLE: title.trim(), DATE: today(), BRANCH: createdBranch ?? branchName };
  writeText(join(dir, 'spec.md'), template.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => fill[k] ?? m));
  return { id, slug: s, name, dir: `${ctx.config.paths.specs}/${name}`, spec: `${ctx.config.paths.specs}/${name}/spec.md`, branch: createdBranch };
}

const insideAgent = () => Boolean(process.env.CLAUDECODE) && process.env.CLAUDECODE !== '0';

export function approve(ctx, f, by) {
  if (!by) throw new SddError('Usage: sdd approve <feature> --by "<approver name>"');
  if (ctx.config.gates.humanApproval.spec && insideAgent()) {
    throw new SddError('Spec approval is a human gate (gates.humanApproval.spec=true). Agents must not approve specs.');
  }
  if (f.status !== 'clarified') throw new SddError(`Only a "clarified" spec can be approved (${f.name} is "${f.status}").`);
  const { errors } = checkFeature(ctx, { ...f, meta: { ...f.meta, approved_by: by } }, 'approved');
  if (errors.length) throw new SddError(`Cannot approve ${f.name}:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
  writeStatus(f, { status: 'approved', approved_by: by, approved_at: today() });
}

export function setStatus(ctx, f, target, { reason } = {}) {
  if (!STATUSES.includes(target)) throw new SddError(`Unknown status "${target}". Expected: ${STATUSES.join(' → ')}`);
  const [from, to] = [statusIndex(f.status), statusIndex(target)];
  if (target === 'approved' && from < to) throw new SddError('Use `sdd approve` to approve a spec.');
  if (to === from) return;

  if (to < from) {
    if (!reason) throw new SddError('Moving a feature backwards needs --reason "<why>".');
    const updates = { status: target, reopened_reason: reason };
    if (to < statusIndex('approved')) Object.assign(updates, { approved_by: '', approved_at: '' });
    writeStatus(f, updates);
    return;
  }
  if (to !== from + 1) throw new SddError(`Cannot jump from "${f.status}" to "${target}"; advance one step at a time.`);
  const { errors } = checkFeature(ctx, f, target);
  if (errors.length) throw new SddError(`Cannot move ${f.name} to "${target}":\n${errors.map((e) => `  - ${e}`).join('\n')}`);
  writeStatus(f, { status: target, updated: today() });
}

function writeStatus(f, updates) {
  const file = f.path('spec.md');
  writeText(file, setFrontmatter(readText(file), updates));
}

const TASK_MARK = { todo: ' ', doing: '~', done: 'x', blocked: '!' };

export function setTaskState(ctx, f, taskId, state, note) {
  if (!(state in TASK_MARK)) throw new SddError(`Task state must be one of: ${Object.keys(TASK_MARK).join(', ')}`);
  const file = f.path('tasks.md');
  if (!existsSync(file)) throw new SddError(`${f.name} has no tasks.md`);
  const text = readText(file);
  const re = new RegExp(`^(\\s*[-*]\\s+\\[)[ xX~!](\\]\\s+\\**${taskId}\\b)(.*)$`, 'm');
  if (!re.test(text)) throw new SddError(`${taskId} not found in ${f.name}/tasks.md`);
  const updated = text.replace(re, (m, a, b, rest) => {
    const clean = rest.replace(/\s+⛔ BLOCKED:.*$/, '');
    return `${a}${TASK_MARK[state]}${b}${clean}${state === 'blocked' && note ? ` ⛔ BLOCKED: ${note}` : ''}`;
  });
  writeText(file, updated);
  return loadFeature(ctx, f.name);
}

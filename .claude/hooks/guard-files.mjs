#!/usr/bin/env node
// PreToolUse(Edit|Write|MultiEdit|NotebookEdit): protect secrets, generated files, the harness itself,
// the constitution, and the approval state of specs. Escape hatches are env vars a HUMAN sets in
// .claude/settings.local.json (never committed): SDD_ALLOW_HARNESS_EDIT, SDD_ALLOW_CONSTITUTION_EDIT,
// SDD_ALLOW_SPEC_EDIT.
import { basename, join } from 'node:path';
import { readInput, projectDir, relPath, loadSddConfig, readFileIf, block, allow } from './_lib.mjs';
import { parseFrontmatter, atLeast } from '../../.sdd/scripts/lib/core.mjs';

const input = await readInput();
const ti = input.tool_input ?? {};
const file = ti.file_path ?? ti.notebook_path;
if (!file) allow();

const root = projectDir(input);
const rel = relPath(root, file);
const name = basename(rel);
const flag = (k) => process.env[k] === '1';

// File content as it would be after this tool call.
function simulate(before) {
  if (typeof ti.content === 'string') return ti.content;
  const apply = (text, e) => (e.replace_all ? text.split(e.old_string).join(e.new_string) : text.replace(e.old_string, () => e.new_string));
  const edits = Array.isArray(ti.edits) ? ti.edits : [ti];
  return edits.reduce((text, e) => (typeof e.old_string === 'string' ? apply(text, e) : text), before);
}

// 1. Secrets and key material.
if (/^\.env(\..+)?$/.test(name) && !/\.(example|sample|template)$/.test(name)) {
  block(`${rel} holds secrets. Document variables in .env.example instead.`);
}
if (/\.(pem|key|p12|pfx|jks|keystore)$/i.test(name) || /^id_(rsa|ed25519|ecdsa)/.test(name)) {
  block(`${rel} looks like key material.`);
}

// 2. Generated / VCS internals.
if (rel === '.git' || rel.startsWith('.git/')) block('git internals are off limits.');
const LOCKFILES = new Set(['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb', 'poetry.lock', 'Pipfile.lock',
  'uv.lock', 'Cargo.lock', 'go.sum', 'composer.lock', 'Gemfile.lock', 'packages.lock.json']);
if (LOCKFILES.has(name)) block(`${name} is generated. Change dependencies with the package manager.`);

// 3. The harness: agents must not rewrite their own guardrails or instructions.
const HARNESS = [/^\.claude\//, /^CLAUDE\.md$/, /^\.sdd\/scripts\//, /^\.sdd\/templates\//, /^\.mcp\.json$/];
if (HARNESS.some((re) => re.test(rel)) && !flag('SDD_ALLOW_HARNESS_EDIT')) {
  block(`${rel} is part of the agent harness (instructions/guardrails). Propose the change to the user instead.`);
}
if (rel === '.sdd/config.json' && !flag('SDD_ALLOW_HARNESS_EDIT')) {
  const before = readFileIf(join(root, rel)) ?? '{}';
  let gatesChanged;
  try {
    gatesChanged = JSON.stringify(JSON.parse(before).gates) !== JSON.stringify(JSON.parse(simulate(before)).gates);
  } catch {
    block('.sdd/config.json would no longer be valid JSON after this edit.');
  }
  if (gatesChanged) block('quality gates in .sdd/config.json are set by humans. Agents may edit toolchain/paths only.');
}

// 4. Constitution.
if (rel === 'docs/constitution.md' && !flag('SDD_ALLOW_CONSTITUTION_EDIT')) {
  block('the constitution is amended only through a human-approved PR.');
}

// 5. Specs: status/approval fields are CLI-owned; approved specs are a frozen contract.
const specsDir = (loadSddConfig(root).paths?.specs ?? 'specs').replace(/\/+$/, '');
if (new RegExp(`^${specsDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/\\d{3}-[^/]+/spec\\.md$`).test(rel)) {
  const before = readFileIf(join(root, rel));
  const oldMeta = before ? parseFrontmatter(before).data : {};
  if (before && atLeast(oldMeta.status, 'approved') && !flag('SDD_ALLOW_SPEC_EDIT')) {
    block(`${rel} is approved (status: ${oldMeta.status}) and is now the contract. To change requirements, reopen it with ` +
      '`node .sdd/scripts/sdd.mjs set-status <id> draft --reason "<why>"` — it will need human re-approval.');
  }
  const LOCKED = ['status', 'approved_by', 'approved_at'];
  const newMeta = parseFrontmatter(simulate(before ?? '')).data;
  const changed = before
    ? LOCKED.filter((k) => (oldMeta[k] ?? '') !== (newMeta[k] ?? ''))
    : LOCKED.filter((k) => (k === 'status' ? (newMeta[k] ?? 'draft') !== 'draft' : newMeta[k]));
  if (changed.length) block(`${changed.join(', ')} in ${rel} are changed only via the sdd CLI (set-status / approve).`);
}

allow();

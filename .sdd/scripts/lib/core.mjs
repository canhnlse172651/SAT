// Core helpers shared by every `sdd` subcommand. Zero dependencies on purpose:
// the harness must run before the project has chosen (or installed) a stack.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';

export class SddError extends Error {}

// Feature lifecycle. Order matters: gates compare positions in this list.
export const STATUSES = [
  'draft',        // spec being written
  'clarified',    // ambiguities resolved, ready for human review
  'approved',     // human signed off the spec (the contract)
  'planned',      // plan.md written
  'tasked',       // tasks.md written
  'implementing', // tasks being executed
  'verified',     // all gates green, verification.md = PASS
  'shipped',      // merged / released
];

export const statusIndex = (s) => STATUSES.indexOf(s);
export const atLeast = (s, min) => statusIndex(s) >= statusIndex(min);

const DEFAULT_CONFIG = {
  project: { name: 'app', docsLanguage: 'en' },
  paths: { specs: 'specs', src: ['src'], tests: ['tests'], adr: 'docs/adr' },
  toolchain: {},
  gates: {
    humanApproval: { spec: true, production: true },
    requireAnalysis: true,
    requireTraceability: true,
    maxFixAttempts: 3,
  },
  git: { branchPrefix: 'feat/', baseBranch: 'main' },
  pipeline: { claudeBin: 'claude', maxTurnsPerPhase: 120, permissionMode: 'acceptEdits', model: null },
};

export function findRoot(start = process.cwd()) {
  if (process.env.SDD_ROOT) return resolve(process.env.SDD_ROOT);
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, '.sdd', 'config.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) throw new SddError('Not inside an SDD project (no .sdd/config.json found).');
    dir = parent;
  }
}

export function loadContext(start) {
  const root = findRoot(start);
  const raw = JSON.parse(readText(join(root, '.sdd', 'config.json')));
  return { root, config: deepMerge(DEFAULT_CONFIG, raw) };
}

function deepMerge(base, over) {
  if (!isPlainObject(base) || !isPlainObject(over)) return over === undefined ? base : over;
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) out[k] = k in base ? deepMerge(base[k], v) : v;
  return out;
}

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export function readText(file) {
  return readFileSync(file, 'utf8').replace(/^﻿/, '');
}

export function readIf(file) {
  return existsSync(file) ? readText(file) : null;
}

export function writeText(file, text) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text, 'utf8');
}

export function git(root, args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

// Minimal YAML frontmatter: flat `key: value` pairs only. That is all our templates use.
const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

export function parseFrontmatter(text) {
  const m = FM_RE.exec(text);
  if (!m) return { data: {}, body: text };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_-]+):[ \t]*(.*)$/.exec(line);
    if (!kv) continue;
    let v = kv[2].trim();
    if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
    data[kv[1]] = v;
  }
  return { data, body: text.slice(m[0].length) };
}

export function setFrontmatter(text, updates) {
  const m = FM_RE.exec(text);
  if (!m) throw new SddError('File has no frontmatter block.');
  const eol = m[0].includes('\r\n') ? '\r\n' : '\n';
  const lines = m[1].split(/\r?\n/);
  for (const [key, value] of Object.entries(updates)) {
    const idx = lines.findIndex((l) => l.startsWith(`${key}:`));
    const line = `${key}: ${value ?? ''}`.trimEnd();
    if (idx >= 0) lines[idx] = line;
    else lines.push(line);
  }
  return `---${eol}${lines.join(eol)}${eol}---${eol}` + text.slice(m[0].length);
}

// Strip HTML comments and fenced code so template guidance/examples are never parsed as content.
export function stripNonContent(text) {
  return text
    .replace(/<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, ''))
    .replace(/^(```|~~~)[\s\S]*?^\1/gm, (c) => c.replace(/[^\n]/g, ''));
}

export function slugify(title) {
  return title
    .replace(/[đĐ]/g, 'd')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-')
    .slice(0, 6)
    .join('-')
    .slice(0, 48)
    .replace(/-+$/g, '');
}

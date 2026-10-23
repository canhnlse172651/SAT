#!/usr/bin/env node
// SessionStart: inject a compact snapshot of pipeline state so every session (and every resumed
// headless run) starts oriented. stdout from this hook is added to Claude's context.
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { readInput, projectDir, loadSddConfig } from './_lib.mjs';

const input = await readInput();
const root = projectDir(input);
const run = (cmd, args) => {
  try {
    return execFileSync(cmd, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 10_000 }).trim();
  } catch {
    return null;
  }
};

const toolchain = loadSddConfig(root).toolchain ?? {};
const configured = Object.entries(toolchain).filter(([, v]) => v).map(([k]) => k);
const lines = ['## SDD session context (auto-generated)'];
lines.push(`- Branch: ${run('git', ['rev-parse', '--abbrev-ref', 'HEAD']) ?? '(not a git repo / no commits yet)'}`);
lines.push(configured.length
  ? `- Toolchain configured: ${configured.join(', ')}`
  : '- Toolchain: NOT BOOTSTRAPPED — run /sdd-init before implementing features.');
if (process.env.SDD_HEADLESS === '1') lines.push('- Mode: HEADLESS — do not ask questions; record assumptions; leave a clean, committed tree.');

const status = run(process.execPath, [join(root, '.sdd', 'scripts', 'sdd.mjs'), 'status']);
if (status) lines.push('', '```', status, '```');
const current = run(process.execPath, [join(root, '.sdd', 'scripts', 'sdd.mjs'), 'current']);
if (current) {
  const next = run(process.execPath, [join(root, '.sdd', 'scripts', 'sdd.mjs'), 'next-task']);
  lines.push(`- Active feature: ${current}${next ? `\n- Next task: ${next}` : ''}`);
}
process.stdout.write(lines.join('\n') + '\n');

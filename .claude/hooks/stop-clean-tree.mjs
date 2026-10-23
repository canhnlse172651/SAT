#!/usr/bin/env node
// Stop: in headless runs (SDD_HEADLESS=1) a session may not end with uncommitted changes — the next
// session starts from git + progress.md, so half-finished edits would be lost or misread.
// Interactive sessions are never blocked. Blocks at most once per stop (stop_hook_active guard).
import { execFileSync } from 'node:child_process';
import { readInput, projectDir } from './_lib.mjs';

const input = await readInput();
if (process.env.SDD_HEADLESS !== '1' || input.stop_hook_active) process.exit(0);

let dirty = '';
try {
  dirty = execFileSync('git', ['status', '--porcelain'], { cwd: projectDir(input), encoding: 'utf8' }).trim();
} catch {
  process.exit(0);
}
if (!dirty) process.exit(0);

process.stderr.write(
  'Headless session is ending with uncommitted changes:\n' + dirty.split('\n').slice(0, 20).join('\n') + '\n' +
  'Commit finished work (one task per commit), or revert partial work and mark the task ' +
  '`todo`/`blocked` with `node .sdd/scripts/sdd.mjs task <T###> <state> --note "..."`, then append to progress.md.\n',
);
process.exit(2);

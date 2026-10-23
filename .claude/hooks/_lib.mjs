// Shared helpers for Claude Code hooks. Hooks receive the event as JSON on stdin.
// Blocking contract (PreToolUse / Stop): exit code 2 + a reason on stderr, which Claude sees.
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';

export async function readInput() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

export function projectDir(input) {
  return resolve(process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd());
}

// Project-relative path with forward slashes; starts with "../" when outside the project.
export function relPath(root, file) {
  const abs = isAbsolute(file) ? file : join(root, file);
  return relative(root, abs).split('\\').join('/');
}

export function loadSddConfig(root) {
  try {
    return JSON.parse(readFileSync(join(root, '.sdd', 'config.json'), 'utf8').replace(/^\uFEFF/, ''));
  } catch {
    return {};
  }
}

export function readFileIf(path) {
  return existsSync(path) ? readFileSync(path, 'utf8').replace(/^\uFEFF/, '') : null;
}

export function block(reason) {
  process.stderr.write(`⛔ Blocked by project guardrail: ${reason}\n`);
  process.exit(2);
}

export const allow = () => process.exit(0);

export const TEST_FILE_RE = /(^test_|_test\.[a-z0-9]+$|\.(test|spec)\.[a-z0-9]+$|Tests?\.[a-z0-9]+$|_spec\.[a-z0-9]+$)/i;

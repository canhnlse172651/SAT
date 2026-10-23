#!/usr/bin/env node
// PostToolUse(Edit|Write|MultiEdit): run the project formatter (toolchain.format) on the edited file.
// Never blocks: formatting problems surface later through `sdd run lint`.
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { readInput, projectDir, relPath, loadSddConfig } from './_lib.mjs';

const input = await readInput();
const file = input.tool_input?.file_path;
const root = projectDir(input);
const format = loadSddConfig(root).toolchain?.format;
if (!file || !format) process.exit(0);

const rel = relPath(root, file);
const skip = rel.startsWith('../') || rel.startsWith('.claude/') || rel.startsWith('.sdd/') || /\.(md|lock)$/i.test(rel);
if (skip || !existsSync(file)) process.exit(0);

spawnSync(`${format} "${rel}"`, { cwd: root, shell: true, stdio: 'ignore', timeout: 30_000 });
process.exit(0);

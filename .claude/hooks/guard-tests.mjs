#!/usr/bin/env node
// Attached to the implementer subagent only (see its frontmatter): tests are owned by the
// test-engineer, so the agent that makes tests pass may never edit or create them.
import { basename } from 'node:path';
import { readInput, projectDir, relPath, loadSddConfig, block, allow, TEST_FILE_RE } from './_lib.mjs';

const input = await readInput();
const file = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
if (!file) allow();

const root = projectDir(input);
const rel = relPath(root, file);
const testRoots = [].concat(loadSddConfig(root).paths?.tests ?? ['tests']).map((d) => d.replace(/\/+$/, '') + '/');
const inTestDir = testRoots.some((d) => rel.startsWith(d)) || /(^|\/)(__tests__|e2e)\//.test(rel);

if (inTestDir || TEST_FILE_RE.test(basename(rel))) {
  block(`${rel} is a test file, owned by the test-engineer. If a test is wrong, report it with evidence ` +
    'instead of changing it; if one is missing, report which AC lacks coverage.');
}
allow();

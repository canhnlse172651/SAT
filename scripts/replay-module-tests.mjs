#!/usr/bin/env node
// Replays the scripts the QA agent (/test-module) saved for a module, without an AI in the loop:
//   specs/NNN-*/testing/e2e/TC-###.spec.ts  →  specs/NNN-*/testing/runs/<YYYY-MM-DD-HHmm>-replay/{results.json,report.md}
// Usage: node .sdd/scripts/sdd.mjs run test:modules -- <NNN> [TC-001 TC-004 …]
// Exit code = Playwright's (0 when every replayed script passed).
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const [id, ...tcs] = process.argv.slice(2);
if (!/^\d{3}$/.test(id ?? '')) {
  console.error('Usage: node .sdd/scripts/sdd.mjs run test:modules -- <NNN> [TC-001 …]');
  process.exit(2);
}
const folder = readdirSync(join(ROOT, 'specs')).find((d) => d.startsWith(`${id}-`));
const testDir = folder && join(ROOT, 'specs', folder, 'testing', 'e2e');
if (!testDir || !existsSync(testDir)) {
  console.error(
    `No saved scripts for ${id}: run /test-module ${id} first (expects specs/${id}-*/testing/e2e/).`,
  );
  process.exit(2);
}

// Vietnam time stamp for the run folder, e.g. 2026-10-23-1530
const vn = new Date(Date.now() + 7 * 3600_000).toISOString();
const stamp = `${vn.slice(0, 10)}-${vn.slice(11, 13)}${vn.slice(14, 16)}`;
const runDir = join(ROOT, 'specs', folder, 'testing', 'runs', `${stamp}-replay`);
mkdirSync(runDir, { recursive: true });

const filters = tcs.map((tc) => `${tc}\\b`);
const res = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  [
    'playwright',
    'test',
    '-c',
    'playwright.modules.config.ts',
    ...(filters.length ? ['-g', filters.join('|')] : []),
  ],
  {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, SAT_MODULE_TEST_DIR: testDir, SAT_MODULE_RUN_DIR: runDir },
  },
);

// Short Markdown summary next to the JSON results (the QA agent's own runs write a richer report).
const rows = [];
const resultsFile = join(runDir, 'results.json');
if (existsSync(resultsFile)) {
  const walk = (suite) => {
    for (const spec of suite.specs ?? []) {
      const r = spec.tests?.[0]?.results?.at(-1);
      rows.push(
        `| ${spec.title} | ${r?.status === 'passed' ? 'Pass' : 'Fail'} | ${r?.duration ?? '—'} ms |`,
      );
    }
    for (const s of suite.suites ?? []) walk(s);
  };
  for (const s of JSON.parse(readFileSync(resultsFile, 'utf8')).suites ?? []) walk(s);
}
const pass = rows.filter((r) => r.includes('| Pass |')).length;
writeFileSync(
  join(runDir, 'report.md'),
  `# Replay ${id} — ${stamp}\n\nChạy lại script đã lưu (không có AI), ${pass}/${rows.length} Pass.\n\n` +
    `| Test | Kết quả | Thời gian |\n|------|---------|-----------|\n${rows.join('\n')}\n`,
);
console.log(`\nReplay ${id}: ${pass}/${rows.length} Pass → ${relative(ROOT, runDir)}`);
process.exit(res.status ?? 1);

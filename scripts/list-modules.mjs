#!/usr/bin/env node
// Prints the module list (scope + live state) as a compact table — used by `/module` without an argument.
// Usage: node scripts/list-modules.mjs [--all]   (--all also lists deferred modules)
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPECS = join(ROOT, 'specs');
execFileSync(process.execPath, [join(ROOT, 'scripts', 'sync-state.mjs')], {
  cwd: ROOT,
  stdio: 'ignore',
});

const VN = {
  draft: 'Nháp',
  clarified: 'Đã làm rõ',
  approved: 'Đã duyệt',
  planned: 'Có plan',
  tasked: 'Có task',
  implementing: 'Đang code',
  verified: 'Đã kiểm chứng',
  shipped: 'Đã ship',
};
const all = process.argv.includes('--all');
const rows = readdirSync(SPECS, { withFileTypes: true })
  .filter(
    (d) =>
      d.isDirectory() && /^\d{3}-/.test(d.name) && existsSync(join(SPECS, d.name, 'state.json')),
  )
  .map((d) => JSON.parse(readFileSync(join(SPECS, d.name, 'state.json'), 'utf8')))
  .filter((s) => all || s.mvp)
  .sort((a, b) => (a.wave ?? 99) - (b.wave ?? 99) || a.id.localeCompare(b.id));

const cell = (s, w) => (s.length > w ? s.slice(0, w - 1) + '…' : s.padEnd(w));
console.log(
  `${cell('ID', 4)} ${cell('Module', 26)} ${cell('Wave', 4)} ${cell('Trạng thái', 14)} ${cell('Task', 7)} Bước tiếp`,
);
for (const s of rows) {
  const tasks = s.tasks.total ? `${s.tasks.done}/${s.tasks.total}` : '—';
  console.log(
    `${cell(s.id, 4)} ${cell(s.name, 26)} ${cell(String(s.wave ?? '—'), 4)} ${cell(s.mvp ? (VN[s.status] ?? s.status) : 'Hoãn', 14)} ${cell(tasks, 7)} ${s.nextAction}`,
  );
}
const ready = rows.filter(
  (s) => s.mvp && ['approved', 'planned', 'tasked', 'implementing'].includes(s.status),
);
console.log(
  ready.length
    ? `\nSẵn sàng implement: ${ready.map((s) => `/module ${s.id}`).join(', ')}`
    : '\nChưa module nào được duyệt để implement (cần: spec sẵn sàng → node .sdd/scripts/sdd.mjs approve NNN --by "Tên").',
);

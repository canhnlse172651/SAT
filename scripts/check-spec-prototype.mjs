#!/usr/bin/env node
// Is the prototype (specs/screen-flow-design.html) consistent with the module specs?
// Cheap, evidence-based check (no AI):
//   1. every screen ID an AC references exists in the prototype;
//   2. every UI string an AC quotes verbatim ("…" — button, tab, status, title, message) appears in the prototype,
//      after normalisation. Placeholders (N, x/y, HH:mm…), sentence fragments and "must NOT show" strings are skipped.
// Missing *labels* usually mean the prototype or the spec drifted; missing *messages* are mostly edge-case errors the
// prototype does not simulate. Usage: node scripts/check-spec-prototype.mjs [NNN ...] [--all-missing]
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SPECS = join(dirname(fileURLToPath(import.meta.url)), '..', 'specs');
const registry = JSON.parse(readFileSync(join(SPECS, 'modules.json'), 'utf8'));
const deferred = new Set(registry.modules.filter((m) => m.mvp === false).map((m) => m.id));
const args = process.argv.slice(2);
const only = args.filter((a) => /^\d{3}$/.test(a));
const showAll = args.includes('--all-missing');

const raw = readFileSync(join(SPECS, 'screen-flow-design.html'), 'utf8').replace(
  /\\u([0-9a-f]{4})/gi,
  (_, h) => String.fromCharCode(parseInt(h, 16)),
);
const norm = (s) =>
  s
    .toLowerCase()
    .replace(/&quot;|&amp;|[“”"'’‘]/g, '')
    .replace(/^[+\s›‹→←]+|[.:!?…\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
// Accessible names count as UI text too (icon buttons, popovers): aria-label / title / placeholder values.
const attrs = [...raw.matchAll(/(?:aria-label|title|placeholder)="([^"$]+)"/g)]
  .map((m) => m[1])
  .join(' | ');
const proto = norm(raw.replace(/<[^>]+>/g, ' ') + ' | ' + attrs);
const protoScreens = new Set([...raw.matchAll(/\b([ASTQ]\d{2})\b/g)].map((m) => m[1]));
// Sample values ("90/100", "8 bước học · 5 …", "45%") are examples in the spec, not fixed labels.
const PLACEHOLDER =
  /(?<!\p{L})[NXYZnxyrm](?!\p{L})|HH:mm|dd\/|[[\]{}<>]|x\s*\/\s*y|\d+\s*·|\d+\s*\/\s*\d+|\d+%/u;
const FRAGMENT =
  /^[,;(—–-]|^(kèm|với|và|cùng|trên|của|hay|khi|dùng|ở|THE SYSTEM|ví dụ|tương đương)(?=\s|$)|≠|^[a-z ]+$|THE SYSTEM|\s(và|hoặc)$|^[)\]]|^(chỉ|trình bày|để)\s/i;
const MESSAGE = /vui lòng|không |thất bại|tối đa|phải |chưa |hãy |đã hết|bạn |lỗi|hết hạn/i;
const NEGATIVE = /không (hiển thị|còn|có|dùng)|bỏ /i;

let labels = 0,
  messages = 0,
  quoted = 0,
  problems = 0;
for (const d of readdirSync(SPECS)
  .filter((x) => /^\d{3}-/.test(x))
  .sort()) {
  const id = d.slice(0, 3);
  if (deferred.has(id) || (only.length && !only.includes(id))) continue;
  const md = readFileSync(join(SPECS, d, 'spec.md'), 'utf8');
  const acs = [...md.matchAll(/^- (AC-\d+\.\d+):\s*(.+)$/gm)];
  const screens = new Set(
    acs.flatMap(([, , t]) => [...t.matchAll(/\b([ASTQ]\d{2})\b/g)].map((m) => m[1])),
  );
  const missingScreens = [...screens].filter((s) => !protoScreens.has(s));
  const seen = new Set(),
    missLabels = [],
    missMsgs = [];
  for (const [, ac, text] of acs) {
    const t = text.replace(/[“”]/g, '"');
    for (const m of t.matchAll(/"([^"]{4,80})"/g)) {
      const q = m[1].trim();
      const key = q.toLowerCase();
      if (seen.has(key) || PLACEHOLDER.test(q) || FRAGMENT.test(q) || /\.\.\.|…/.test(q)) continue;
      if (NEGATIVE.test(t.slice(Math.max(0, m.index - 160), m.index))) continue; // a "must not show" requirement
      if (/ví dụ\s*$/i.test(t.slice(Math.max(0, m.index - 20), m.index))) continue; // a sample value, not a fixed label
      seen.add(key);
      quoted++;
      if (proto.includes(norm(q))) continue;
      (MESSAGE.test(q) ? missMsgs : missLabels).push(`${ac}: ${q}`);
    }
  }
  labels += missLabels.length;
  messages += missMsgs.length;
  const bad = missingScreens.length + missLabels.length;
  problems += bad;
  console.log(
    `${bad ? '✗' : '✓'} ${d}: screens ${screens.size}${missingScreens.length ? ` (không có trong prototype: ${missingScreens.join(', ')})` : ''} · nhãn thiếu ${missLabels.length} · thông báo thiếu ${missMsgs.length}`,
  );
  missLabels.forEach((l) => console.log(`    [nhãn] ${l}`));
  if (showAll) missMsgs.forEach((l) => console.log(`    [thông báo] ${l}`));
}
console.log(
  `\n${quoted} câu chữ giao diện được kiểm · nhãn thiếu ${labels} · thông báo thiếu ${messages}${showAll ? '' : ' (xem chi tiết: --all-missing)'}`,
);
if (problems) process.exitCode = 1;

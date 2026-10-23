#!/usr/bin/env node
// Checks that every specs/NNN-slug/spec.html mirrors its spec.md (the machine-checked contract):
//  - every AC-n.m row exists in spec.html with the same EARS text (and no extra rows),
//  - every NFR-n row has the same text,
//  - screen links use only known screen IDs,
//  - Mermaid sequence-diagram message lines contain no ";" (it breaks the diagram).
// Usage: node scripts/check-spec-html.mjs [NNN ...]     Exit code 1 when a problem is found.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SPECS = join(dirname(fileURLToPath(import.meta.url)), '..', 'specs');
// Screen IDs of the current inventory (docs/steering/product.md). Deferred IDs are allowed in links.
const SCREENS = new Set([
  ...['A01', 'A02', 'A03', 'A04', 'A05'],
  ...Array.from({ length: 21 }, (_, i) => `T${String(i + 1).padStart(2, '0')}`),
  ...Array.from({ length: 12 }, (_, i) => `S${String(i + 1).padStart(2, '0')}`),
  // Screens added later by new modules are declared in specs/modules.json → modules[].screens.
  ...JSON.parse(readFileSync(join(SPECS, 'modules.json'), 'utf8')).modules.flatMap(
    (m) => m.screens ?? [],
  ),
]);

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
const norm = (s) =>
  s
    .replace(/\*\*|`/g, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
const fromHtml = (s) => norm(decode(s.replace(/<[^>]+>/g, '')));
const fromMd = (s) => norm(s);

const only = process.argv.slice(2);
const dirs = readdirSync(SPECS, { withFileTypes: true })
  .filter(
    (d) =>
      d.isDirectory() &&
      /^\d{3}-/.test(d.name) &&
      (!only.length || only.includes(d.name.slice(0, 3))),
  )
  .map((d) => d.name);

let problems = 0;
for (const d of dirs) {
  const mdPath = join(SPECS, d, 'spec.md');
  const htmlPath = join(SPECS, d, 'spec.html');
  if (!existsSync(htmlPath)) {
    console.log(`- ${d}: no spec.html (skipped)`);
    continue;
  }
  const md = readFileSync(mdPath, 'utf8');
  const html = readFileSync(htmlPath, 'utf8');
  const out = [];

  // Acceptance criteria
  const mdAc = new Map(
    [...md.matchAll(/^- (AC-\d+\.\d+):\s*(.+)$/gm)].map((m) => [m[1], fromMd(m[2])]),
  );
  const htmlAc = new Map();
  for (const m of html.matchAll(/<tr[^>]*id="(AC-\d+\.\d+)"[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cell = m[2].match(/<td[^>]*class="[^"]*ears[^"]*"[^>]*>([\s\S]*?)<\/td>/);
    htmlAc.set(m[1], cell ? fromHtml(cell[1]) : '');
  }
  const missing = [...mdAc.keys()].filter((k) => !htmlAc.has(k));
  const extra = [...htmlAc.keys()].filter((k) => !mdAc.has(k));
  const differ = [...mdAc.keys()].filter((k) => htmlAc.has(k) && htmlAc.get(k) !== mdAc.get(k));
  if (missing.length) out.push(`AC missing in spec.html: ${missing.join(', ')}`);
  if (extra.length) out.push(`AC rows in spec.html but not in spec.md: ${extra.join(', ')}`);
  if (differ.length) out.push(`AC text differs: ${differ.join(', ')}`);

  // Non-functional requirements
  const badNfr = [];
  for (const m of md.matchAll(/^- (NFR-\d+):\s*(.+)$/gm)) {
    const row = html.match(new RegExp(`<tr[^>]*>\\s*<td class="id">${m[1]}</td>([\\s\\S]*?)</tr>`));
    if (!row) {
      badNfr.push(`${m[1]} (missing)`);
      continue;
    }
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => fromHtml(c[1]));
    const want = fromMd(m[2]);
    if (cells.join(': ') !== want && !want.endsWith(cells.at(-1) ?? '\u0000')) badNfr.push(m[1]);
  }
  if (badNfr.length) out.push(`NFR text differs: ${badNfr.join(', ')}`);

  // Screen links and Mermaid
  const screens = new Set(
    [...html.matchAll(/screen-flow-design\.html#([A-Z]\d{2})/g)].map((m) => m[1]),
  );
  const unknown = [...screens].filter((s) => !SCREENS.has(s));
  if (unknown.length) out.push(`unknown screen IDs linked: ${unknown.join(', ')}`);
  const semis = [];
  for (const block of html.matchAll(/<pre class="mermaid">\s*sequenceDiagram([\s\S]*?)<\/pre>/g)) {
    for (const line of block[1].split('\n'))
      if (/(-{1,2}>>|-{1,2}x|-{1,2}\))/.test(line) && line.includes(';'))
        semis.push(line.trim().slice(0, 60));
  }
  if (semis.length) out.push(`";" in sequence-diagram messages: ${semis.join(' | ')}`);

  problems += out.length;
  console.log(
    `${out.length ? '✗' : '✓'} ${d}: ${mdAc.size} AC, ${md.match(/^- NFR-\d+:/gm)?.length ?? 0} NFR`,
  );
  out.forEach((o) => console.log(`    ${o}`));
}
if (problems) {
  console.log(`\n${problems} problem(s). spec.md is the source of truth — fix spec.html to match.`);
  process.exitCode = 1;
}

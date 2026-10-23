#!/usr/bin/env node
// Shows where a UI string appears in the prototype (specs/screen-flow-design.html), with surrounding source.
// Use it to find the prototype's actual wording when check-spec-prototype reports a gap.
// Usage: node scripts/find-in-prototype.mjs "<text>" ["<text>" ...]     (case-sensitive, max 4 hits each)
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'specs', 'screen-flow-design.html');
const raw = readFileSync(file, 'utf8').replace(/\u([0-9a-f]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
for (const k of process.argv.slice(2)) {
  const hits = [];
  for (let i = raw.indexOf(k); i >= 0 && hits.length < 4; i = raw.indexOf(k, i + 1))
    hits.push(raw.slice(Math.max(0, i - 110), i + 110).replace(/\s+/g, ' '));
  console.log(`== ${k}${hits.length ? '' : ' (không có)'}`);
  hits.forEach((h) => console.log(`   …${h}`));
}

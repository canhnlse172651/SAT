import { spawnSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { classWithSets, doSet, gvPage, hvPage, pid, review, set, setContent, write } from './helpers';

const ROOT = new URL('../../../../', import.meta.url);

/** One cloze question with one blank (its own verdict per case). */
const blank = (accepted: string) => {
  const id = pid('b');
  return { id: pid('q'), type: 'cloze', prompt: 'Điền', image: null, explanation: '', text: `[[${id}]]`, blanks: [{ id, answers: [accepted], points: 1 }] };
};

test('[005:NFR-4] TC-117 grading rules: the reference cases, then 20 through submissions', async ({ browser }) => {
  test.setTimeout(300_000);
  // 1. The reference cases of the grading rules.
  const run = spawnSync(process.execPath, ['.sdd/scripts/sdd.mjs', 'run', 'test', '--', 'packages/shared/src/exercises'], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 240_000,
    env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
  });
  const out = `${run.stdout}\n${run.stderr}`;
  const summary = out.split('\n').filter((l) => /Tests\s+\d+|Test Files/.test(l)).join(' | ');
  console.log(`TC-117 reference run: ${summary}`);
  expect(run.status, out.slice(-2000)).toBe(0);
  expect(out).toMatch(/Tests\s+\d+ passed/);
  expect(out).not.toMatch(/\d+ failed/);
  // The reference set must hold ≥ 400 grading cases (≥ 150 of them pinyin): every case is a Vitest test (it.each rows count).
  const total = Number(out.match(/Tests\s+(\d+) passed/)?.[1] ?? 0);
  expect.soft(total, 'cases in the reference set of the grading rules (≥ 400)').toBeGreaterThanOrEqual(400);

  // 2. 20 sample cases through a real submission.
  const cases: [string, string, boolean][] = [
    ['nǐ hǎo', '  ni3 hao3', true],
    ['nǐ hǎo', 'nǐhǎo', true],
    ['nǐ hǎo', 'NǏ HǍO', true],
    ['nǐ hǎo', 'ni hao', false],
    ['lǜ', 'lv4', true],
    ['lǜ', 'lü4', true],
    ['lǜ', 'lu4', false],
    ['ma', 'ma5', true],
    ['mǎ', 'mà', false],
    ['mǎ', 'ma3', true],
    ['ABC', 'ａｂｃ', true],
    ['ABC', 'abc', true],
    ['你好', '你 好', true],
    ['你好', '妳好', false],
    ['你好', 'nǐ hǎo', false],
    ['你好', '你好。', false],
    ['xièxie', 'xie4xie', true],
    ['xièxie', 'xie4xie5', true],
    ['xièxie', 'xiexie', false],
    ['nǚ', 'nv3', true],
  ];
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [{ title: 'Bộ 20 ca', content: set([...cases.map(([a]) => blank(a)), write('Viết', 'tā', ['他'])]) }]);
  const setId = d.sets[0]!;
  const saved = (await setContent(gv, d.les, setId)).questions;
  const { page: hv } = await hvPage(browser, d.students[0]!);
  await doSet(hv, d.cls, setId, Object.fromEntries(cases.map(([, typed], k) => [saved[k].id, { blanks: { [saved[k].blanks[0].id]: typed } }])));
  const rows = (await review(hv, d.cls, setId)).body.rows;
  const got = cases.map((c, k) => `${c[0]} ← "${c[1]}": ${rows[k].earned === 1}`);
  const want = cases.map((c) => `${c[0]} ← "${c[1]}": ${c[2]}`);
  expect(got).toEqual(want);
});

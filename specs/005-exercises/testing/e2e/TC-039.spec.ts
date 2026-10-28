/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { classWithSets, doSet, gvPage, hvPage, pid, review, set, setContent } from './helpers';

/** One cloze question of 6 blanks worth 1, 2, 4, 8, 16, 32: the score tells exactly which blanks were right. */
function sixBlanks() {
  const answers = ['nǐ hǎo', 'lǜ', 'ma', 'ABC', '你好', 'mǎ'];
  const blanks = answers.map((a, k) => ({ id: pid('b'), answers: [a], points: 2 ** k }));
  return {
    id: pid('q'),
    type: 'cloze',
    prompt: 'Điền',
    image: null,
    explanation: '',
    text: blanks.map((b) => `[[${b.id}]]`).join(' / '),
    blanks,
  };
}
const right = (score: number) => [0, 1, 2, 3, 4, 5].map((k) => Boolean(score & (2 ** k)));

test('[005:AC-7.1] [005:AC-7.2] [005:AC-7.3] TC-039 answer matching of blanks', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [{ title: 'Bộ so khớp', content: set([sixBlanks()]) }]);
  const setId = d.sets[0]!;
  const q = (await setContent(gv, d.les, setId)).questions[0];
  const send = (typed: string[]) => ({ [q.id]: { blanks: Object.fromEntries(q.blanks.map((b: any, k: number) => [b.id, typed[k]])) } });

  // 1. Spaces, tone numbers, v = ü, full width, case: right; a different tone: wrong.
  const { page: hv1 } = await hvPage(browser, d.students[0]!);
  await doSet(hv1, d.cls, setId, send(['  ni3 hao3', 'lv4', 'ma5', 'ａｂｃ', '你 好', 'mà']));
  const s1 = (await review(hv1, d.cls, setId)).body.rows[0].earned;
  expect(right(s1)).toEqual([true, true, true, true, true, false]);
  // Other submissions: "ni hao" (no tones) and "妳好" (traditional) are wrong…
  const { page: hv2 } = await hvPage(browser, d.students[1]!);
  await doSet(hv2, d.cls, setId, send(['ni hao', 'lü4', 'ma', 'abc', '妳好', 'mǎ']));
  expect(right((await review(hv2, d.cls, setId)).body.rows[0].earned)).toEqual([false, true, true, true, false, true]);
  // …and "你好" in the pinyin blank is wrong.
  const { page: hv3 } = await hvPage(browser, d.students[2]!);
  await doSet(hv3, d.cls, setId, send(['你好', 'lǜ', 'ma', 'ABC', '你好', 'ma3']));
  expect(right((await review(hv3, d.cls, setId)).body.rows[0].earned)).toEqual([false, true, true, true, true, true]);
});

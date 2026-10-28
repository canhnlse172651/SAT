import { expect, test } from '@playwright/test';
import { classWithSets, doSet, gvPage, hvPage, review, set, setContent, write } from './helpers';

test('[005:AC-10.5] TC-052 grading a write question', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [{ title: 'Bộ viết', content: set([write('Viết', 'tā', ['他', '她'])]) }]);
  const setId = d.sets[0]!;
  const q = (await setContent(gv, d.les, setId)).questions[0];
  const cases: [string, number][] = [
    ['她！', 1],
    ['ta1', 0],
    ['它', 0],
  ];
  for (const [k, [text, points]] of cases.entries()) {
    const { page: hv } = await hvPage(browser, d.students[k]!);
    await doSet(hv, d.cls, setId, { [q.id]: { text } });
    expect((await review(hv, d.cls, setId)).body.rows[0].earned, text).toBe(points);
  }
});

/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { classWithSets, doSet, gvPage, hvPage, order, review, set, setContent } from './helpers';

test('[005:AC-9.7] TC-049 ordering: all or nothing, equal tiles interchangeable', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [{ title: 'Bộ sắp xếp', content: set([order('Sắp xếp', ['我', '的', '书', '的', '人'])]) }]);
  const setId = d.sets[0]!;
  const q = (await setContent(gv, d.les, setId)).questions[0];
  const [t1, t2, t3, t4, t5] = q.tiles.map((t: any) => t.id);
  // 1. The two "的" swapped: full points.
  const { page: hv1 } = await hvPage(browser, d.students[0]!);
  await doSet(hv1, d.cls, setId, { [q.id]: { tiles: [t1, t4, t3, t2, t5] } });
  const r1 = (await review(hv1, d.cls, setId)).body.rows[0];
  expect([r1.earned, r1.verdict]).toEqual([1, 'correct']);
  // 2. Not every tile placed: "Sai", 0.
  const { page: hv2 } = await hvPage(browser, d.students[1]!);
  await doSet(hv2, d.cls, setId, { [q.id]: { tiles: [t1, t2, t3] } });
  const r2 = (await review(hv2, d.cls, setId)).body.rows[0];
  expect([r2.earned, r2.verdict]).toEqual([0, 'wrong']);
  // 3. Wrong order: 0.
  const { page: hv3 } = await hvPage(browser, d.students[2]!);
  await doSet(hv3, d.cls, setId, { [q.id]: { tiles: [t3, t2, t1, t4, t5] } });
  expect((await review(hv3, d.cls, setId)).body.rows[0].earned).toBe(0);
});

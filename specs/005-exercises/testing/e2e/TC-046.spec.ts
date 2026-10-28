import { expect, test } from '@playwright/test';
import { classWithSets, doSet, gvPage, hvPage, match, review, set, setContent } from './helpers';

test('[005:AC-8.7] TC-046 partial points per pair', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [
    {
      title: 'Bộ nối',
      content: set([match('Nối', [['你好', 'xin chào'], ['谢谢', 'cảm ơn'], ['再见', 'tạm biệt'], ['老师', 'giáo viên']], ['học sinh'])]),
    },
  ]);
  const setId = d.sets[0]!;
  const q = (await setContent(gv, d.les, setId)).questions[0];
  const [p1, p2, p3, p4] = q.pairs;
  // 1. 2 right, 1 wrong (pair 3 → B of pair 4), 1 linked to the distractor.
  const { page: hv } = await hvPage(browser, d.students[0]!);
  await doSet(hv, d.cls, setId, {
    [q.id]: { pairs: { [p1.id]: p1.bId, [p2.id]: p2.bId, [p3.id]: p4.bId, [p4.id]: q.distractors[0].id } },
  });
  const row = (await review(hv, d.cls, setId)).body.rows[0];
  expect([row.earned, row.max, row.verdict]).toEqual([2, 4, 'partial']);
  expect(row.answer).toBe('你好 → xin chào; 谢谢 → cảm ơn; 再见 → giáo viên; 老师 → học sinh');
});

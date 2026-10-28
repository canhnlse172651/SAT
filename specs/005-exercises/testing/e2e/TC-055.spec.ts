/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { classWithSets, cloze, doSet, gvPage, hvPage, mcq, reading, review, set, setContent } from './helpers';

test('[005:AC-11.5] TC-055 reading: points per sub-question', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const sub2 = cloze('Tên', '小[[明]]');
  sub2.blanks[0]!.points = 2;
  const d = await classWithSets(gv, [
    {
      title: 'Bộ đọc',
      content: set([reading('Đọc', '我叫小明。我是学生。', [mcq('小明 là ai?', [{ text: 'Giáo viên' }, { text: 'Học sinh', correct: true }]), sub2])]),
    },
  ]);
  const setId = d.sets[0]!;
  const q = (await setContent(gv, d.les, setId)).questions[0];
  const [s1, s2] = q.subs;
  // 1. Sub-question 1 right, sub-question 2 wrong.
  const { page: hv } = await hvPage(browser, d.students[0]!);
  await doSet(hv, d.cls, setId, {
    [q.id]: {
      subs: {
        [s1.id]: { optionIds: [s1.options.find((o: any) => o.correct).id] },
        [s2.id]: { blanks: { [s2.blanks[0].id]: '红' } },
      },
    },
  });
  const row = (await review(hv, d.cls, setId)).body.rows[0];
  expect([row.earned, row.max, row.verdict]).toEqual([1, 3, 'partial']);
  expect(row.subs.map((s: any) => [s.n, s.earned, s.max, s.verdict])).toEqual([
    ['1.1', 1, 1, 'correct'],
    ['1.2', 0, 2, 'wrong'],
  ]);
});

/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { aiApprove, aiPreview, classWithSets, getLesson, gvPage, hvPage, mcq, set, start } from './helpers';

test('[005:AC-13.12] TC-067 approving with a stale list is refused', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [{ title: 'B', content: set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]) }]);
  const items = [{ title: 'AI 1', content: set([mcq('AI?', [{ text: 'A', correct: true }, { text: 'B' }])]) }];
  // 1. Preview: B "Sẽ bị xóa".
  const p = await aiPreview(gv, d.les, items);
  expect(p.body.sets.deleted).toEqual(['B']);
  const before = await getLesson(gv, d.les);
  // 2. An HV starts B.
  const { page: hv } = await hvPage(browser, d.students[0]!);
  expect((await start(hv, d.cls, d.sets[0]!)).status).toBeLessThan(300);
  // 3. Approve with the old token.
  const r = await aiApprove(gv, d.les, items, p.body.token);
  expect(r.status).toBe(409);
  expect(r.body.error.message).toBe('Nội dung của Bài đã thay đổi. Hãy xem lại danh sách trước khi duyệt.');
  const fresh = JSON.stringify(r.body.error.details);
  expect(fresh).toContain('"archived":[{"title":"B"');
  expect(r.body.error.details.sets?.deleted ?? r.body.error.details.preview?.sets?.deleted ?? []).not.toContain('B');
  const after = await getLesson(gv, d.les);
  expect(after.items.map((i: any) => [i.id, i.status])).toEqual(before.items.map((i: any) => [i.id, i.status]));
});

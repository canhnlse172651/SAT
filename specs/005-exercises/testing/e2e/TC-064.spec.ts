/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import {
  S11, aiPreview, call, evidence, getLesson, gvPage, hvPage, mcq, newClass, newCurriculum, newLesson, publishItem, publishLesson,
  set, studentIds,
} from './helpers';

test('[005:AC-13.5] TC-064 content not yet approved is not a set of the Bài', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const cur = await newCurriculum(gv);
  const les = await newLesson(gv, cur.id);
  const q = () => set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]);
  for (let k = 0; k < 30; k++) {
    const id = (await call(gv, 'POST', `/api/lessons/${les.id}/items`, { section: 'exercise' })).body.itemId;
    await publishItem(gv, les.id, id, `Bộ ${k + 1}`, q());
  }
  await publishLesson(gv, les.id);
  const [hvId] = await studentIds(gv);
  const cls = await newClass(gv, cur.id, [hvId!]);

  // 1. Preview 2 sets, no approval.
  const p = await aiPreview(gv, les.id, [
    { title: 'AI chưa duyệt 1', content: q() },
    { title: 'AI chưa duyệt 2', content: q() },
  ]);
  expect(p.status).toBe(200);
  // 2. Add a set by hand: the 30 real sets still block it.
  const add = await call(gv, 'POST', `/api/lessons/${les.id}/items`, { section: 'exercise' });
  expect(add.status).toBe(409);
  expect(add.body.error.message).toBe('Mỗi bài có tối đa 30 bộ bài tập.');
  const items = (await getLesson(gv, les.id)).items;
  expect(items).toHaveLength(30);
  expect(items.some((i: any) => i.title.startsWith('AI chưa duyệt'))).toBe(false);
  // 3. The HV does not see it; no attempt exists.
  const { page: hv } = await hvPage(browser, hvId!);
  await hv.goto(S11(cls.id, les.id));
  await expect(hv.getByText('Bộ 1', { exact: true })).toBeVisible();
  await expect(hv.getByText(/AI chưa duyệt/)).toHaveCount(0);
  await evidence(hv, 'TC-064');
  const subs = await call(gv, 'GET', `/api/exercises/lessons/${les.id}/sets`);
  expect(subs.body.sets.every((s: any) => s.submissions === 0)).toBe(true);
});

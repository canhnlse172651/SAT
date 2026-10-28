/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import {
  S05, S06, classWithSets, doSet, evidence, gvPage, hvPage, mcq, newClass, newCurriculum, newLesson, publishedSet, set,
  setContent, setDeadline, vnToday,
} from './helpers';

test('[005:AC-21.1] [005:AC-21.3] TC-103 S05 / S06 outside what the HV may see', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const q = () => set([mcq('Câu riêng?', [{ text: 'Đúng', correct: true }, { text: 'Sai' }])]);
  // A published set in a draft Bài.
  const cur = await newCurriculum(gv);
  const draftLesson = await newLesson(gv, cur.id, 'Bài nháp');
  const inDraft = await publishedSet(gv, draftLesson.id, 'Bộ trong bài nháp', q());
  const one = await classWithSets(gv, [{ title: 'Bộ của lớp', content: q() }], { students: [] });
  const [hv1, hv2] = await (async () => (await (await gv.request.get('/api/students')).json()).items.map((s: any) => s.id))();
  // Class of hv1 only (same curriculum as `one`), and a class that starts later.
  const cls = await newClass(gv, one.cur, [hv1]);
  await setDeadline(gv, cls.id, one.sets[0]!, vnToday(5));
  const draftCls = await newClass(gv, cur.id, [hv1]);
  const upcoming = await newClass(gv, one.cur, [hv1], vnToday(3));
  await setDeadline(gv, upcoming.id, one.sets[0]!, vnToday(5));
  const x = (await setContent(gv, one.les, one.sets[0]!)).questions[0];
  const p1 = (await hvPage(browser, hv1)).page;
  await doSet(p1, cls.id, one.sets[0]!, { [x.id]: { optionIds: [x.options[0].id] } });
  const notFound = async (p: typeof gv) => {
    await expect(p.getByText('Không tìm thấy nội dung')).toBeVisible();
    await expect(p.getByText('Câu riêng?')).toHaveCount(0);
  };

  // Published set of a draft Bài.
  await p1.goto(S05(draftCls.id, inDraft));
  await notFound(p1);
  await evidence(p1, 'TC-103', 1);
  // Class not started yet: the 003 message.
  await p1.goto(S05(upcoming.id, one.sets[0]!));
  await expect(p1.getByRole('status')).toHaveText(/^Lớp sẽ bắt đầu vào ngày \d\d\/\d\d\/\d{4}\. Nội dung sẽ mở từ ngày này\.$/);
  await expect(p1.getByText('Câu riêng?')).toHaveCount(0);
  await evidence(p1, 'TC-103', 2);
  // An HV outside the class, and the submission of another HV.
  const p2 = (await hvPage(browser, hv2)).page;
  for (const [k, path] of [S05(cls.id, one.sets[0]!), S06(cls.id, one.sets[0]!)].entries()) {
    await p2.goto(path);
    await p2.waitForLoadState('networkidle');
    await evidence(p2, 'TC-103', 3 + k);
    await expect(p2.getByText('Câu riêng?')).toHaveCount(0);
    await expect(p2.getByText('Bộ của lớp')).toHaveCount(0);
    await expect.soft(p2.getByText('Không tìm thấy nội dung'), `A05 for an HV outside the class (${path})`).toBeVisible();
  }
});

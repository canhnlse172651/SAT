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
  // Class of hv1 and hv2 (same curriculum as `one`), and a class that starts later.
  const cls = await newClass(gv, one.cur, [hv1, hv2]);
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
  // The submission of another HV (hv1's). S05 / S06 address only the caller's own work: hv2 (member, not submitted) sees only
  // "Bạn chưa nộp bài này." (AC-16.5), nothing of hv1's submission; every route that names hv1's submission answers 404 (A05).
  const p2 = (await hvPage(browser, hv2)).page;
  await p2.goto(S06(cls.id, one.sets[0]!));
  await expect(p2.getByRole('status')).toHaveText('Bạn chưa nộp bài này.');
  await expect(p2.getByText('Câu riêng?')).toHaveCount(0);
  await expect(p2.getByText('Đúng', { exact: true })).toHaveCount(0);
  await evidence(p2, 'TC-103', 3);
  for (const path of [
    `/api/exercises/submissions?classId=${cls.id}&setId=${one.sets[0]!}&studentId=${hv1}`,
    `/api/exercises/classes/${cls.id}/sets/${one.sets[0]!}/submissions`,
  ]) {
    const r = await p2.request.get(path);
    const text = await r.text();
    expect([r.status(), JSON.parse(text).error?.code], path).toEqual([404, 'NOT_FOUND']);
    expect(text, path).not.toContain('Câu riêng?');
    expect(text, path).not.toContain(hv1);
  }
});

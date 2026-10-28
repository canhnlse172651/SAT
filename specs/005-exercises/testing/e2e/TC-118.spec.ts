/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import {
  api, call, hvApi, mcq, newClass, newCurriculum, newLesson, pool, publishLesson, publishedSet, rawCall, saveItem, set,
  setContent, setDeadline, vnToday, workspaceWithStudents,
} from './helpers';

test('[005:NFR-5] TC-118 re-grading 5 000 submissions within 60 s, none lost or doubled', async ({ browser }) => {
  test.setTimeout(1_200_000);
  const ws = await workspaceWithStudents(browser, 100);
  const gv = ws.page;
  const cur = await newCurriculum(gv);
  const les = await newLesson(gv, cur.id);
  const setId = await publishedSet(gv, les.id, 'Bộ 5 000 bài nộp', set([mcq('Chào?', [{ text: 'Một', correct: true }, { text: 'Hai' }])]));
  await publishLesson(gv, les.id);
  const content = await setContent(gv, les.id, setId);
  const q = content.questions[0];
  const answers = { [q.id]: { optionIds: [q.options[0].id] } };
  const hvs = await pool(ws.students, 20, (id) => hvApi(id));
  // 50 classes × 100 students = 5 000 submissions (all right: 1 point).
  const classes: string[] = [];
  for (let c = 0; c < 50; c++) {
    const cls = await newClass(gv, cur.id, ws.students);
    await setDeadline(gv, cls.id, setId, vnToday(5));
    classes.push(cls.id);
    await pool(hvs, 25, async (hv, k) => {
      const base = `/api/learn/classes/${cls.id}/sets/${setId}`;
      await rawCall(hv, 'POST', `${base}/start`);
      const s = await rawCall(hv, 'POST', `${base}/submit`, { submitKey: `c${c}h${k}xxxxxxxx`, answers });
      expect(s.status, JSON.stringify(s.body)).toBeLessThan(300);
    });
  }
  const counts = await api<any>(gv, 'GET', `/api/exercises/lessons/${les.id}/sets`);
  expect(counts.sets[0].submissions).toBe(5000);
  // 20 students of one more class are ready to submit during the re-grading.
  const extra = await newClass(gv, cur.id, ws.students.slice(0, 20));
  await setDeadline(gv, extra.id, setId, vnToday(5));
  const base = `/api/learn/classes/${extra.id}/sets/${setId}`;
  await pool(hvs.slice(0, 20), 20, (hv) => rawCall(hv, 'POST', `${base}/start`));

  // 1. Change the key, "Chấm lại và lưu" (the save with confirmRegrade), timed. 2. 20 submissions meanwhile.
  const edited = structuredClone(content);
  edited.questions[0].options.forEach((o: any, k: number) => (o.correct = k === 1));
  const t0 = Date.now();
  const regrade = saveItem(gv, les.id, setId, 'Bộ 5 000 bài nộp', edited, { confirmRegrade: true });
  const during = pool(hvs.slice(0, 20), 20, (hv, k) => rawCall(hv, 'POST', `${base}/submit`, { submitKey: `extra${k}xxxxxxxx`, answers }));
  const r = await regrade;
  const ms = Date.now() - t0;
  const subs = await during;
  console.log(`TC-118: re-grading of 5 000 submissions took ${ms} ms (status ${r.status})`);
  expect(r.status, JSON.stringify(r.body).slice(0, 500)).toBe(200);
  expect(ms).toBeLessThanOrEqual(60_000);
  expect(subs.every((s) => s.status < 300), JSON.stringify(subs.filter((s) => s.status >= 300)).slice(0, 500)).toBe(true);
  // Nothing missing, nothing graded twice: every submission is there once, with the new key.
  let total = 0;
  for (const cls of [...classes, extra.id]) {
    const items = (await api<any>(gv, 'GET', `/api/exercises/classes/${cls}/sets/${setId}/submissions`)).items;
    expect(new Set(items.map((i: any) => i.student.id)).size).toBe(items.length);
    expect(items.every((i: any) => i.score === 0), cls).toBe(true);
    total += items.length;
  }
  expect(total).toBe(5020);
  const one = (await call(gv, 'GET', `/api/exercises/submissions?classId=${classes[0]}&studentId=${ws.students[0]}&setId=${setId}`)).body;
  expect([one.regrade.from, one.regrade.to, one.score]).toEqual([1, 0, 0]);
  await Promise.all(hvs.map((h) => h.dispose()));
});

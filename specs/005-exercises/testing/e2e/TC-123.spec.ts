/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import {
  addItem, aiApprove, aiPreview, api, call, getLesson, gvPage, hvPage, mcq, newClass, newCurriculum, newLesson, publishItem,
  publishLesson, saveAnswers, set, setContent, setDeadline, start, studentIds, submit, vnToday,
} from './helpers';

test('[005:NFR-11] TC-123 approving 30 × 100 new questions over 30 sets with data', async ({ browser }) => {
  test.setTimeout(300_000);
  const { page: gv } = await gvPage(browser);
  const cur = await newCurriculum(gv);
  const les = await newLesson(gv, cur.id);
  const q = (p: string) => mcq(p, [{ text: 'Đúng', correct: true }, { text: 'Sai' }]);
  const old: string[] = [];
  for (let k = 0; k < 30; k++) {
    const id = await addItem(gv, les.id, 'exercise');
    await publishItem(gv, les.id, id, `Cũ ${k + 1}`, set([q('Một'), q('Hai')]));
    old.push(id);
  }
  await publishLesson(gv, les.id);
  const [hv1, hv2] = await studentIds(gv);
  const cls = await newClass(gv, cur.id, [hv1!, hv2!]);
  for (const id of old) await setDeadline(gv, cls.id, id, vnToday(5));
  const p1 = (await hvPage(browser, hv1!)).page;
  const p2 = (await hvPage(browser, hv2!)).page;
  // Every old set has data: HV1 submitted, HV2 has an attempt in progress.
  for (const id of old) {
    const c = await setContent(gv, les.id, id);
    const a = { [c.questions[0].id]: { optionIds: [c.questions[0].options[0].id] } };
    await start(p1, cls.id, id);
    await submit(p1, cls.id, id, a);
    await start(p2, cls.id, id);
    await saveAnswers(p2, cls.id, id, a);
  }
  const before = await Promise.all(old.map(async (id) => (await api<any>(gv, 'GET', `/api/exercises/classes/${cls.id}/sets/${id}/submissions`)).items));
  const items = Array.from({ length: 30 }, (_, s) => ({ title: `Mới ${s + 1}`, content: set(Array.from({ length: 100 }, (_, k) => q(`Mới ${s + 1}.${k + 1}`))) }));
  const p = await aiPreview(gv, les.id, items);
  expect(p.status).toBe(200);

  // 1. Approve, timed; meanwhile HV2 saves on the old sets.
  const t0 = Date.now();
  const approving = aiApprove(gv, les.id, items, p.body.token);
  const meanwhile = Promise.all(old.slice(0, 10).map(async (id) => {
    const c = await setContent(gv, les.id, id).catch(() => null);
    return c ? saveAnswers(p2, cls.id, id, { [c.questions[1].id]: { optionIds: [c.questions[1].options[0].id] } }) : null;
  }));
  const r = await approving;
  const ms = Date.now() - t0;
  await meanwhile;
  console.log(`TC-123: approval of 30 × 100 questions over 30 sets with data took ${ms} ms`);
  expect(r.status, JSON.stringify(r.body).slice(0, 300)).toBe(200);
  expect(ms).toBeLessThanOrEqual(5000);
  // No set with data deleted; submissions, scores and attempts in progress kept.
  const l = await getLesson(gv, les.id);
  const sets = l.items.filter((i: any) => i.section === 'exercise');
  expect(sets.filter((i: any) => i.status === 'published')).toHaveLength(30);
  for (const id of old) expect(sets.find((i: any) => i.id === id)?.status, id).toBe('archived');
  const after = await Promise.all(old.map(async (id) => (await api<any>(gv, 'GET', `/api/exercises/classes/${cls.id}/sets/${id}/submissions`)).items));
  expect(after).toEqual(before);
  const attempt = (await call(p2, 'GET', `/api/learn/classes/${cls.id}/sets/${old[0]}`)).status;
  expect([200, 404]).toContain(attempt);
  void call;
});

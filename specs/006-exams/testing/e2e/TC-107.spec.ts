import { expect, request, test } from '@playwright/test';
import {
  ORIGIN, S08, call, doExam, evidence, freshStudents, gvPage, holder, hvPage, learnView, newClass, scheduledExam, start,
} from './helpers';

test('[006:AC-16.2] [006:AC-16.3] [006:AC-16.4] [006:NFR-7] TC-107 secrecy: who sees the exam, its questions and its keys', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h1, h2, h3] = await freshStudents(page, 3);
  const A = await newClass(page, [h1!, h2!]);
  await newClass(page, [h3!]);
  const ex = await scheduledExam(page, { classIds: [A.id] });
  const hv1 = await hvPage(browser, h1!);
  const hv3 = await hvPage(browser, h3!);

  // 1. HV outside the assigned classes: 404 / A05, no name.
  const r3 = await learnView(hv3.page, ex.id);
  expect(r3.status).toBe(404);
  expect(JSON.stringify(r3.body)).not.toContain(ex.name);
  await hv3.page.goto(S08(ex.id));
  await expect(hv3.page.getByText('Không tìm thấy nội dung')).toBeVisible();
  await evidence(hv3.page, 'TC-107');

  // 2. Lobby: no question; during the attempt: questions but no key / explanation; after submitting (still open): nothing.
  const lobby = await learnView(hv1.page, ex.id);
  expect(JSON.stringify(lobby.body)).not.toContain('你好?');
  expect(lobby.body).not.toHaveProperty('questions');
  const k = holder();
  const s = await start(hv1.page, ex.id, k);
  const attempt = JSON.stringify(s.body);
  expect(attempt).toContain('你好?');
  expect(attempt).not.toContain('"correct"');
  expect(attempt).not.toContain('你好 = xin chào');
  expect(attempt).not.toContain('"answers":["你好"]');
  await call(hv1.page, 'POST', `/api/learn/exams/${ex.id}/submit`, { holder: k, submitKey: `kkkkkkkkkk${Date.now()}`, answers: {} });
  const after = JSON.stringify((await learnView(hv1.page, ex.id)).body);
  expect(after).not.toContain('你好?');
  expect(after).not.toContain('你好 = xin chào');

  // 3. Another HV's submission through the GV route: 404 for an HV.
  await doExam(page, (await hvPage(browser, h2!)).page, ex.id);
  expect((await call(hv1.page, 'GET', `/api/exams/${ex.id}/submissions/${h2}?classId=${A.id}`)).status).toBe(404);

  // 4. Not signed in: 401.
  const anon = await request.newContext({ baseURL: ORIGIN });
  expect((await anon.get(`/api/learn/exams/${ex.id}`)).status()).toBe(401);
});

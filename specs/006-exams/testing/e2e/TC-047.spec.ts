import { expect, test } from '@playwright/test';
import {
  MIN, S07, advanceClock, api, card, draftExam, evidence, freshStudents, gvPage, hvPage, newClass, resetClock,
  scheduledExam, uid,
} from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-7.1] TC-047 the HV sees scheduled / open / closed exams of a started assigned class only', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h1, h3] = await freshStudents(page, 2);
  const A = await newClass(page, [h1!]);
  const C = await newClass(page, [h3!], { startOffset: 3 });
  await newClass(page, [h3!]); // lớp B: not assigned
  const t = uid();
  const R = await scheduledExam(page, { name: `TC-047 R ${t}`, classIds: [A.id], dur: 1, closeAfter: 1 });
  await advanceClock(page, 2 * MIN);
  await api(page, 'POST', `/api/exams/${R.id}/archive`);
  await resetClock(page);
  await scheduledExam(page, { name: `TC-047 P ${t}`, classIds: [A.id, C.id], openIn: 24 * 60 });
  await draftExam(page, { name: `TC-047 Q ${t}`, classIds: [A.id] });

  const hv1 = await hvPage(browser, h1!);
  await hv1.page.goto(S07);
  await expect(card(hv1.page, `TC-047 P ${t}`)).toBeVisible();
  await expect(hv1.page.getByRole('heading', { name: `TC-047 Q ${t}` })).toHaveCount(0);
  await expect(hv1.page.getByRole('heading', { name: `TC-047 R ${t}` })).toHaveCount(0);
  await evidence(hv1.page, 'TC-047', 1);
  const hv3 = await hvPage(browser, h3!);
  await hv3.page.goto(S07);
  await expect(hv3.page.getByRole('heading', { name: 'Chưa có bài thi nào.' })).toBeVisible();
  await evidence(hv3.page, 'TC-047', 2);
});

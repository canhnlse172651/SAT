import { expect, test } from '@playwright/test';
import { S07, card, evidence, freshStudents, gvPage, hvPage, newClass, saveExam, scheduledExam, uid } from './helpers';

test('[006:AC-5.5] TC-039 a class without attempts removed: its HV no longer see the exam unless in another assigned class', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h1, h2, h3] = await freshStudents(page, 3);
  const A = await newClass(page, [h1!, h2!]);
  const B = await newClass(page, [h2!, h3!]);
  const name = `TC-039 ${uid()}`;
  const ex = await scheduledExam(page, { name, classIds: [A.id, B.id] });
  const r = await saveExam(page, ex.id, { classIds: [A.id] });
  expect(r.status, JSON.stringify(r.body)).toBe(200);

  const hv3 = await hvPage(browser, h3!);
  await hv3.page.goto(S07);
  await expect(hv3.page.getByRole('heading', { name: 'Chưa có bài thi nào.' })).toBeVisible();
  await evidence(hv3.page, 'TC-039', 1);
  const hv2 = await hvPage(browser, h2!);
  await hv2.page.goto(S07);
  await expect(card(hv2.page, name)).toBeVisible();
  await evidence(hv2.page, 'TC-039', 2);
});

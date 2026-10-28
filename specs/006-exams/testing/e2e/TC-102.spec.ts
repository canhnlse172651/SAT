import { expect, test } from '@playwright/test';
import { T16, doExam, evidence, freshStudents, gvPage, holder, hvPage, newClass, scheduledExam, start } from './helpers';

test('[006:AC-15.4] TC-102 filter, search and sort change the list, never the class figures', async ({ browser }) => {
  test.setTimeout(90_000);
  const { page } = await gvPage(browser);
  const [h1, h2, h3, h4] = await freshStudents(page, 4, 'QA hv');
  const A = await newClass(page, [h1!, h2!, h3!, h4!]);
  const ex = await scheduledExam(page, { classIds: [A.id] });
  await doExam(page, (await hvPage(browser, h1!)).page, ex.id, { q3: false }); // 75
  await doExam(page, (await hvPage(browser, h3!)).page, ex.id); // 100, later
  expect((await start((await hvPage(browser, h2!)).page, ex.id, holder())).status).toBe(200);
  await page.goto(T16(ex.id));
  const counts = page.getByLabel('Số liệu của lớp');
  const figures = await counts.innerText();
  const names = () => page.locator('tbody tr .strong').allInnerTexts();

  await page.getByRole('group', { name: 'Lọc theo trạng thái' }).getByRole('button', { name: /^Đã nộp/ }).click();
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await page.getByRole('group', { name: 'Lọc theo trạng thái' }).getByRole('button', { name: /^Tất cả/ }).click();
  await page.getByRole('searchbox', { name: 'Tìm theo họ tên học viên' }).fill('QA HV 2');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('searchbox', { name: 'Tìm theo họ tên học viên' }).fill('');
  await page.getByLabel('Sắp xếp').selectOption('score');
  expect((await names())[0]).toMatch(/^QA hv 3 /);
  expect((await names())[1]).toMatch(/^QA hv 1 /);
  await page.getByLabel('Sắp xếp').selectOption('time');
  expect((await names())[0]).toMatch(/^QA hv 3 /);
  await page.getByLabel('Sắp xếp').selectOption('name');
  expect((await names()).map((n) => n.slice(0, 7))).toEqual(['QA hv 1', 'QA hv 2', 'QA hv 3', 'QA hv 4']);
  expect(await counts.innerText()).toBe(figures);
  await evidence(page, 'TC-102');
});

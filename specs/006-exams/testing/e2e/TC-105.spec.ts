import { expect, test } from '@playwright/test';
import { T16, evidence, freshStudents, gvPage, holder, hvPage, newClass, scheduledExam, start, submit } from './helpers';

test('[006:AC-15.7] TC-105 T16 of an open exam follows starts and submissions within 60 s, no reload', async ({ browser }) => {
  test.setTimeout(150_000);
  const { page } = await gvPage(browser);
  const [h4] = await freshStudents(page, 1);
  const A = await newClass(page, [h4!]);
  const ex = await scheduledExam(page, { classIds: [A.id] });
  await page.goto(T16(ex.id));
  const row = page.locator(`tr[data-sid="${h4}"]`);
  await expect(row).toContainText('Chưa làm');
  const hv = await hvPage(browser, h4!);
  const k = holder();
  expect((await start(hv.page, ex.id, k)).status).toBe(200);
  await expect(row).toContainText('Đang làm', { timeout: 60_000 });
  await expect(page.getByLabel('Số liệu của lớp')).toContainText(/Đang làm\s*1/);
  expect((await submit(hv.page, ex.id, k)).status).toBe(200);
  await expect(row).toContainText('Đã nộp', { timeout: 60_000 });
  await expect(page.getByLabel('Số liệu của lớp')).toContainText(/Đã nộp\s*1/);
  await evidence(page, 'TC-105');
});

import { expect, test } from '@playwright/test';
import { answerE3, evidence, freshStudents, gvPage, hvPage, newClass, scheduledExam, startOnScreen, uid } from './helpers';

test('[006:AC-9.3] TC-066 autosave within 3 s: "Đang lưu…" then "Đã lưu lúc HH:mm:ss"; kept after a reload', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-066 ${uid()}`;
  await scheduledExam(page, { name, classIds: [A.id] });
  const hv = await hvPage(browser, h!);
  const p = hv.page;
  await startOnScreen(p, name);
  const t0 = Date.now();
  await answerE3(p, { q1: 'Xin chào' });
  await expect(p.getByRole('status').filter({ hasText: /Đang lưu…|Đã lưu lúc/ })).toBeVisible();
  await expect(p.getByText(/^Đã lưu lúc \d\d:\d\d:\d\d$/)).toBeVisible({ timeout: 3000 });
  expect(Date.now() - t0).toBeLessThan(3500);
  await evidence(p, 'TC-066', 1);
  await p.reload();
  await expect(p.getByRole('navigation', { name: 'Bảng số câu' }).getByRole('button', { name: 'Câu 1 · đã hoàn thành' })).toBeVisible();
  await evidence(p, 'TC-066', 2);
});

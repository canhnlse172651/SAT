import { expect, test } from '@playwright/test';
import { answerE3, evidence, freshStudents, gvPage, hvPage, newClass, scheduledExam, startOnScreen, uid } from './helpers';

test('[006:AC-10.2] TC-071 back online: unsaved answers sent, "Đã lưu lúc", warning gone', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-071 ${uid()}`;
  await scheduledExam(page, { name, classIds: [A.id] });
  const hv = await hvPage(browser, h!);
  const p = hv.page;
  await startOnScreen(p, name);
  await hv.ctx.setOffline(true);
  await answerE3(p, { q1: 'Xin chào', q3: '你好' });
  await expect(p.getByRole('alert').filter({ hasText: 'Mất kết nối' })).toBeVisible({ timeout: 5000 });
  await hv.ctx.setOffline(false);
  await expect(p.getByText(/^Đã lưu lúc \d\d:\d\d:\d\d$/)).toBeVisible({ timeout: 8000 });
  await expect(p.getByRole('alert').filter({ hasText: 'Mất kết nối' })).toHaveCount(0);
  await evidence(p, 'TC-071');
  await p.reload();
  const board = p.getByRole('navigation', { name: 'Bảng số câu' });
  await expect(board.getByRole('button', { name: 'Câu 1 · đã hoàn thành' })).toBeVisible();
  await expect(board.getByRole('button', { name: 'Câu 3 · đã hoàn thành' })).toBeVisible();
});

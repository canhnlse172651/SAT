import { expect, test } from '@playwright/test';
import { S07, T22, evidence, freshStudents, getExam, gvPage, hvPage, newClass, scheduledExam, uid } from './helpers';

test('[006:AC-3.8] TC-025 "Hủy lịch" back to Nháp, everything kept, HV no longer sees it', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const t = uid();
  const ex = await scheduledExam(page, { name: `TC-025 ${t}`, classIds: [A.id], openIn: 24 * 60 });
  await page.goto(T22(ex.id));
  await page.getByRole('button', { name: 'Hủy lịch' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText(`Hủy lịch bài thi «TC-025 ${t}»? Học viên sẽ không còn thấy bài thi này.`);
  await dialog.getByRole('button', { name: 'Hủy lịch' }).click();
  await expect(page.locator('.xm-status')).toContainText('Nháp');
  const e = await getExam(page, ex.id);
  expect(e.state).toBe('draft');
  expect(e.classIds).toEqual([A.id]);
  expect(e.opensAt).toBe(ex.opensAt);
  expect(e.durationMin).toBe(45);
  expect(e.content.questions).toHaveLength(3);
  await evidence(page, 'TC-025', 1);

  const hv = await hvPage(browser, h!);
  await hv.page.goto(S07);
  await expect(hv.page.getByRole('heading', { name: 'Chưa có bài thi nào.' })).toBeVisible();
  await evidence(hv.page, 'TC-025', 2);
});

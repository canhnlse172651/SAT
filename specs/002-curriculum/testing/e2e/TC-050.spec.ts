import { test, expect } from '@playwright/test';
import { READY_SET, addItem, addLesson, asGv, createCurriculum, getLesson, learningData, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-12.3] [002:AC-12.6] TC-050 bộ bài tập có dữ liệu học tập không xóa được', async ({ page }) => {
  const msg = 'Bộ bài tập đã có dữ liệu học tập nên không xóa được — hãy Lưu trữ.';
  await asGv(page);
  const c = await createCurriculum(page, `TC-050 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  const e1 = await addItem(page, l.id, 'exercise', { title: 'E1', content: READY_SET });
  const e2 = await addItem(page, l.id, 'exercise', { title: 'E2', content: READY_SET });
  await learningData(page, e1);

  await page.goto(`/gv/giao-trinh/${c.id}/bai/${l.id}/thu-cong`);
  await page.getByRole('region', { name: 'Bộ bài tập 1' }).getByRole('button', { name: 'Xóa' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(page.getByText(msg, { exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Bộ bài tập 1' }).getByLabel('Tên')).toHaveValue('E1');
  await shot(page, 'TC-050', 1);

  await page.getByRole('region', { name: 'Bộ bài tập 2' }).getByRole('button', { name: 'Xóa' }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Xóa “E2”?');
  await learningData(page, e2);
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xóa' }).click();
  await expect(page.getByText(msg, { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('region', { name: 'Bộ bài tập 2' }).getByLabel('Tên')).toHaveValue('E2');
  expect((await getLesson(page, l.id)).items.map((i: { id: string }) => i.id)).toEqual([e1, e2]);
});

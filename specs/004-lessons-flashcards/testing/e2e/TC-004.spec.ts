import { expect, test } from '@playwright/test';
import { T07, addStep, evidence, gvPage, newCurriculum, newLesson, publishStep, text } from './helpers';

test('[004:AC-1.2] [004:AC-1.3] TC-004 add after a step keeps unsaved edits elsewhere', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  for (const n of ['Một', 'Hai', 'Ba']) {
    const id = await addStep(page, les.id);
    await publishStep(page, les.id, id, n, { goal: '', blocks: [text('<p>文</p>')] });
  }
  await page.goto(T07(cur.id, les.id));
  await page.getByRole('region', { name: 'Bước học 3' }).getByLabel('Tên bước học').fill('Ba (đang sửa)');
  await page.getByRole('region', { name: 'Bước học 2' }).getByRole('button', { name: 'Thêm sau' }).click();
  await expect(page.getByText('Đã thêm bước học mới (Nháp) · Đã lưu')).toBeVisible();
  const added = page.getByRole('region', { name: 'Bước học 3' });
  await expect(added.getByLabel('Tên bước học')).toHaveValue('');
  const moved = page.getByRole('region', { name: 'Bước học 4' });
  await expect(moved.getByLabel('Tên bước học')).toHaveValue('Ba (đang sửa)');
  await expect(moved.getByText('Chưa lưu', { exact: true })).toBeVisible();
  await evidence(page, 'TC-004');
});

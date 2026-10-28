import { expect, test } from '@playwright/test';
import { T09, evidence, gvPage, newCurriculum, newLesson, setBlock } from './helpers';

test('[005:AC-2.6] [005:AC-12.2] TC-020 the title is required (≤ 150)', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await page.goto(T09(cur.id, les.id));
  await page.getByRole('toolbar', { name: 'Phần Bài tập' }).getByRole('button', { name: 'Thêm bộ bài tập' }).click();
  const block = setBlock(page, 1);
  const title = block.getByLabel('Tiêu đề', { exact: true });
  await expect(title).toBeFocused();
  const rule = block.getByText('Tiêu đề bắt buộc, tối đa 150 ký tự', { exact: true });

  // 1. "Lưu nháp" with an empty title.
  await block.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(block.getByText('Chưa lưu được: Tiêu đề bắt buộc, tối đa 150 ký tự')).toBeVisible();
  await expect(rule).toBeVisible();
  await expect(title).toBeFocused();
  await evidence(page, 'TC-020', 1);
  // 2. 151 characters, leave the field: marked at once.
  await page.reload();
  const t2 = setBlock(page, 1).getByLabel('Tiêu đề', { exact: true });
  await t2.fill('T'.repeat(151));
  await setBlock(page, 1).getByLabel('Hướng dẫn (tùy chọn)').focus();
  await expect(t2).toHaveAttribute('aria-invalid', 'true');
  await expect(setBlock(page, 1).getByText('Tiêu đề bắt buộc, tối đa 150 ký tự', { exact: true })).toBeVisible();
  // 3. A valid title, "Lưu nháp".
  await t2.fill('Ôn tập');
  await setBlock(page, 1).getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(setBlock(page, 1).getByText(/^Đã lưu lúc \d\d:\d\d$/)).toBeVisible();
  await evidence(page, 'TC-020', 2);
});

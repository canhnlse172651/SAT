import { expect, test } from '@playwright/test';
import { T07, addStep, deck, evidence, gb, freshGvPage, newCurriculum, newLesson, saveStep, setStorage } from './helpers';

test('[004:AC-5.7] TC-041 the 80 % warning on T07 and T08', async ({ browser }) => {
  const { page } = await freshGvPage(browser); // own workspace: storage is per workspace
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Bộ thẻ', { goal: '', blocks: [deck([{ id: 'c1', front: '你', meaning: 'bạn' }])] });
  const bar = page.getByRole('toolbar', { name: 'Phần Bài học' });

  await setStorage(page, gb(7.9));
  await page.goto(T07(cur.id, les.id));
  await expect(bar.getByText('Đã dùng 7,9 GB / 10 GB')).toBeVisible();
  await expect(page.getByText(/dung lượng lưu trữ\.$/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Soạn bộ thẻ' }).click();
  await expect(page.getByRole('dialog').getByText(/Workspace đã dùng/)).toHaveCount(0);
  await evidence(page, 'TC-041', 1);

  await setStorage(page, gb(8.5));
  await page.reload();
  await expect(bar.getByText('Đã dùng 8,5 GB / 10 GB')).toBeVisible();
  await expect(bar.getByText('Workspace đã dùng 85% dung lượng lưu trữ.')).toBeVisible();
  await page.getByRole('button', { name: 'Soạn bộ thẻ' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Đã dùng 8,5 GB / 10 GB')).toBeVisible();
  await expect(dialog.getByText('Workspace đã dùng 85% dung lượng lưu trữ.')).toBeVisible();
  await evidence(page, 'TC-041', 2);
  await setStorage(page, 0);
});

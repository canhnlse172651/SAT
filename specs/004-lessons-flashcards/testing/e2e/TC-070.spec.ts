import { expect, test } from '@playwright/test';
import { T07, addStep, deck, evidence, gvPage, newCurriculum, newLesson, saveStep } from './helpers';

test('[004:AC-11.5] TC-070 add, order and delete cards; at most 200', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Bước', {
    goal: '',
    blocks: [deck([{ id: 'c1', front: '一', meaning: 'một' }, { id: 'c2', front: '二', meaning: 'hai' }])],
  });
  const full = await addStep(page, les.id);
  await saveStep(page, les.id, full, 'Đủ 200', {
    goal: '',
    blocks: [deck(Array.from({ length: 200 }, (_, i) => ({ id: `c${i}`, front: '字', meaning: `nghĩa ${i}` })))],
  });
  await page.goto(T07(cur.id, les.id));
  await page.getByRole('region', { name: 'Bước học 1' }).getByRole('button', { name: 'Soạn bộ thẻ' }).click();
  const dialog = page.getByRole('dialog');
  const fronts = dialog.getByLabel('Mặt trước (chữ Hán) *');
  await dialog.getByRole('button', { name: 'Thêm thẻ' }).click();
  await expect(fronts).toHaveCount(3);
  await expect(fronts.nth(2)).toHaveValue('');
  await expect(dialog.getByText('Thẻ 3', { exact: true })).toBeVisible();
  await fronts.nth(2).fill('三');
  await dialog.getByRole('button', { name: 'Lên (thẻ 3)' }).click();
  await expect(fronts.nth(1)).toHaveValue('三');
  await dialog.getByRole('button', { name: 'Xuống (thẻ 1)' }).click();
  await expect(fronts.nth(0)).toHaveValue('三');
  await page.setViewportSize({ width: 1280, height: 1600 }); // the three cards on screen
  await dialog.locator('.st-card').nth(0).scrollIntoViewIfNeeded();
  const grip = await dialog.locator('.st-grip').nth(2).boundingBox();
  const dest = await dialog.locator('.st-card__head').nth(0).boundingBox();
  await page.mouse.move(grip!.x + grip!.width / 2, grip!.y + grip!.height / 2);
  await page.mouse.down();
  await page.mouse.move(grip!.x + 5, grip!.y - 10, { steps: 5 });
  await page.mouse.move(dest!.x + dest!.width / 2, dest!.y + dest!.height / 2, { steps: 20 });
  await page.mouse.up();
  await expect(fronts.nth(0)).toHaveValue('二');
  await dialog.getByRole('button', { name: 'Xóa thẻ 3' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(fronts).toHaveCount(2);
  await dialog.getByRole('button', { name: 'Xóa thẻ 2' }).click();
  await expect(fronts).toHaveCount(1);
  await expect(dialog.getByRole('button', { name: 'Xóa thẻ 1' })).toBeDisabled();
  await evidence(page, 'TC-070', 1);
  await dialog.getByRole('button', { name: 'Xong' }).click();

  await page.getByRole('region', { name: 'Bước học 2' }).getByRole('button', { name: 'Soạn bộ thẻ' }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Thêm thẻ' })).toBeDisabled();
  await expect(page.getByRole('dialog').getByText('Mỗi bộ thẻ có tối đa 200 thẻ')).toBeVisible();
  await evidence(page, 'TC-070', 2);
});

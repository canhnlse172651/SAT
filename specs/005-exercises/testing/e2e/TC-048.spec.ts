import { expect, test } from '@playwright/test';
import { S05, classWithSets, evidence, gvPage, hvPage, order, set } from './helpers';

test('[005:AC-9.4] [005:AC-9.5] [005:AC-9.6] TC-048 building the sentence', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [{ title: 'Bộ sắp xếp', content: set([order('Sắp xếp', ['我', '是', '越南', '人'])]) }]);
  const { page } = await hvPage(browser, d.students[0]!);
  await page.goto(S05(d.cls, d.sets[0]!));
  await page.getByRole('button', { name: 'Bắt đầu làm' }).click();
  const line = page.getByRole('group', { name: 'Câu 1 · dòng trả lời' });
  const bank = page.getByRole('group', { name: 'Câu 1 · ngân hàng mảnh' });
  const texts = async (g: typeof line) => (await g.getByRole('button').allTextContents()).map((t) => t.trim());

  // 1. Empty line, shuffled bank.
  await expect(line.getByRole('button')).toHaveCount(0);
  await expect(line).toContainText('Chạm mảnh để xếp câu');
  const shuffled = await texts(bank);
  expect([...shuffled].sort()).toEqual(['人', '我', '是', '越南'].sort());
  expect(shuffled).not.toEqual(['我', '是', '越南', '人']);
  // 2. Tap to place, tap a placed tile to return it, "Xếp lại từ đầu".
  await bank.getByRole('button', { name: '我' }).click();
  await bank.getByRole('button', { name: '是' }).click();
  expect(await texts(line)).toEqual(['我', '是']);
  await line.getByRole('button', { name: '我' }).click();
  expect(await texts(line)).toEqual(['是']);
  expect(await texts(bank)).toContain('我');
  await page.getByRole('button', { name: 'Xếp lại từ đầu' }).click();
  await expect(line.getByRole('button')).toHaveCount(0);
  expect(await texts(bank)).toEqual(shuffled);
  await evidence(page, 'TC-048', 1);
  // 3. Keyboard (Tab + Enter / Space) and drag (computer).
  await bank.getByRole('button', { name: '我' }).focus();
  await page.keyboard.press('Enter');
  await bank.getByRole('button', { name: '是' }).focus();
  await page.keyboard.press('Space');
  expect(await texts(line)).toEqual(['我', '是']);
  await line.getByRole('button', { name: '是' }).focus();
  await page.keyboard.press('Enter');
  expect(await texts(line)).toEqual(['我']);
  await page.setViewportSize({ width: 1280, height: 800 });
  await bank.getByRole('button', { name: '是' }).dragTo(line);
  await bank.getByRole('button', { name: '越南' }).dragTo(line);
  expect(await texts(line)).toEqual(['我', '是', '越南']);
  await expect(page.getByRole('status').filter({ hasText: 'Đã lưu' })).toBeVisible();
  // 4. Reload: the bank keeps its order.
  await page.reload();
  await page.getByRole('button', { name: 'Tiếp tục làm' }).click();
  expect(await texts(line)).toEqual(['我', '是', '越南']);
  expect(await texts(bank)).toEqual(shuffled.filter((t) => !['我', '是', '越南'].includes(t)));
  await line.getByRole('button', { name: '越南' }).click();
  await line.getByRole('button', { name: '是' }).click();
  await line.getByRole('button', { name: '我' }).click();
  expect(await texts(bank)).toEqual(shuffled);
  await evidence(page, 'TC-048', 2);
});

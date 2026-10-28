import { expect, test } from '@playwright/test';
import { S05, classWithSets, evidence, gvPage, hvPage, mcq, set } from './helpers';

test('[005:AC-14.6] TC-072 leaving with unsaved answers warns first', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [{ title: 'Bộ rời', content: set([mcq('Câu?', [{ text: 'Một' }, { text: 'Hai', correct: true }])]) }]);
  const { page, ctx } = await hvPage(browser, d.students[0]!);
  await page.goto(S05(d.cls, d.sets[0]!));
  await page.getByRole('button', { name: 'Bắt đầu làm' }).click();
  await ctx.setOffline(true);
  await page.getByRole('radio', { name: /^B\s*Hai/ }).click();
  await expect(page.getByText('Mất kết nối – câu trả lời chưa được lưu')).toBeVisible();

  // 1. Leave (tab bar link).
  await page.getByRole('navigation', { name: 'Thanh tab' }).getByRole('link', { name: 'Lớp của tôi' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText('Một số câu trả lời chưa được lưu. Rời trang có thể làm mất chúng.');
  await evidence(page, 'TC-072');
  await dialog.getByRole('button', { name: 'Ở lại' }).click();
  await expect(page.getByText('Câu 1/1')).toBeVisible();
  // 2. Reload: the browser's leave warning.
  let kind = '';
  page.once('dialog', (dl) => {
    kind = dl.type();
    void dl.dismiss();
  });
  await page.reload({ timeout: 3000 }).catch(() => undefined);
  expect(kind).toBe('beforeunload');
  await ctx.setOffline(false);
});

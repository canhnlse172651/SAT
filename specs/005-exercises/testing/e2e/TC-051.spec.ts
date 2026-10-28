import { expect, test } from '@playwright/test';
import { S05, classWithSets, evidence, gvPage, hvPage, set, write } from './helpers';

test('[005:AC-10.4] TC-051 a write question on the phone', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [{ title: 'Bộ viết', content: set([write('Viết chữ Hán', 'ni3 hao3', ['你好'], 'xin chào')]) }]);
  const { page } = await hvPage(browser, d.students[0]!);
  await page.goto(S05(d.cls, d.sets[0]!));
  await page.getByRole('button', { name: 'Bắt đầu làm' }).click();
  const q = page.getByRole('region', { name: 'Câu 1', exact: true });
  await expect(q.getByText('nǐ hǎo', { exact: true })).toBeVisible();
  const input = q.getByRole('textbox', { name: 'Câu 1 · chữ Hán' });
  await expect(input).toHaveAttribute('maxlength', '30');
  await expect(input).toHaveAttribute('autocapitalize', 'off');
  await expect(input).toHaveAttribute('spellcheck', 'false');
  await expect(q.getByText('Gõ chữ Hán bằng bàn phím tiếng Trung (pinyin hoặc viết tay) của thiết bị')).toBeVisible();
  await evidence(page, 'TC-051');
  await expect(q.getByText('Nghĩa gợi ý: xin chào', { exact: true })).toBeVisible();
});

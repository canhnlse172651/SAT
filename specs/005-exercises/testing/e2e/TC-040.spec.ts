import { expect, test } from '@playwright/test';
import { T09, draftSet, evidence, gvPage, newCurriculum, newLesson, set, setBlock, write } from './helpers';

test('[005:AC-7.4] TC-040 which "Pinyin đề" values are valid', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await draftSet(page, les.id, 'Bộ viết', set([write('Viết', 'nǐ hǎo', ['你好'])]));
  await page.goto(T09(cur.id, les.id));
  const block = setBlock(page, 1);
  const field = block.getByRole('textbox', { name: 'Pinyin đề' });
  const leave = () => block.getByLabel('Tiêu đề', { exact: true }).focus();

  for (const ok of ['Nǐ hǎo', "xi'an", 'huār', 'ni3hao3']) {
    await field.fill(ok);
    await leave();
    await expect(field, ok).not.toHaveAttribute('aria-invalid', 'true');
    await expect(block.getByText(/^Pinyin đề không hợp lệ/)).toHaveCount(0);
  }
  for (const bad of ['hǎu', 'nǐ3', 'xyz']) {
    await field.fill(bad);
    await leave();
    await expect(field, bad).toHaveAttribute('aria-invalid', 'true');
    await expect(block.getByText(`Pinyin đề không hợp lệ: ${bad}`, { exact: true })).toBeVisible();
  }
  await evidence(page, 'TC-040');
});

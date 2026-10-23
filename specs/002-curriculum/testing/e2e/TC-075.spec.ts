import { test, expect } from '@playwright/test';
import { READY_STEP, addItem, asGv, publishLesson, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-3.3] [002:NFR-8] TC-075 chữ Hán, pinyin có dấu, tiếng Việt hiển thị nguyên văn', async ({ page }) => {
  const name = `Hán ngữ 汉语 nǐ hǎo ${uid()}`;
  const desc = 'Bài khóa 你好 — chào hỏi';
  const lessonName = '第一课 Dì yī kè';
  await asGv(page);
  await page.goto('/gv/giao-trinh');
  await page.getByRole('button', { name: 'Tạo giáo trình' }).first().click();
  const dlg = page.getByRole('dialog', { name: 'Tạo giáo trình' });
  await dlg.getByLabel('Tên').fill(name);
  await dlg.getByRole('button', { name: 'HSK1', exact: true }).click();
  await dlg.getByLabel('Mô tả').fill(desc);
  await dlg.getByRole('button', { name: 'Tạo giáo trình' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(name);
  await expect(page.getByText(desc, { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Thêm bài' }).last().click();
  await page.getByRole('dialog', { name: 'Thêm bài' }).getByLabel('Tên bài').fill(lessonName);
  await page.getByRole('dialog', { name: 'Thêm bài' }).getByRole('button', { name: 'Thêm bài' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(lessonName);
  await expect(page.getByRole('navigation', { name: 'Đường dẫn' }).getByRole('link', { name })).toBeVisible();
  const lessonId = page.url().split('/').pop()!;
  const s = await addItem(page, lessonId, 'lesson', { title: '你好 nǐ hǎo', content: READY_STEP });
  await publishLesson(page, lessonId, [s]);

  await page.goto(page.url() + '/xem-truoc');
  await expect(page.locator('.page-sub').getByText(lessonName, { exact: true })).toBeVisible();
  await expect(page.locator('.page-sub').getByText(name, { exact: true })).toBeVisible();
  await expect(page.getByRole('article', { name: '你好 nǐ hǎo' })).toContainText('你好 nǐ hǎo — Xin chào');
  await shot(page, 'TC-075', 1);

  await page.goto('/gv/giao-trinh');
  await page.getByLabel('Tìm giáo trình').fill('汉语');
  await expect(page.getByRole('link', { name })).toBeVisible();
  await page.getByRole('link', { name }).click();
  await expect(page.locator('.cur-row__name')).toHaveText([lessonName]);
});

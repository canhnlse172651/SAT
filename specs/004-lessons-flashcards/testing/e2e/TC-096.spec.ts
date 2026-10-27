import { expect, test } from '@playwright/test';
import { T07, aiApprove, evidence, gvPage, newCurriculum, newLesson, publishedStep, text } from './helpers';

test('[004:AC-19.5] TC-096 a write to a step replaced meanwhile is refused and the tab reloads', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await publishedStep(page, les.id, 'Cũ 1', [text('<p>旧</p>')]);
  await publishedStep(page, les.id, 'Cũ 2', [text('<p>旧</p>')]);
  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 1' });
  await step.getByLabel('Tên bước học').fill('Cũ 1 (đang sửa)');

  await aiApprove(page, les.id, [{ title: 'Bước AI', content: { goal: '', blocks: [text('<p>AI</p>')] } }]);
  await step.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(
    page.getByText(
      /^Phần Bài học đã được thay bằng nội dung AI được duyệt lúc \d\d:\d\d\. Thay đổi chưa lưu của bạn không được giữ\.$/,
    ),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: /^Bước học \d+$/ })).toHaveCount(1);
  await expect(page.getByRole('region', { name: 'Bước học 1' }).getByLabel('Tên bước học')).toHaveValue('Bước AI');
  await expect(page.getByText('Chưa lưu', { exact: true })).toHaveCount(0);
  await evidence(page, 'TC-096');
});

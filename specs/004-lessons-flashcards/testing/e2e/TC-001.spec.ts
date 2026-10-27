import { expect, test } from '@playwright/test';
import {
  addStep,
  archiveStep,
  evidence,
  gvPage,
  newCurriculum,
  newLesson,
  publishLesson,
  publishStep,
  text,
} from './helpers';

test('[004:AC-1.1] [004:AC-1.8] [004:AC-7.7] TC-001 Bài học tab of T07 from T18', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  for (const name of ['Bước A', 'Bước B', 'Bước C']) {
    const id = await addStep(page, les.id);
    await publishStep(page, les.id, id, name, { goal: '', blocks: [text('<p>你好</p>')] });
    if (name === 'Bước C') await archiveStep(page, les.id, id);
  }
  await addStep(page, les.id); // one draft
  await publishLesson(page, les.id);

  await page.goto(`/gv/giao-trinh/${cur.id}/bai/${les.id}`);
  await page.getByRole('button', { name: 'Soạn thủ công' }).click();
  await expect(page.getByRole('heading', { name: 'Soạn bài thủ công' })).toBeVisible();
  await expect(page.getByRole('tab', { name: /Bài học/ })).toHaveAttribute('aria-selected', 'true');
  const bar = page.getByRole('toolbar', { name: 'Phần Bài học' });
  await expect(bar).toContainText('Bài học');
  await expect(bar).toContainText('4 bước học');
  await expect(bar).toContainText('2 Đã xuất bản');
  await expect(bar).toContainText('1 Nháp');
  await expect(bar).toContainText('1 Lưu trữ');
  await expect(bar.getByRole('button', { name: 'Thêm bước học' })).toBeVisible();
  for (const name of ['Xem trước', 'Chỉnh sửa', 'Xong', 'Xem như học viên', 'Web', 'Mobile']) {
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
  }
  await expect(page.getByText('Web / Mobile')).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: /Mục lục/ })).toHaveCount(0);
  await evidence(page, 'TC-001');
});

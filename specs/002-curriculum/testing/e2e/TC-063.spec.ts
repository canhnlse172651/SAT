import { test, expect } from '@playwright/test';
import { READY_SET, READY_STEP, addItem, addLesson, asGv, createCurriculum, lessonRow, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-16.1] [002:AC-16.10] TC-063 mở T21 từ T06; T18, T07 không có Xem như học viên', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-063 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  await addItem(page, l.id, 'lesson', { title: 'Bước đã xuất bản', content: READY_STEP, publish: true });
  await addItem(page, l.id, 'lesson', { title: 'Bước nháp', content: READY_STEP });
  await addItem(page, l.id, 'exercise', { title: 'Bộ đã xuất bản', content: READY_SET, publish: true });

  await page.goto(`/gv/giao-trinh/${c.id}`);
  await lessonRow(page, 'Bài 1').getByRole('button', { name: 'Xem như học viên: Bài 1' }).click();
  await expect(page).toHaveURL(/\/xem-truoc$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Xem như học viên');
  const sub = page.locator('.page-sub');
  await expect(sub.getByText('Bài 1', { exact: true })).toBeVisible();
  await expect(sub.getByText('Nháp', { exact: true })).toBeVisible();
  await expect(sub.getByText(c.name, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Thoát xem trước' })).toBeVisible();
  await expect(page.getByRole('tab')).toHaveText([/^Bài học\s*1$/, /^Bài tập\s*1$/]);
  await expect(page.getByRole('tab', { name: /^Bài học/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('Không ghi nhận lượt làm, bài nộp hay điểm', { exact: true })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('article')).toContainText('Bước đã xuất bản');
  await expect(
    page.getByText('Bài đang ở trạng thái Nháp — học viên chưa thấy bài này cho tới khi bài được xuất bản.', { exact: true }),
  ).toBeVisible();
  await shot(page, 'TC-063', 1);

  await page.goto(`/gv/giao-trinh/${c.id}/bai/${l.id}`);
  await expect(page.getByRole('region', { name: 'Thủ công' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Xem như học viên/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Soạn thủ công' }).click();
  await expect(page.getByRole('region', { name: 'Bước học 1' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Xem như học viên/ })).toHaveCount(0);
  await page.getByRole('tab', { name: /Bài tập/ }).click();
  await expect(page.getByRole('region', { name: 'Bộ bài tập 1' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Xem như học viên/ })).toHaveCount(0);
});

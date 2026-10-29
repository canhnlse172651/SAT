import { test, expect } from '@playwright/test';
import {
  READY_SET,
  READY_STEP,
  addItem,
  addLesson,
  asGv,
  createCurriculum,
  publishLesson,
  shot,
  uid,
} from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-7.5] [002:AC-7.11] [002:AC-7.14] [002:AC-8.3] TC-026 T07 mở ở tab Bài học, phần đầu, không chế độ xem trước', async ({
  page,
}) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-026 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  const s1 = await addItem(page, l.id, 'lesson', { title: 'Bước một', content: READY_STEP });
  await addItem(page, l.id, 'lesson', { title: 'Bước hai', content: READY_STEP });
  await addItem(page, l.id, 'exercise', { title: 'Bộ một', content: READY_SET });

  await page.goto(`/gv/giao-trinh/${c.id}/bai/${l.id}`);
  await page.getByRole('button', { name: 'Soạn thủ công' }).click();
  await expect(page).toHaveURL(/\/bai-hoc$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Soạn bài thủ công');
  await expect(page.getByRole('tab', { name: /^Bài học/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('region', { name: 'Bước học 1' }).getByLabel('Tên')).toHaveValue('Bước một');
  await expect(page.getByRole('region', { name: 'Bước học 2' }).getByLabel('Tên')).toHaveValue('Bước hai');

  await expect(page.getByRole('navigation', { name: 'Đường dẫn' }).getByRole('link', { name: c.name })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Về Soạn bài' })).toBeVisible();
  await expect(page.getByText('Bài 1', { exact: true }).first()).toBeVisible();
  await expect(page.locator('.page-sub').getByText('Nháp', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Xuất bản bài…' })).toBeVisible();
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveText([/^Bài học\s*2$/, /^Bài tập\s*1$/]);
  for (const b of ['Xem trước', 'Chỉnh sửa', 'Xong', 'Xem như học viên', 'Web', 'Mobile']) {
    await expect(page.getByRole('button', { name: b, exact: true })).toHaveCount(0);
    await expect(page.getByRole('radio', { name: b, exact: true })).toHaveCount(0);
  }
  await shot(page, 'TC-026', 1);

  await publishLesson(page, l.id, [s1]);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Xuất bản… (2 Nháp)' })).toBeVisible();
  await expect(page.locator('.page-sub').getByText('Đã xuất bản', { exact: true })).toBeVisible();
});

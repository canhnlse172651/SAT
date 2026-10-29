import { test, expect } from '@playwright/test';
import {
  READY_STEP,
  addItem,
  addLesson,
  createCurriculum,
  devClass,
  publishLesson,
  registerGv,
  shot,
} from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-3.1] [002:AC-3.4] TC-006 T05 trống rồi thẻ giáo trình đầy đủ thông tin', async ({ page }) => {
  await page.goto('/');
  await registerGv(page);
  await page.goto('/gv/giao-trinh');
  await expect(page.getByRole('heading', { name: 'Bạn chưa có giáo trình nào' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tạo giáo trình' })).toHaveCount(2);
  await shot(page, 'TC-006', 1);

  const a = await createCurriculum(page, 'A', 1);
  await createCurriculum(page, 'B', 2);
  const l1 = await addLesson(page, a.id, 'Bài 1');
  await addLesson(page, a.id, 'Bài 2');
  const s = await addItem(page, l1.id, 'lesson', { title: 'Chào', content: READY_STEP });
  await publishLesson(page, l1.id, [s]);
  await devClass(page, a.id, 'Lớp A1');

  await page.reload();
  const cards = page.getByRole('list', { name: 'Danh sách giáo trình' }).getByRole('listitem');
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0).getByRole('link')).toHaveText('A');
  await expect(cards.nth(1).getByRole('link')).toHaveText('B');
  const cardA = cards.nth(0);
  await expect(cardA.getByRole('img', { name: 'Ảnh bìa mặc định HSK1' })).toBeVisible();
  await expect(cardA.getByText('HSK1', { exact: true }).last()).toBeVisible();
  await expect(cardA.getByText('2 bài · 1 đã xuất bản')).toBeVisible();
  await expect(cardA.getByText('Dùng bởi 1 lớp')).toBeVisible();
  // Vietnam time (UTC+7) of the API's updatedAt.
  const list = await page.request.get('/api/curricula').then((r) => r.json());
  const vn = new Date(Date.parse(list.items[0].updatedAt) + 7 * 3600_000).toISOString();
  const hm = vn.slice(11, 16);
  const dmy = `${vn.slice(8, 10)}/${vn.slice(5, 7)}/${vn.slice(0, 4)}`;
  await expect(cardA.getByText(/^Cập nhật /)).toHaveText(
    new RegExp(`^Cập nhật (${hm} ${dmy}|${dmy} ${hm})$`),
  );
  await shot(page, 'TC-006', 2);
});

import { test, expect } from '@playwright/test';
import {
  READY_SET,
  READY_STEP,
  addItem,
  addLesson,
  asGv,
  createCurriculum,
  devClass,
  learningData,
  lessonRow,
  publishLesson,
  shot,
  uid,
} from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-4.1] [002:AC-4.3] TC-011 T06 dòng Bài: số, tên, trạng thái, tóm tắt, nhãn; thông báo lớp đang dùng', async ({
  page,
}) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-011 ${uid()}`, 1, 'Mô tả TC-011');
  const l1 = await addLesson(page, c.id, 'Bài 1');
  await addLesson(page, c.id, 'Bài 2');
  const a = await addItem(page, l1.id, 'lesson', { title: 'B1', content: READY_STEP });
  const b = await addItem(page, l1.id, 'lesson', { title: 'B2', content: READY_STEP });
  const e = await addItem(page, l1.id, 'exercise', { title: 'E1', content: READY_SET });
  await addItem(page, l1.id, 'lesson', { title: 'B3 nháp', content: READY_STEP });
  await publishLesson(page, l1.id, [a, b, e]);
  await devClass(page, c.id, 'Lớp TC-011');
  await learningData(page, e);

  await page.goto(`/gv/giao-trinh/${c.id}`);
  const notice =
    'Giáo trình đang được dùng bởi 1 lớp. Thay đổi với nội dung đã xuất bản sẽ hiển thị ngay cho học viên các lớp này.';
  const head = page.getByRole('heading', { level: 1 });
  await expect(head).toContainText(c.name);
  await expect(head).toContainText('HSK1');
  await expect(page.getByText('Mô tả TC-011')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Ảnh bìa mặc định HSK1' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Dùng bởi 1 lớp' })).toBeVisible();
  await expect(page.getByText(notice)).toBeVisible();

  const r1 = lessonRow(page, 'Bài 1');
  await expect(r1.getByText('1', { exact: true })).toBeVisible();
  await expect(r1.getByRole('link', { name: 'Bài 1' })).toBeVisible();
  await expect(r1.getByText('Đã xuất bản', { exact: true })).toBeVisible();
  await expect(r1.getByText('3 bước học · 1 bộ bài tập · 1 mục nháp')).toBeVisible();
  await expect(r1.getByText('Có dữ liệu học viên')).toBeVisible();
  await expect(r1.getByText(/^Cập nhật .*\d{2}\/\d{2}\/\d{4}/)).toBeVisible();
  await expect(lessonRow(page, 'Bài 2').getByText('Nháp', { exact: true })).toBeVisible();
  await shot(page, 'TC-011', 1);

  await r1.getByRole('link', { name: 'Bài 1' }).click();
  await expect(page.getByText(notice)).toBeVisible();
  await shot(page, 'TC-011', 2);
});

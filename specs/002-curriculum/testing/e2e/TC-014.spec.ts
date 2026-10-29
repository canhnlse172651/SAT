import { test, expect } from '@playwright/test';
import {
  READY_STEP,
  addItem,
  addLesson,
  asGv,
  createCurriculum,
  devClass,
  lessonRow,
  otherPage,
  publishLesson,
  shot,
  uid,
} from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-13.2] [002:AC-13.5] TC-014 giáo trình đang dùng không xóa được, lưu trữ thay thế', async ({
  page,
  browser,
}) => {
  const name = `TC-014 ${uid()}`;
  await asGv(page);
  const c = await createCurriculum(page, name, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  const s = await addItem(page, l.id, 'lesson', { title: 'Chào', content: READY_STEP });
  await publishLesson(page, l.id, [s]);
  await devClass(page, c.id, 'Lớp K3', { status: 'ended', studentEmails: ['hv1@sat.dev'] });

  await page.goto(`/gv/giao-trinh/${c.id}`);
  await page.getByRole('button', { name: 'Thao tác giáo trình' }).click();
  await page.getByRole('menuitem', { name: 'Xóa giáo trình' }).click();
  const dlg = page.getByRole('alertdialog');
  await expect(dlg).toContainText('Không thể xóa: giáo trình đang được dùng bởi 1 lớp.');
  await expect(dlg).toContainText('Lớp K3');
  await shot(page, 'TC-014', 1);
  await dlg.getByRole('button', { name: 'Lưu trữ' }).click();
  await expect(page.getByText(/^Đã lưu trữ giáo trình/)).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Đã lưu trữ');

  await page.goto('/gv/giao-trinh');
  await page.getByLabel('Tìm giáo trình').fill(name);
  await expect(page.getByRole('heading', { name: 'Không tìm thấy giáo trình phù hợp' })).toBeVisible();
  await page.getByRole('switch', { name: 'Đã lưu trữ' }).click();
  await expect(page.getByRole('link', { name })).toBeVisible();
  await shot(page, 'TC-014', 2);

  await page.getByRole('link', { name }).click();
  await lessonRow(page, 'Bài 1').getByRole('button', { name: 'Thao tác với Bài 1' }).click();
  await page.getByRole('menuitem', { name: 'Đổi tên' }).click();
  await page.getByRole('dialog', { name: 'Đổi tên bài' }).getByLabel('Tên bài').fill('Bài 1 – mới');
  await page.getByRole('dialog', { name: 'Đổi tên bài' }).getByRole('button', { name: 'Lưu' }).click();
  await expect(page.getByText('Đã đổi tên bài', { exact: true })).toBeVisible();

  const hv = await otherPage(browser, 'HV');
  const seen = await hv.request.get(`/api/learn/curricula/${c.id}`).then((r) => r.json());
  expect(seen.lessons.map((x: { name: string }) => x.name)).toEqual(['Bài 1 – mới']);
  expect(seen.lessons[0].sections.lesson).toHaveLength(1);
  await hv.context().close();

  const selectable = await page.request.get('/api/curricula?selectable=true&q=' + encodeURIComponent(name)).then((r) => r.json());
  expect(selectable.total).toBe(0);
});

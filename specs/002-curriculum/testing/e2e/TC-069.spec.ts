import { test, expect } from '@playwright/test';
import { READY_STEP, addItem, addLesson, asGv, createCurriculum, getLesson, lessonRow, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-17.4] TC-069 thao tác dựa trên dữ liệu đã đổi ở tab khác bị từ chối, giữ nội dung đang nhập', async ({
  page,
  context,
}) => {
  const msg = 'Dữ liệu đã thay đổi ở nơi khác. Vui lòng kiểm tra lại.';
  await asGv(page);
  const c = await createCurriculum(page, `TC-069 ${uid()}`, 1);
  const l1 = await addLesson(page, c.id, 'Bài 1');
  await addLesson(page, c.id, 'Bài 2');
  await addItem(page, l1.id, 'lesson', { title: 'S1', content: READY_STEP });
  await addItem(page, l1.id, 'lesson', { title: 'S2', content: READY_STEP });

  const x = page;
  const y = await context.newPage();
  await x.goto(`/gv/giao-trinh/${c.id}`);
  await y.goto(`/gv/giao-trinh/${c.id}`);

  // B2: rename in Y, then rename in X from the stale version.
  const rename = async (p: typeof x, from: string, to: string) => {
    await lessonRow(p, from).getByRole('button', { name: `Thao tác với ${from}` }).click();
    await p.getByRole('menuitem', { name: 'Đổi tên' }).click();
    await p.getByRole('dialog', { name: 'Đổi tên bài' }).getByLabel('Tên bài').fill(to);
    await p.getByRole('dialog', { name: 'Đổi tên bài' }).getByRole('button', { name: 'Lưu' }).click();
  };
  await rename(y, 'Bài 1', 'Bài 1 (Y)');
  await expect(y.getByText('Đã đổi tên bài', { exact: true })).toBeVisible();
  await rename(x, 'Bài 1', 'Bài 1 (X)');
  await expect(x.getByText(msg, { exact: true })).toBeVisible();
  await expect(x.getByRole('dialog', { name: 'Đổi tên bài' }).getByLabel('Tên bài')).toHaveValue('Bài 1 (X)');
  await expect(x.locator('.cur-row__name').first()).toHaveText('Bài 1 (Y)');
  await shot(x, 'TC-069', 1);
  await x.getByRole('dialog', { name: 'Đổi tên bài' }).getByRole('button', { name: 'Hủy' }).click();
  expect((await getLesson(x, l1.id)).name).toBe('Bài 1 (Y)');

  // B3: Y reorders, X moves from the old order.
  await y.reload();
  await y.getByRole('button', { name: 'Kéo để sắp xếp: Bài 2' }).dragTo(lessonRow(y, 'Bài 1 (Y)'));
  await expect(y.locator('.cur-row__name')).toHaveText(['Bài 2', 'Bài 1 (Y)']);
  await expect(x.locator('.cur-row__name')).toHaveText(['Bài 1 (Y)', 'Bài 2']);
  await lessonRow(x, 'Bài 1 (Y)').getByRole('button', { name: 'Xuống dưới' }).click();
  await expect(x.getByText(msg, { exact: true }).first()).toBeVisible();
  await expect(x.locator('.cur-row__name')).toHaveText(['Bài 2', 'Bài 1 (Y)']);

  // B4: X is typing in "Sửa thông tin" while Y changes the description.
  await x.getByRole('button', { name: 'Thao tác giáo trình' }).click();
  await x.getByRole('menuitem', { name: 'Sửa thông tin' }).click();
  const form = x.getByRole('dialog', { name: 'Sửa thông tin giáo trình' });
  await form.getByLabel('Mô tả').fill('Mô tả của X');
  await y.reload();
  await y.getByRole('button', { name: 'Thao tác giáo trình' }).click();
  await y.getByRole('menuitem', { name: 'Sửa thông tin' }).click();
  await y.getByRole('dialog', { name: 'Sửa thông tin giáo trình' }).getByLabel('Mô tả').fill('Mô tả của Y');
  await y.getByRole('dialog', { name: 'Sửa thông tin giáo trình' }).getByRole('button', { name: 'Lưu' }).click();
  await expect(y.getByText('Đã lưu thay đổi', { exact: true })).toBeVisible();
  await form.getByRole('button', { name: 'Lưu' }).click();
  await expect(x.getByText(msg, { exact: true }).first()).toBeVisible();
  await expect(form.getByLabel('Mô tả')).toHaveValue('Mô tả của X');
  await expect(x.locator('.page-sub').getByText('Mô tả của Y')).toBeVisible();
  await shot(x, 'TC-069', 2);
  await form.getByRole('button', { name: 'Hủy' }).click();

  // B5: Y deletes step 2 in T07 while X edits it.
  const editor = `/gv/giao-trinh/${c.id}/bai/${l1.id}/bai-hoc`;
  await x.goto(editor);
  await y.goto(editor);
  await y.getByRole('region', { name: 'Bước học 2' }).getByRole('button', { name: 'Xóa' }).click();
  await y.getByRole('alertdialog').getByRole('button', { name: 'Xóa' }).click();
  await expect(y.getByText('Đã xóa · Đã lưu', { exact: true })).toBeVisible();
  await x.getByRole('region', { name: 'Bước học 2' }).getByLabel('Tên').fill('S2 của X');
  await x.getByRole('region', { name: 'Bước học 2' }).getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(x.getByText(msg, { exact: true }).first()).toBeVisible();
  await expect(x.getByRole('region', { name: 'Bước học 2' })).toHaveCount(0);
  expect((await getLesson(x, l1.id)).items.map((i: { title: string }) => i.title)).toEqual(['S1']);
  await y.close();
});

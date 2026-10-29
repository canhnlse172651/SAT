import { test, expect } from '@playwright/test';
import {
  READY_STEP,
  addItem,
  addLesson,
  asGv,
  createCurriculum,
  devClass,
  otherPage,
  publishLesson,
  shot,
  uid,
} from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-2.3] [002:AC-2.4] TC-010 đổi cấp độ HSK của giáo trình đang dùng: xác nhận, hủy, lớp thấy mới', async ({
  page,
  browser,
}) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-010 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  const s = await addItem(page, l.id, 'lesson', { title: 'Chào', content: READY_STEP });
  await publishLesson(page, l.id, [s]);
  await devClass(page, c.id, 'Lớp A', { studentEmails: ['hv1@sat.dev'] });
  await devClass(page, c.id, 'Lớp B');

  await page.goto(`/gv/giao-trinh/${c.id}`);
  const head = page.getByRole('heading', { level: 1 });
  const edit = async () => {
    await page.getByRole('button', { name: 'Thao tác giáo trình' }).click();
    await page.getByRole('menuitem', { name: 'Sửa thông tin' }).click();
    const dlg = page.getByRole('dialog', { name: 'Sửa thông tin giáo trình' });
    await dlg.getByRole('button', { name: 'HSK3', exact: true }).click();
    await dlg.getByRole('button', { name: 'Lưu' }).click();
  };

  await edit();
  const confirm = page.getByRole('alertdialog');
  await expect(confirm).toContainText(
    'Giáo trình đang được dùng bởi 2 lớp. Bạn có chắc muốn đổi cấp độ HSK?',
  );
  await shot(page, 'TC-010', 1);
  await confirm.getByRole('button', { name: 'Hủy' }).click();
  // The form comes back with the old level; close it without saving.
  const dlg = page.getByRole('dialog', { name: 'Sửa thông tin giáo trình' });
  await expect(dlg.getByRole('button', { name: 'HSK1', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await dlg.getByRole('button', { name: 'Hủy' }).click();
  await expect(head).toContainText('HSK1');
  expect((await page.request.get(`/api/curricula/${c.id}`).then((r) => r.json())).hsk).toBe(1);

  await edit();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Đổi cấp độ' }).click();
  await expect(page.getByText('Đã lưu thay đổi', { exact: true })).toBeVisible();
  await expect(head).toContainText('HSK3');
  await shot(page, 'TC-010', 2);

  const hv = await otherPage(browser, 'HV');
  const seen = await hv.request.get(`/api/learn/curricula/${c.id}`).then((r) => r.json());
  expect(seen.hsk).toBe(3);
  expect(seen.lessons).toHaveLength(1);
  expect(seen.lessons[0].sections.lesson).toHaveLength(1);
  await hv.context().close();
});

import { test, expect } from '@playwright/test';
import {
  READY_SET,
  READY_STEP,
  addItem,
  addLesson,
  asGv,
  createCurriculum,
  devClass,
  getLesson,
  lessonRow,
  otherPage,
  shot,
  uid,
} from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-9.3] [002:AC-9.4] TC-034 hộp xuất bản bài: chọn sẵn mục sẵn sàng, cảnh báo lớp, HV thấy đúng', async ({
  page,
  browser,
}) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-034 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  const s = await addItem(page, l.id, 'lesson', { title: 'Bước sẵn sàng', content: READY_STEP });
  await addItem(page, l.id, 'lesson', { title: 'Bước trống', content: { blocks: [{ type: 'text', text: '' }] } });
  const e = await addItem(page, l.id, 'exercise', { title: 'Bộ sẵn sàng', content: READY_SET });
  await devClass(page, c.id, 'Lớp TC-034', { studentEmails: ['hv1@sat.dev'] });

  await page.goto(`/gv/giao-trinh/${c.id}`);
  await lessonRow(page, 'Bài 1').getByRole('button', { name: 'Thao tác với Bài 1' }).click();
  await page.getByRole('menuitem', { name: 'Xuất bản bài' }).click();
  const dlg = page.getByRole('dialog', { name: 'Xuất bản “Bài 1”' });
  await expect(dlg).toContainText('Bài sẽ hiển thị với học viên của 1 lớp (trừ các phần đang ẩn ở từng lớp).');
  const lessonGroup = dlg.getByRole('group', { name: 'Bài học' });
  const exGroup = dlg.getByRole('group', { name: 'Bài tập' });
  await expect(lessonGroup.getByRole('checkbox', { name: 'Bước sẵn sàng' })).toBeChecked();
  await expect(lessonGroup.getByText('Bước trống')).toBeVisible();
  await expect(lessonGroup.getByText('Khối 1 (Văn bản) đang trống')).toBeVisible();
  await expect(lessonGroup.getByRole('checkbox', { name: 'Bước trống' })).toHaveCount(0);
  const setBox = exGroup.getByRole('checkbox', { name: 'Bộ sẵn sàng' });
  await expect(setBox).toBeChecked();
  await shot(page, 'TC-034', 1);
  await setBox.uncheck();
  await setBox.check();
  await dlg.getByRole('button', { name: 'Xuất bản bài' }).click();
  await expect(page.getByText('Đã xuất bản bài', { exact: true })).toBeVisible();

  const saved = await getLesson(page, l.id);
  expect(saved.status).toBe('published');
  const st = (id: string) => saved.items.find((i: { id: string }) => i.id === id).status;
  expect(st(s)).toBe('published');
  expect(st(e)).toBe('published');
  expect(saved.items.find((i: { title: string }) => i.title === 'Bước trống').status).toBe('draft');

  const hv = await otherPage(browser, 'HV');
  const seen = await hv.request.get(`/api/learn/curricula/${c.id}`).then((r) => r.json());
  expect(seen.lessons).toHaveLength(1);
  expect(seen.lessons[0].sections.lesson.map((i: { title: string }) => i.title)).toEqual(['Bước sẵn sàng']);
  expect(seen.lessons[0].sections.exercise.map((i: { title: string }) => i.title)).toEqual(['Bộ sẵn sàng']);
  await hv.context().close();
});

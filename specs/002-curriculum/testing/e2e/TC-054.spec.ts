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
  learningData,
  otherPage,
  publishLesson,
  shot,
  uid,
} from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-18.1] [002:AC-18.2] [002:AC-18.4] TC-054 lưu trữ và khôi phục bộ bài tập có dữ liệu', async ({
  page,
  browser,
}) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-054 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  const s = await addItem(page, l.id, 'lesson', { title: 'S', content: READY_STEP });
  const e1 = await addItem(page, l.id, 'exercise', { title: 'E1', content: READY_SET });
  const e2 = await addItem(page, l.id, 'exercise', { title: 'E2', content: READY_SET });
  await publishLesson(page, l.id, [s, e1, e2]);
  await learningData(page, e1);
  await devClass(page, c.id, 'Lớp TC-054', { studentEmails: ['hv1@sat.dev'] });
  const hv = await otherPage(browser, 'HV');
  const hvSets = async () =>
    (await hv.request.get(`/api/learn/lessons/${l.id}`).then((r) => r.json())).sections.exercise.map(
      (i: { title: string }) => i.title,
    );
  expect(await hvSets()).toEqual(['E1', 'E2']);

  await page.goto(`/gv/giao-trinh/${c.id}/bai/${l.id}/thu-cong`);
  await page.getByRole('region', { name: 'Bộ bài tập 1' }).getByRole('button', { name: 'Lưu trữ' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(page.getByText('Đã lưu trữ · Đã lưu', { exact: true })).toBeVisible();
  expect((await getLesson(page, l.id)).items.filter((i: { section: string }) => i.section === 'exercise').map((i: { title: string; status: string }) => [i.title, i.status])).toEqual([
    ['E1', 'archived'],
    ['E2', 'published'],
  ]);
  expect(await hvSets()).toEqual(['E2']);

  await page.getByRole('switch', { name: 'Hiện mục lưu trữ (1)' }).click();
  const e1Region = page.getByRole('region', { name: 'Bộ bài tập 1' });
  await e1Region.getByRole('button', { name: 'Khôi phục' }).click();
  await expect(page.getByText('Đã khôi phục · Đã lưu', { exact: true })).toBeVisible();
  await expect(e1Region.getByText('Đã xuất bản', { exact: true })).toBeVisible();
  await expect(e1Region.getByLabel('Tên')).toHaveValue('E1');
  await shot(page, 'TC-054', 1);
  expect(await hvSets()).toEqual(['E1', 'E2']);
  // Its learning data is still there: it still cannot be deleted.
  await e1Region.getByRole('button', { name: 'Xóa' }).click();
  await expect(page.getByText('Bộ bài tập đã có dữ liệu học tập nên không xóa được — hãy Lưu trữ.', { exact: true })).toBeVisible();
  await hv.context().close();
});

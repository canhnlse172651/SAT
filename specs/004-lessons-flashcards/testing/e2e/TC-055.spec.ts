import { expect, test } from '@playwright/test';
import {
  S11,
  T07,
  archiveStep,
  evidence,
  getLesson,
  gvPage,
  hvPage,
  newClass,
  newCurriculum,
  newLesson,
  publishLesson,
  publishedStep,
  text,
} from './helpers';

test('[004:AC-7.8] TC-055 archived steps are hidden by default, shown in place with the toggle, editable', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await publishedStep(page, les.id, 'Một', [text('<p>一</p>')]);
  const mid = await publishedStep(page, les.id, 'Hai', [text('<p>二</p>')]);
  await publishedStep(page, les.id, 'Ba', [text('<p>三</p>')]);
  await archiveStep(page, les.id, mid);
  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  const cls = await newClass(page, cur.id, [hv.who.user.id]);

  await page.goto(T07(cur.id, les.id));
  await expect(page.getByRole('region', { name: /^Bước học \d+$/ })).toHaveCount(2);
  await page.getByRole('switch', { name: 'Hiện mục lưu trữ (1)' }).click();
  const archived = page.getByRole('region', { name: 'Bước học 2' });
  await expect(archived.getByLabel('Tên bước học')).toHaveValue('Hai');
  await expect(archived.getByText('Lưu trữ', { exact: true })).toBeVisible();
  await expect(archived).toHaveClass(/cur-item--archived/);
  for (const name of ['Khôi phục', 'Lên trên', 'Xuống dưới', 'Thêm sau', 'Xóa']) {
    await expect(archived.getByRole('button', { name, exact: true })).toBeVisible();
  }
  await archived.getByLabel('Tên bước học').fill('Hai (sửa khi lưu trữ)');
  await archived.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(archived.getByText('Chưa lưu', { exact: true })).toHaveCount(0);
  const item = (await getLesson(page, les.id)).items.find((i: { id: string }) => i.id === mid);
  expect(item.status).toBe('archived');
  expect(item.title).toBe('Hai (sửa khi lưu trữ)');
  await evidence(page, 'TC-055');

  await hv.page.goto(S11(cls.id, les.id));
  await expect(hv.page.getByText('Ba')).toBeVisible();
  await expect(hv.page.getByText(/Hai/)).toHaveCount(0);
});

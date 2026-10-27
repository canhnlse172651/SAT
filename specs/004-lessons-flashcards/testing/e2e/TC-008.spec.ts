import { expect, test } from '@playwright/test';
import {
  S11,
  T07,
  T21,
  evidence,
  gvPage,
  hvPage,
  newClass,
  newCurriculum,
  newLesson,
  publishLesson,
  publishedStep,
  text,
} from './helpers';

test('[004:AC-1.5] TC-008 moving a step down is saved and shared by T18 and S11', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  for (const n of ['A', 'B', 'C']) await publishedStep(page, les.id, `Bước ${n}`, [text('<p>文</p>')]);
  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  const cls = await newClass(page, cur.id, [hv.who.user.id]);

  await page.goto(T07(cur.id, les.id));
  await page.getByRole('region', { name: 'Bước học 1' }).getByRole('button', { name: 'Xuống dưới' }).click();
  await expect(page.getByText('Đã chuyển tới vị trí 2/3 · Đã lưu').first()).toBeVisible();
  const names = async () =>
    Promise.all([1, 2, 3].map((n) => page.getByRole('region', { name: `Bước học ${n}` }).getByLabel('Tên bước học').inputValue()));
  expect(await names()).toEqual(['Bước B', 'Bước A', 'Bước C']);
  await evidence(page, 'TC-008', 1);

  // T18 (002) shows only a summary of the section; the order is visible in T21, also 002's.
  await page.goto(`/gv/giao-trinh/${cur.id}/bai/${les.id}`);
  await expect(page.getByText('3 bước học · 3 đã xuất bản')).toBeVisible();
  await page.goto(T21(cur.id, les.id));
  await expect(page.getByRole('heading', { name: 'Bước C' })).toBeVisible();
  const t21 = await page.locator('main').innerText();
  expect(t21.indexOf('Bước B')).toBeGreaterThan(-1);
  expect(t21.indexOf('Bước B')).toBeLessThan(t21.indexOf('Bước A'));
  expect(t21.indexOf('Bước A')).toBeLessThan(t21.indexOf('Bước C'));

  await hv.page.goto(S11(cls.id, les.id));
  await expect(hv.page.getByText('Bước C')).toBeVisible();
  const s11 = await hv.page.locator('main').innerText();
  expect(s11.indexOf('Bước B')).toBeLessThan(s11.indexOf('Bước A'));
  expect(s11.indexOf('Bước A')).toBeLessThan(s11.indexOf('Bước C'));
  await evidence(hv.page, 'TC-008', 2);
});

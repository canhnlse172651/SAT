/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { T07, addItem, b6, evidence, getLesson, gvPage, newCurriculum, newLesson, publishItem, setBlock } from './helpers';

test('[005:NFR-12] [005:NFR-13] TC-124 a Bài of 10 sets × 30 questions', async ({ browser }) => {
  test.setTimeout(180_000);
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  for (let s = 0; s < 10; s++) {
    const qs = Array.from({ length: 5 }, () => b6().questions).flat().slice(0, 30);
    const id = await addItem(page, les.id, 'exercise');
    await publishItem(page, les.id, id, `Bộ ${s + 1}`, { instructions: '', stepId: null, questions: qs });
  }
  await page.goto(T07(cur.id, les.id));
  // 1. First opening of the Bài tập tab.
  let t0 = Date.now();
  await page.getByRole('tab', { name: /^Bài tập/ }).click();
  await expect(setBlock(page, 10).getByText('Câu 30 · ', { exact: false })).toBeVisible();
  const first = Date.now() - t0;
  // 2. To Bài học and back.
  await page.getByRole('tab', { name: /^Bài học/ }).click();
  t0 = Date.now();
  await page.getByRole('tab', { name: /^Bài tập/ }).click();
  await expect(setBlock(page, 10).getByText('Câu 30 · ', { exact: false })).toBeVisible();
  const again = Date.now() - t0;
  console.log(`TC-124: first open ${first} ms, back again ${again} ms`);
  expect(first).toBeLessThanOrEqual(3000);
  expect(again).toBeLessThanOrEqual(1000);
  // 3. Edit 3 sets, switch tabs 10 times, save them one by one.
  for (const n of [2, 5, 9]) await setBlock(page, n).getByLabel('Tiêu đề', { exact: true }).fill(`Bộ ${n} sửa`);
  for (let k = 0; k < 10; k++) await page.getByRole('tab', { name: k % 2 ? /^Bài tập/ : /^Bài học/ }).click();
  await expect(page.getByRole('tab', { name: /^Bài tập · 3 chưa lưu/ })).toBeVisible();
  for (const n of [2, 5, 9]) await expect(setBlock(page, n).getByLabel('Tiêu đề', { exact: true })).toHaveValue(`Bộ ${n} sửa`);
  let l = await getLesson(page, les.id);
  expect(l.items.map((i: any) => i.title)).toEqual(Array.from({ length: 10 }, (_, k) => `Bộ ${k + 1}`));
  for (const n of [2, 5]) {
    await setBlock(page, n).getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(setBlock(page, n).getByText(/^Đã lưu lúc/)).toBeVisible();
  }
  l = await getLesson(page, les.id);
  expect(l.items.map((i: any) => i.title)).toEqual(Array.from({ length: 10 }, (_, k) => ([1, 4].includes(k) ? `Bộ ${k + 1} sửa` : `Bộ ${k + 1}`)));
  await expect(setBlock(page, 9).getByText('Chưa lưu', { exact: true })).toBeVisible();
  await setBlock(page, 9).getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(setBlock(page, 9).getByText(/^Đã lưu lúc/)).toBeVisible();
  l = await getLesson(page, les.id);
  expect(l.items[8].title).toBe('Bộ 9 sửa');
  await evidence(page, 'TC-124');
});

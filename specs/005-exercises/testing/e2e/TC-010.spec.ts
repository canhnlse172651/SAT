/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { T09, draftSet, evidence, getLesson, gvPage, mcq, newCurriculum, newLesson, set, setBlock } from './helpers';

test('[005:AC-1.10] TC-010 moving a set saves the order at once', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const q = () => set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]);
  const a = await draftSet(page, les.id, 'Bộ A', q());
  const b = await draftSet(page, les.id, 'Bộ B', q());
  const c = await draftSet(page, les.id, 'Bộ C', q());
  await page.goto(T09(cur.id, les.id));
  await setBlock(page, 2).getByLabel('Tiêu đề', { exact: true }).fill('Bộ B sửa');

  // "Lên" of the first and "Xuống" of the last are disabled.
  await expect(setBlock(page, 1).getByRole('button', { name: 'Lên', exact: true })).toBeDisabled();
  await expect(setBlock(page, 3).getByRole('button', { name: 'Xuống', exact: true })).toBeDisabled();
  // 1. "Xuống" on A.
  await setBlock(page, 1).getByRole('button', { name: 'Xuống', exact: true }).click();
  await expect(page.getByText('Đã chuyển tới vị trí 2/3 · Đã lưu').first()).toBeVisible();
  await expect(setBlock(page, 1).getByLabel('Tiêu đề', { exact: true })).toHaveValue('Bộ B sửa');
  await expect(setBlock(page, 1).getByText('Chưa lưu')).toBeVisible();
  await expect(setBlock(page, 2).getByLabel('Tiêu đề', { exact: true })).toHaveValue('Bộ A');
  await expect(setBlock(page, 3).getByLabel('Tiêu đề', { exact: true })).toHaveValue('Bộ C');
  await expect(setBlock(page, 1).getByRole('button', { name: 'Lên', exact: true })).toBeDisabled();
  await expect(setBlock(page, 3).getByRole('button', { name: 'Xuống', exact: true })).toBeDisabled();
  await evidence(page, 'TC-010', 1);
  // 2. Reload (leave warning accepted): the order is saved, B's edit was not.
  page.on('dialog', (d) => void d.accept());
  await page.reload();
  await expect(setBlock(page, 1).getByLabel('Tiêu đề', { exact: true })).toHaveValue('Bộ B');
  await expect(setBlock(page, 2).getByLabel('Tiêu đề', { exact: true })).toHaveValue('Bộ A');
  const l = await getLesson(page, les.id);
  expect(l.items.filter((i: any) => i.section === 'exercise').map((i: any) => i.id)).toEqual([b, a, c]);
  await evidence(page, 'TC-010', 2);
});

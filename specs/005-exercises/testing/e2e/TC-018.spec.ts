import { expect, test } from '@playwright/test';
import { T09, draftSet, evidence, gvPage, itemOf, mcq, newCurriculum, newLesson, set, setBlock } from './helpers';

test('[005:AC-2.4] [005:AC-2.6] [005:AC-12.14] TC-018 invalid points block the save of that set only', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const q = () => set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]);
  const a = await draftSet(page, les.id, 'Bộ A', q());
  const b = await draftSet(page, les.id, 'Bộ B', q());
  await page.goto(T09(cur.id, les.id));
  const block = setBlock(page, 1);
  const points = block.getByRole('region', { name: 'Câu 1', exact: true }).getByRole('textbox', { name: 'Điểm', exact: true });

  // 1. Points 0,3, leave the field.
  await points.fill('0,3');
  await block.getByLabel('Tiêu đề', { exact: true }).focus();
  await expect(points).toHaveAttribute('aria-invalid', 'true');
  await expect(block.getByText('Điểm phải từ 0,5 đến 100 và theo bước 0,5', { exact: true })).toBeVisible();
  // 2. "Lưu nháp": not saved, focus on the points field.
  await block.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(block.getByText('Chưa lưu được: Điểm phải từ 0,5 đến 100 và theo bước 0,5')).toBeVisible();
  await expect(points).toBeFocused();
  await expect(block.getByText('Chưa lưu', { exact: true })).toBeVisible();
  expect((await itemOf(page, les.id, a)).content.questions[0].points).toBe(1);
  await evidence(page, 'TC-018');
  // 3. Another set saves.
  await setBlock(page, 2).getByLabel('Tiêu đề', { exact: true }).fill('Bộ B sửa');
  await setBlock(page, 2).getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(setBlock(page, 2).getByText(/^Đã lưu lúc \d\d:\d\d$/)).toBeVisible();
  expect((await itemOf(page, les.id, b)).title).toBe('Bộ B sửa');
});

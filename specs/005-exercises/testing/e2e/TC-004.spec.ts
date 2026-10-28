import { expect, test } from '@playwright/test';
import { T09, addItem, draftSet, evidence, gvPage, itemOf, mcq, newCurriculum, newLesson, publishedStep, saveItem, set, setBlock } from './helpers';

test('[005:AC-1.3] TC-004 one linked step per set, several sets may share it', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await publishedStep(page, les.id, 'Bước Một');
  const s2 = await addItem(page, les.id, 'lesson');
  await saveItem(page, les.id, s2, 'Bước Hai', { goal: '', blocks: [] });
  await publishedStep(page, les.id, 'Bước Ba');
  const q = () => set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]);
  const a = await draftSet(page, les.id, 'Bộ 1', q());
  const b = await draftSet(page, les.id, 'Bộ 2', q());
  await page.goto(T09(cur.id, les.id));

  // 1. The list: "Không liên kết" + the 3 steps in order with their status; one choice only.
  const pick1 = setBlock(page, 1).getByLabel('Bước học liên kết');
  await expect(pick1.locator('option')).toHaveText([
    'Không liên kết',
    'Bước Một (Đã xuất bản)',
    'Bước Hai (Nháp)',
    'Bước Ba (Đã xuất bản)',
  ]);
  expect(await pick1.evaluate((el: HTMLSelectElement) => el.multiple)).toBe(false);
  await pick1.selectOption({ label: 'Bước Hai (Nháp)' });
  // 2. Set 2 chooses the same step.
  await setBlock(page, 2).getByLabel('Bước học liên kết').selectOption({ label: 'Bước Hai (Nháp)' });
  // 3. Save both.
  await setBlock(page, 1).getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(setBlock(page, 1).getByText(/^Đã lưu lúc \d\d:\d\d$/)).toBeVisible();
  await setBlock(page, 2).getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(setBlock(page, 2).getByText(/^Đã lưu lúc \d\d:\d\d$/)).toBeVisible();
  expect((await itemOf(page, les.id, a)).content.stepId).toBe(s2);
  expect((await itemOf(page, les.id, b)).content.stepId).toBe(s2);
  await evidence(page, 'TC-004');
});

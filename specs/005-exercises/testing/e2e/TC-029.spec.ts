import { expect, test } from '@playwright/test';
import { T09, chooseFile, draftSet, evidence, gvPage, mcq, newCurriculum, newLesson, png, set, setBlock } from './helpers';

const RULE = 'Câu trắc nghiệm cần từ 2 đến 6 phương án';

test('[005:AC-4.1] TC-029 options A–F, text and/or image, mode', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await draftSet(page, les.id, 'Bộ 1', set([mcq('Câu?', [{ text: 'Một', correct: true }, { text: 'Hai' }])]));
  await page.goto(T09(cur.id, les.id));
  const q1 = setBlock(page, 1).getByRole('region', { name: 'Câu 1', exact: true });
  const opts = q1.getByRole('textbox', { name: /^Phương án [A-F]$/ });
  /** The reason is told to the GV: on screen or as the control's description. */
  const told = async (button: ReturnType<typeof q1.getByRole>) =>
    (await q1.getByText(RULE).count()) > 0 || (await button.getAttribute('title')) === RULE;

  // Default mode.
  await expect(q1.getByRole('radio', { name: 'Một đáp án đúng' })).toBeChecked();
  // 1. Up to 6 options A–F; no 7th.
  const add = q1.getByRole('button', { name: 'Thêm phương án' });
  for (let k = 0; k < 4; k++) await add.click();
  await expect(opts).toHaveCount(6);
  for (const [k, l] of [...'ABCDEF'].entries()) await expect(opts.nth(k)).toHaveAccessibleName(`Phương án ${l}`);
  await expect(add).toBeDisabled();
  await evidence(page, 'TC-029', 1);
  expect.soft(await told(add), `"${RULE}" when a 7th option is refused`).toBe(true);
  // 2. Delete down to 2; no further.
  for (let k = 0; k < 4; k++) await q1.getByRole('button', { name: /^Xóa phương án [A-F]$/ }).last().click();
  await expect(opts).toHaveCount(2);
  const delB = q1.getByRole('button', { name: 'Xóa phương án B' });
  await expect(delB).toBeDisabled();
  expect(await told(delB), `"${RULE}" when deleting at 2 options`).toBe(true);
  // 3. C with an image, D with text + image (text ≤ 200).
  await add.click();
  await add.click();
  await expect(opts.nth(0)).toHaveAttribute('maxlength', '200');
  await chooseFile(page, q1.getByRole('button', { name: 'Thêm ảnh phương án C của câu 1' }), { name: 'c.png', mimeType: 'image/png', buffer: png() });
  await opts.nth(3).fill('Bốn');
  await chooseFile(page, q1.getByRole('button', { name: 'Thêm ảnh phương án D của câu 1' }), { name: 'd.png', mimeType: 'image/png', buffer: png() });
  await expect(q1.getByRole('img', { name: 'Hình phương án C của câu 1' })).toBeVisible();
  await expect(q1.getByRole('img', { name: 'Hình phương án D của câu 1' })).toBeVisible();
  await expect(opts.nth(3)).toHaveValue('Bốn');
  // 4. "Nhiều đáp án đúng".
  await q1.getByRole('radio', { name: 'Nhiều đáp án đúng' }).click();
  await expect(q1.getByRole('checkbox', { name: 'Đáp án đúng A' })).toBeVisible();
  await evidence(page, 'TC-029', 2);
});

import { expect, test } from '@playwright/test';
import { T09, draftSet, evidence, gvPage, mcq, newCurriculum, newLesson, set, setBlock } from './helpers';

test('[005:AC-5.1] TC-033 the three vocabulary variants', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await draftSet(page, les.id, 'Bộ từ vựng', set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]));
  await page.goto(T09(cur.id, les.id));
  const block = setBlock(page, 1);

  // 1. Add Chọn nghĩa, Chọn chữ Hán, Chọn pinyin.
  for (const kind of ['Chọn nghĩa', 'Chọn chữ Hán', 'Chọn pinyin']) {
    await block.getByRole('button', { name: 'Thêm câu hỏi' }).click();
    await page.getByRole('menuitem', { name: `Trắc nghiệm từ vựng – ${kind}` }).click();
  }
  const cases: [number, string, string[], string[]][] = [
    [2, 'Chọn nghĩa đúng của từ', ['Từ (chữ Hán)', 'Pinyin của từ'], ['Nghĩa']],
    [3, 'Chọn chữ Hán đúng', ['Pinyin của từ', 'Nghĩa'], ['Từ (chữ Hán)']],
    [4, 'Chọn pinyin đúng', ['Từ (chữ Hán)', 'Nghĩa'], ['Pinyin của từ']],
  ];
  for (const [n, prompt, fields, absent] of cases) {
    const q = block.getByRole('region', { name: `Câu ${n}`, exact: true });
    const stem = q.getByLabel('Lời nhắc');
    await expect(stem).toHaveValue(prompt);
    for (const f of fields) await expect(q.getByRole('textbox', { name: f, exact: true })).toBeVisible();
    for (const f of absent) await expect(q.getByRole('textbox', { name: f, exact: true })).toHaveCount(0);
    // Mode fixed: one correct answer (radios, no mode switch).
    await expect(q.getByRole('radiogroup', { name: 'Chế độ đáp án' })).toHaveCount(0);
    await expect(q.getByRole('radio', { name: 'Nhiều đáp án đúng' })).toHaveCount(0);
    await expect(q.getByRole('radio', { name: 'Đáp án đúng A' })).toBeVisible();
    // Text-only options, 2–6.
    await expect(q.getByRole('textbox', { name: /^Phương án [A-F]$/ })).toHaveCount(2);
    await expect(q.getByRole('button', { name: /^Thêm ảnh phương án/ })).toHaveCount(0);
    for (let k = 0; k < 4; k++) await q.getByRole('button', { name: 'Thêm phương án' }).click();
    await expect(q.getByRole('textbox', { name: /^Phương án [A-F]$/ })).toHaveCount(6);
    await expect(q.getByRole('button', { name: 'Thêm phương án' })).toBeDisabled();
    // The prompt can be edited.
    await stem.fill(`${prompt} sau đây`);
    await expect(stem).toHaveValue(`${prompt} sau đây`);
  }
  await evidence(page, 'TC-033');
});

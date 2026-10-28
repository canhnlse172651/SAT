import { expect, test } from '@playwright/test';
import { T09, draftSet, evidence, gvPage, mcq, newCurriculum, newLesson, set, setBlock } from './helpers';

test('[005:AC-2.1] [005:AC-2.3] TC-016 nine question kinds, default points', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await draftSet(page, les.id, 'Bộ 1', set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]));
  await page.goto(T09(cur.id, les.id));
  const block = setBlock(page, 1);
  const total = block.getByText(/câu · Tổng điểm/);

  // 1. "Thêm câu hỏi": the list of kinds.
  await block.getByRole('button', { name: 'Thêm câu hỏi' }).click();
  await expect(page.getByRole('menu', { name: 'Dạng câu hỏi' }).getByRole('menuitem')).toHaveText([
    'Trắc nghiệm',
    'Trắc nghiệm từ vựng – Chọn nghĩa',
    'Trắc nghiệm từ vựng – Chọn chữ Hán',
    'Trắc nghiệm từ vựng – Chọn pinyin',
    'Điền chỗ trống',
    'Nối cặp',
    'Sắp xếp từ thành câu',
    'Viết chữ Hán theo pinyin',
    'Đọc hiểu',
  ]);
  await evidence(page, 'TC-016', 1);
  // 2. Add Nối cặp, then Điền chỗ trống.
  await page.getByRole('menuitem', { name: 'Nối cặp' }).click();
  await block.getByRole('button', { name: 'Thêm câu hỏi' }).click();
  await page.getByRole('menuitem', { name: 'Điền chỗ trống' }).click();
  await expect(block.getByText('Câu 2 · Nối cặp')).toBeVisible();
  await expect(block.getByText('Câu 3 · Điền chỗ trống')).toBeVisible();
  const q2 = block.getByRole('region', { name: 'Câu 2', exact: true });
  const pairPoints = q2.getByRole('textbox', { name: /^Điểm cặp \d+$/ });
  expect(await pairPoints.count()).toBeGreaterThan(0);
  for (const v of await pairPoints.all()) await expect(v).toHaveValue('1');
  await expect(block.getByRole('region', { name: 'Câu 1', exact: true }).getByRole('textbox', { name: 'Điểm', exact: true })).toHaveValue('1');
  // A cloze blank gets 1 point.
  const q3 = block.getByRole('region', { name: 'Câu 3', exact: true });
  await q3.getByLabel('Đoạn văn').fill('我是越南人');
  await q3.getByLabel('Đoạn văn').evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(1, 2));
  await q3.getByRole('button', { name: 'Đánh dấu chỗ trống' }).click();
  await expect(q3.getByRole('textbox', { name: 'Điểm chỗ trống 1' })).toHaveValue('1');
  const before = await total.textContent();
  // 3. Question 1 points → 2: the total follows at once.
  await block.getByRole('region', { name: 'Câu 1', exact: true }).getByRole('textbox', { name: 'Điểm', exact: true }).fill('2');
  const n = (s: string | null) => Number((s ?? '').match(/Tổng điểm\s*([\d,]+)/)?.[1]?.replace(',', '.'));
  await expect.poll(async () => n(await total.textContent())).toBe(n(before) + 1);
  await evidence(page, 'TC-016', 2);
});

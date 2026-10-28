import { expect, test } from '@playwright/test';
import { T09, draftSet, evidence, gvPage, mcq, newCurriculum, newLesson, set, setBlock } from './helpers';

const SHAPE = 'Câu đọc hiểu cần đoạn đọc và ít nhất 1 câu hỏi con';

test('[005:AC-11.1] [005:AC-11.2] TC-053 composing a reading question', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await draftSet(page, les.id, 'Bộ đọc', set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]));
  await page.goto(T09(cur.id, les.id));
  const block = setBlock(page, 1);
  await block.getByRole('button', { name: 'Thêm câu hỏi' }).click();
  await page.getByRole('menuitem', { name: 'Đọc hiểu' }).click();
  const q = block.getByRole('region', { name: 'Câu 2', exact: true });
  const subs = q.getByRole('group').filter({ has: page.getByText(/^Câu 2\.\d+ · /) });

  // 1. A new reading question lacks a passage.
  await expect(q).toContainText(SHAPE);
  // 2. Passage, pinyin, 2 sub-questions (MCQ 1 point, cloze 2 points).
  await q.getByLabel('Đoạn đọc', { exact: true }).fill('我叫小明。我是学生。');
  await q.getByLabel('Phiên âm pinyin của đoạn đọc (tùy chọn)').fill('Wǒ jiào Xiǎo Míng. Wǒ shì xuésheng.');
  while ((await q.getByText(/^Câu 2\.\d+ · /).count()) > 0) {
    const del = q.getByRole('button', { name: /^Xóa câu hỏi con 2\.\d+$/ }).last();
    if (await del.isDisabled()) break;
    await del.click();
  }
  if ((await q.getByText(/^Câu 2\.\d+ · Trắc nghiệm$/).count()) === 0)
    await q.getByRole('button', { name: 'Thêm câu hỏi con trắc nghiệm' }).click();
  await q.getByRole('button', { name: 'Thêm câu hỏi con điền chỗ trống' }).click();
  await expect(q.getByText(/^Câu 2\.\d+ · /)).toHaveCount(2);
  await expect(q.getByText('Câu 2.1 · Trắc nghiệm')).toBeVisible();
  await expect(q.getByText('Câu 2.2 · Điền chỗ trống')).toBeVisible();
  // The cloze sub-question gets a blank worth 2.
  const cl = q.getByLabel('Đoạn văn', { exact: true });
  await cl.fill('小明是学生');
  await cl.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(3, 5));
  await q.getByRole('button', { name: 'Đánh dấu chỗ trống' }).click();
  await q.getByRole('textbox', { name: 'Điểm chỗ trống 1' }).fill('2');
  await expect(q.getByText('3 điểm', { exact: true })).toBeVisible();
  await expect(q.getByText(SHAPE)).toHaveCount(0);
  await evidence(page, 'TC-053', 1);
  // At most 10 sub-questions.
  const addMcq = q.getByRole('button', { name: 'Thêm câu hỏi con trắc nghiệm' });
  while ((await q.getByText(/^Câu 2\.\d+ · /).count()) < 10) await addMcq.click();
  await expect(addMcq).toBeDisabled();
  await expect(q.getByRole('button', { name: 'Thêm câu hỏi con điền chỗ trống' })).toBeDisabled();
  void subs;
  // 3. Remove the passage: the error is back.
  await q.getByLabel('Đoạn đọc', { exact: true }).fill('');
  await expect(q).toContainText(SHAPE);
  await evidence(page, 'TC-053', 2);
});

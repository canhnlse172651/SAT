import { expect, test } from '@playwright/test';
import { T09, draftSet, evidence, gvPage, mcq, newCurriculum, newLesson, set, setBlock } from './helpers';

test('[005:AC-10.1] [005:AC-10.3] TC-050 composing a write question', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await draftSet(page, les.id, 'Bộ viết', set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]));
  await page.goto(T09(cur.id, les.id));
  const block = setBlock(page, 1);
  await block.getByRole('button', { name: 'Thêm câu hỏi' }).click();
  await page.getByRole('menuitem', { name: 'Viết chữ Hán theo pinyin' }).click();
  const q = block.getByRole('region', { name: 'Câu 2', exact: true });

  // 1. Pinyin đề, Nghĩa gợi ý, 5 answers (no 6th).
  await expect(q.getByRole('textbox', { name: 'Pinyin đề' })).toHaveAttribute('maxlength', '100');
  await expect(q.getByRole('textbox', { name: 'Nghĩa gợi ý (tùy chọn)' })).toHaveAttribute('maxlength', '200');
  await q.getByRole('textbox', { name: 'Pinyin đề' }).fill('nǐ hǎo');
  await q.getByRole('textbox', { name: 'Nghĩa gợi ý (tùy chọn)' }).fill('xin chào');
  const answers = q.getByRole('textbox', { name: /^Đáp án \d+$/ });
  const add = q.getByRole('button', { name: 'Thêm đáp án' });
  while ((await answers.count()) < 5) await add.click();
  await expect(answers).toHaveCount(5);
  await expect(add).toBeDisabled();
  await expect(answers.first()).toHaveAttribute('maxlength', '30');
  // 2. Answer 2 = "ni好".
  await answers.nth(0).fill('你好');
  await answers.nth(1).fill('ni好');
  await block.getByLabel('Tiêu đề', { exact: true }).focus();
  await expect(q).toContainText('Đáp án 2 chỉ được chứa chữ Hán');
  await evidence(page, 'TC-050');
});

/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { T09, aiApprove, evidence, getLesson, gvPage, mcq, newCurriculum, newLesson, set, setBlock } from './helpers';

test('[005:AC-13.6] [005:AC-13.7] TC-065 an AI set is edited like any other and keeps its label', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const q = (p: string) => mcq(p, [{ text: 'A', correct: true }, { text: 'B' }]);
  expect((await aiApprove(page, les.id, [{ title: 'Bộ AI', content: set([q('AI 1'), q('AI 2')]) }])).status).toBe(200);
  await page.goto(T09(cur.id, les.id));
  const block = setBlock(page, 1);
  await expect(block.getByText('AI tạo').first()).toBeVisible();

  // 1. Edit a question, "Lưu thay đổi".
  await block.getByRole('region', { name: 'Câu 1', exact: true }).getByLabel('Đề bài').fill('AI 1 đã sửa');
  await block.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(block.getByText(/^Đã lưu lúc/)).toBeVisible();
  // 2. "Nhân bản", publish the copy.
  await block.getByRole('button', { name: 'Nhân bản' }).click();
  await expect(page.getByText('Đã nhân bản bộ bài tập — bản sao ở trạng thái Nháp.')).toBeVisible();
  const copy = setBlock(page, 2);
  await expect(copy.getByLabel('Tiêu đề', { exact: true })).toHaveValue('Bộ AI (bản sao)');
  await copy.getByRole('button', { name: 'Xuất bản', exact: true }).click();
  await expect(copy.getByText('Đã xuất bản', { exact: true })).toBeVisible();
  // "AI tạo" on the set, its questions and the copy.
  for (const b of [block, copy]) {
    await expect(b.locator('.cur-item__bar').getByText('AI tạo')).toBeVisible();
    await expect(b.getByRole('region', { name: 'Câu 1', exact: true }).getByText('AI tạo')).toBeVisible();
    await expect(b.getByRole('region', { name: 'Câu 2', exact: true }).getByText('AI tạo')).toBeVisible();
  }
  const sets = (await getLesson(page, les.id)).items.filter((i: any) => i.section === 'exercise');
  expect(sets.map((s: any) => [s.ai, s.status, s.content.questions.map((x: any) => x.ai)])).toEqual([
    [true, 'published', [true, true]],
    [true, 'published', [true, true]],
  ]);
  expect(sets[0].content.questions[0].prompt).toBe('AI 1 đã sửa');
  // 3. No AI regeneration for a set or a question.
  await expect(page.getByRole('button', { name: /AI|tạo lại|Tạo lại/ })).toHaveCount(0);
  await evidence(page, 'TC-065');
});

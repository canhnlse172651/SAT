import { expect, test } from '@playwright/test';
import { T09, draftSet, evidence, gvPage, itemOf, mcq, newCurriculum, newLesson, saveItem, set, setBlock } from './helpers';

test('[005:AC-12.5] [005:AC-12.6] TC-057 a set that is not ready stays a draft', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const ok = (p: string) => mcq(p, [{ text: 'A', correct: true }, { text: 'B' }]);
  const filler = Array.from({ length: 4 }, (_, k) => ok(`Câu thêm ${k}`));
  const x = await draftSet(
    page,
    les.id,
    'Bộ chưa xong',
    set([ok('Một'), mcq('Hai', [{ text: 'A' }, { text: 'B' }]), ok('Ba'), ok(''), ...filler]),
  );
  await page.goto(T09(cur.id, les.id));
  const block = setBlock(page, 1);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  // 1. "Xuất bản" on the block.
  await block.getByRole('button', { name: 'Xuất bản', exact: true }).click();
  const list = block.getByRole('alert').filter({ hasText: 'Chưa thể xuất bản:' });
  await expect(list).toBeVisible();
  await expect(list.getByRole('listitem')).toHaveText([
    'Câu 2: Hãy chọn đúng 1 đáp án đúng',
    'Câu 4: Câu hỏi cần có đề bài (chữ hoặc hình ảnh)',
  ]);
  await expect(block.getByRole('region', { name: 'Câu 2', exact: true }).getByText('Chưa hoàn chỉnh', { exact: true })).toBeVisible();
  await expect(block.getByRole('region', { name: 'Câu 4', exact: true }).getByText('Chưa hoàn chỉnh', { exact: true })).toBeVisible();
  await expect(block.getByRole('region', { name: 'Câu 2', exact: true })).toBeInViewport();
  expect((await itemOf(page, les.id, x)).status).toBe('draft');
  await expect(block.getByText('Nháp', { exact: true })).toBeVisible();
  await evidence(page, 'TC-057', 1);

  // 2. No question left (through the API), publish through "Xuất bản…" of the Bài.
  expect((await saveItem(page, les.id, x, 'Bộ chưa xong', set([]))).status).toBe(200);
  await page.reload();
  await page.getByRole('button', { name: /^Xuất bản bài…|^Xuất bản… \(/ }).click();
  const dialog = page.getByRole('dialog').or(page.getByRole('alertdialog'));
  await expect(dialog.getByText('Bộ bài tập cần ít nhất 1 câu hỏi để xuất bản')).toBeVisible();
  await evidence(page, 'TC-057', 2);
});

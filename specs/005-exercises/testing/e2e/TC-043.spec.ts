import { expect, test } from '@playwright/test';
import { T09, draftSet, evidence, gvPage, match, newCurriculum, newLesson, set, setBlock } from './helpers';

test('[005:AC-8.3] TC-043 "Hoán đổi" moves Cột B items, points stay', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const m = match('Nối', [['你好', 'xin chào'], ['谢谢', 'cảm ơn'], ['再见', 'tạm biệt']], ['giáo viên']);
  m.pairs[1]!.points = 2;
  await draftSet(page, les.id, 'Bộ nối', set([m]));
  await page.goto(T09(cur.id, les.id));
  const q = setBlock(page, 1).getByRole('region', { name: 'Câu 1', exact: true });
  const b = (k: number) => q.getByRole('textbox', { name: `Cặp ${k} · Cột B` });
  const pts = async () => Promise.all([1, 2, 3].map((k) => q.getByRole('textbox', { name: `Điểm cặp ${k}` }).inputValue()));

  // 1. Swap Cột B of pair 1 with pair 2.
  await q.getByRole('button', { name: 'Hoán đổi mục Cột B của cặp 1' }).click();
  await expect(b(1)).toHaveValue('cảm ơn');
  await expect(b(2)).toHaveValue('xin chào');
  expect(await pts()).toEqual(['1', '2', '1']);
  // 2. Swap Cột B of pair 3 with the distractor.
  await q.getByRole('button', { name: 'Hoán đổi mục Cột B của cặp 3' }).click();
  await expect(b(3)).toHaveValue('giáo viên');
  await expect(q.getByRole('textbox', { name: 'Mục nhiễu 1' })).toHaveValue('tạm biệt');
  expect(await pts()).toEqual(['1', '2', '1']);
  await expect(q.getByRole('textbox', { name: 'Cặp 1 · Cột A' })).toHaveValue('你好');
  await evidence(page, 'TC-043');
});

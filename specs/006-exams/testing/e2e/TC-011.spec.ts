import { expect, test } from '@playwright/test';
import { T22, draftExam, evidence, gvPage } from './helpers';

const KINDS = [
  'Trắc nghiệm',
  'Trắc nghiệm từ vựng – Chọn nghĩa',
  'Trắc nghiệm từ vựng – Chọn chữ Hán',
  'Trắc nghiệm từ vựng – Chọn pinyin',
  'Điền chỗ trống',
  'Nối cặp',
  'Sắp xếp từ thành câu',
  'Viết chữ Hán theo pinyin',
  'Đọc hiểu',
];

test('[006:AC-2.4] TC-011 only the 9 auto-graded kinds of 005; questions numbered from 1', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const d = await draftExam(page, { content: { instructions: '', stepId: null, questions: [] } });
  await page.goto(T22(d.id));
  await page.getByRole('button', { name: 'Thêm câu hỏi' }).click();
  const menu = page.getByRole('menu', { name: 'Dạng câu hỏi' });
  expect((await menu.getByRole('menuitem').allInnerTexts()).map((s) => s.trim())).toEqual(KINDS);
  await menu.getByRole('menuitem', { name: 'Trắc nghiệm', exact: true }).click();
  for (const k of ['Nối cặp', 'Viết chữ Hán theo pinyin']) {
    await page.getByRole('button', { name: 'Thêm câu hỏi' }).click();
    await page.getByRole('menuitem', { name: k, exact: true }).click();
  }
  await expect(page.getByRole('region', { name: 'Câu 3' })).toContainText('Viết chữ Hán theo pinyin');
  await page.getByRole('region', { name: 'Câu 3' }).getByRole('button', { name: 'Lên trên', exact: true }).click();
  await page.getByRole('region', { name: 'Câu 2' }).getByRole('button', { name: 'Lên trên', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Câu 1' })).toContainText('Viết chữ Hán theo pinyin');
  await page.getByRole('region', { name: 'Câu 2' }).getByRole('button', { name: 'Xóa câu' }).click();
  await expect(page.getByRole('region', { name: 'Câu 1' })).toContainText('Viết chữ Hán theo pinyin');
  await expect(page.getByRole('region', { name: 'Câu 2' })).toContainText('Nối cặp');
  await expect(page.getByRole('region', { name: 'Câu 3' })).toHaveCount(0);
  await evidence(page, 'TC-011');
});

/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { T09, evidence, getLesson, gvPage, mcq, newCurriculum, newLesson, publishedSet, set, setBlock } from './helpers';

test('[005:AC-12.11] TC-060 no duplicate or archive while a set has unsaved edits', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await publishedSet(page, les.id, 'Bộ xuất bản', set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]));
  await page.goto(T09(cur.id, les.id));
  const block = setBlock(page, 1);
  await block.getByLabel('Tiêu đề', { exact: true }).fill('Bộ xuất bản sửa');

  const dup = block.getByRole('button', { name: 'Nhân bản' });
  const arch = block.getByRole('button', { name: 'Lưu trữ' });
  await expect(dup).toHaveAttribute('aria-disabled', 'true');
  await expect(arch).toHaveAttribute('aria-disabled', 'true');
  await expect(dup).toHaveAccessibleDescription('Hãy lưu hoặc bỏ thay đổi trước khi nhân bản');
  await expect(arch).toHaveAccessibleDescription('Hãy lưu hoặc bỏ thay đổi trước khi lưu trữ');
  await expect(block.getByText('Hãy lưu hoặc bỏ thay đổi trước khi nhân bản')).toBeVisible();
  await expect(block.getByText('Hãy lưu hoặc bỏ thay đổi trước khi lưu trữ')).toBeVisible();
  await dup.click({ force: true });
  await arch.click({ force: true });
  await evidence(page, 'TC-060');
  const l = await getLesson(page, les.id);
  const sets = l.items.filter((i: any) => i.section === 'exercise');
  expect(sets.map((i: any) => i.status)).toEqual(['published']);
});

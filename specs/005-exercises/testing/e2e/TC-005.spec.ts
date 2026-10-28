/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { T09, addItem, deleteItem, draftSet, evidence, getLesson, gvPage, itemOf, mcq, newCurriculum, newLesson, saveItem, set, setBlock } from './helpers';

test('[005:AC-1.4] TC-005 deleting the linked step unlinks the set', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const s = await addItem(page, les.id, 'lesson');
  await saveItem(page, les.id, s, 'Bước S', { goal: '', blocks: [] });
  const x = await draftSet(page, les.id, 'Bộ X', set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])], '', s));
  expect((await itemOf(page, les.id, x)).content.stepId).toBe(s);

  // 1. Delete step S.
  const del = await deleteItem(page, les.id, s);
  expect(del.status, JSON.stringify(del.body)).toBeLessThan(300);
  expect((await getLesson(page, les.id)).items.some((i: any) => i.id === s)).toBe(false);
  // On T09 the field shows "Không liên kết".
  await page.goto(T09(cur.id, les.id));
  const pick = setBlock(page, 1).getByLabel('Bước học liên kết');
  await expect(pick.locator('option:checked')).toHaveText('Không liên kết');
  await evidence(page, 'TC-005');
  // 2. Read the Bài: X is unlinked.
  expect((await itemOf(page, les.id, x)).content.stepId, 'content.stepId of X after its step was deleted').toBeNull();
});

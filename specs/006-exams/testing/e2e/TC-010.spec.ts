import { expect, test } from '@playwright/test';
import { draftExam, getExam, gvPage, saveExam } from './helpers';

test('[006:AC-2.3] TC-010 API refuses instructions over 2000 characters and a duration of 301', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const d = await draftExam(page);
  const before = await getExam(page, d.id);
  const r1 = await saveExam(page, d.id, { content: { ...before.content, instructions: 'x'.repeat(2001) } });
  expect(r1.status).toBe(422);
  const r2 = await saveExam(page, d.id, { durationMin: 301 });
  expect(r2.status).toBe(422);
  expect(r2.body.error.message).toBe('Thời lượng phải là số nguyên từ 1 đến 300 phút');
  const after = await getExam(page, d.id);
  expect(after.version).toBe(before.version);
  expect(after.content.instructions).toBe(before.content.instructions);
  expect(after.durationMin).toBe(before.durationMin);
});

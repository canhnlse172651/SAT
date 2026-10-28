/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { api, draftExam, gvPage } from './helpers';

test('[006:AC-6.6] TC-046 the copy of a 150-character name stays within 150 characters', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const d = await draftExam(page, { name: 'Đ'.repeat(150) });
  const copy = await api<any>(page, 'POST', `/api/exams/${d.id}/duplicate`, undefined, 201);
  expect([...copy.name].length).toBe(150);
  expect(copy.name.endsWith(' (bản sao)')).toBe(true);
  expect(copy.state).toBe('draft');
});

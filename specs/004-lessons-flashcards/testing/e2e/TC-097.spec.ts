import { expect, test } from '@playwright/test';
import { ORIGIN, aiApprove, getLesson, gvPage, newCurriculum, newLesson, publishedStep, text } from './helpers';

test('[004:AC-19.6] TC-097 AI content enters only by approving the whole section', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const kept = await publishedStep(page, les.id, 'Bước GV', [text('<p>GV</p>')]);
  // No route edits one existing step with AI content.
  for (const path of [`/api/lessons/${les.id}/items/${kept}/ai`, `/api/dev/curriculum/ai-approve/${kept}`]) {
    const res = await page.request.post(path, { headers: { Origin: ORIGIN }, data: {} });
    expect(res.status(), path).toBe(404);
  }
  // The only entry: approving the section replaces every step.
  await aiApprove(page, les.id, [{ title: 'AI', content: { goal: '', blocks: [text('<p>AI</p>')] } }]);
  const steps = (await getLesson(page, les.id)).items.filter((i: { section: string }) => i.section === 'lesson');
  expect(steps.map((i: { title: string; ai: boolean }) => [i.title, i.ai])).toEqual([['AI', true]]);
  expect(steps.some((i: { id: string }) => i.id === kept)).toBe(false);
});

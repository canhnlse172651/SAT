import { expect, test } from '@playwright/test';
import { addStep, api, getLesson, gvPage, newCurriculum, newLesson, publishedStep, text } from './helpers';

test('[004:AC-19.4] [004:NFR-4] TC-095 cancelled, stale or refused approvals leave the section untouched', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  for (const n of [1, 2, 3]) await publishedStep(page, les.id, `Cũ ${n}`, [text('<p>旧</p>')]);
  const steps = async () =>
    (await getLesson(page, les.id)).items
      .filter((i: { section: string }) => i.section === 'lesson')
      .map((i: { id: string; ai: boolean }) => `${i.id}:${i.ai}`)
      .join();
  const body = {
    lessonId: les.id,
    section: 'lesson',
    items: [{ title: 'Mới', content: { goal: '', blocks: [text('<p>新</p>')] } }],
  };

  // 1. Preview only (the GV cancels the confirmation).
  const original = await steps();
  const preview = await api(page, 'POST', '/api/dev/curriculum/ai-approve/preview', body);
  expect(await steps()).toBe(original);

  // 2. The section changed after the preview: the stale confirmation is refused.
  await addStep(page, les.id);
  const four = await steps();
  const stale = await api(page, 'POST', '/api/dev/curriculum/ai-approve', { ...body, token: preview.token }, 409);
  expect(stale.error.code).toBe('SECTION_CHANGED');
  expect(await steps()).toBe(four);

  // 3. An approval with an unready step is refused as a whole.
  const fresh = await api(page, 'POST', '/api/dev/curriculum/ai-approve/preview', body);
  await api(
    page,
    'POST',
    '/api/dev/curriculum/ai-approve',
    { ...body, items: [...body.items, { title: '', content: { goal: '', blocks: [] } }], token: fresh.token },
    422,
  );
  expect(await steps()).toBe(four);
  expect(four.includes(':true')).toBe(false);
});

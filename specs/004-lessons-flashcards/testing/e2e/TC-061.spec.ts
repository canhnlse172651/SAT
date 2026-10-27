import { expect, test } from '@playwright/test';
import { addStep, aiApprove, api, getLesson, gvPage, newCurriculum, newLesson, text } from './helpers';

const step = (title: string) => ({ title, content: { goal: '', blocks: [text('<p>AI</p>')] } });

test('[004:AC-9.3] TC-061 an approval over 30 steps or with an unready step stores nothing', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  for (let i = 0; i < 28; i++) await addStep(page, les.id);
  const ids = async () => (await getLesson(page, les.id)).items.map((i: { id: string }) => i.id).join();
  const before = await ids();

  const tooMany = await api(
    page,
    'POST',
    '/api/dev/curriculum/ai-approve/preview',
    { lessonId: les.id, section: 'lesson', items: Array.from({ length: 31 }, (_, i) => step(`AI ${i}`)) },
    422,
  );
  expect(tooMany.error.message).toContain('Mỗi bài có tối đa 30 bước học.');
  expect(await ids()).toBe(before);

  const unready = await api(
    page,
    'POST',
    '/api/dev/curriculum/ai-approve/preview',
    {
      lessonId: les.id,
      section: 'lesson',
      items: [step('AI 1'), { title: 'AI 2', content: { goal: '', blocks: [{ id: 'd', type: 'dialogue', lines: [] }] } }],
    },
    422,
  );
  expect(unready.error.details.issues).toEqual(['Bước 2 · Khối 1 · Hội thoại / Bài khóa: chưa có dòng nào']);
  expect(await ids()).toBe(before);

  await aiApprove(page, les.id, [step('A'), step('B'), step('C'), step('D')]);
  const after = await getLesson(page, les.id);
  expect(after.items.filter((i: { section: string }) => i.section === 'lesson').map((i: { title: string }) => i.title)).toEqual([
    'A',
    'B',
    'C',
    'D',
  ]);
});

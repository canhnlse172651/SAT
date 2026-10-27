import { expect, test } from '@playwright/test';
import { addStep, api, getLesson, gvPage, newCurriculum, newLesson } from './helpers';

test('[004:AC-7.1] TC-050 the API refuses to publish a deck without cards or a grammar point without examples', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const cases: [unknown, string][] = [
    [{ id: 'k', type: 'deck', name: 'Bộ', cards: [] }, 'Bộ thẻ từ vựng: chưa có thẻ nào'],
    [{ id: 'g', type: 'grammar', name: 'Mẫu', examples: [] }, 'Ngữ pháp / mẫu câu: chưa có ví dụ'],
  ];
  for (const [block, issue] of cases) {
    const id = await addStep(page, les.id);
    const res = await api(
      page,
      'POST',
      `/api/lessons/${les.id}/items/${id}/publish`,
      { expectedVersion: 1, title: 'Bước', content: { goal: '', blocks: [block] } },
      422,
    );
    expect(res.error.code).toBe('NOT_READY');
    expect(res.error.details.issues).toEqual([{ block: 1, text: issue }]);
    const item = (await getLesson(page, les.id)).items.find((i: { id: string }) => i.id === id);
    expect(item.status).toBe('draft');
  }
});

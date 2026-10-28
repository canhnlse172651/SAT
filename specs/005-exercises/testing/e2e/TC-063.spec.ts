import { expect, test } from '@playwright/test';
import { aiPreview, getLesson, gvPage, mcq, newCurriculum, newLesson, set } from './helpers';

test('[005:AC-13.4] TC-063 unsupported or oversized AI questions are refused with reasons', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const cur = await newCurriculum(gv);
  const les = await newLesson(gv, cur.id);
  const speak = { ...mcq('Nói', [{ text: 'A', correct: true }, { text: 'B' }]), type: 'speak' };
  const seven = mcq('Bảy phương án', Array.from({ length: 7 }, (_, k) => ({ text: `PA ${k + 1}`, correct: k === 0 })));
  // 1. Preview a set with a "speak" question and a 7-option question.
  const r = await aiPreview(gv, les.id, [{ title: 'AI', content: set([speak, seven]) }]);
  expect(r.status).toBe(422);
  expect(r.body.error.details.rejected).toEqual([
    { set: 1, question: 1, reason: 'Dạng câu hỏi không được hỗ trợ' },
    { set: 1, question: 2, reason: 'Vượt giới hạn số lượng hoặc độ dài của dạng câu' },
  ]);
  expect(r.body.error.message).toMatch(/Dạng câu hỏi không được hỗ trợ/);
  expect((await getLesson(gv, les.id)).items).toHaveLength(0);
});

/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import {
  T09, aiApprove, doSet, draftSet, evidence, getLesson, gvPage, hvPage, mcq, newClass, newCurriculum, newLesson, png,
  publishLesson, publishedStep, set, setBlock, setContent, setDeadline, studentIds, upload, vnToday,
} from './helpers';

test('[005:AC-18.5] TC-092 "Nhân bản" copies everything except the submissions', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const cur = await newCurriculum(gv);
  const les = await newLesson(gv, cur.id);
  const step = await publishedStep(gv, les.id, 'Bước liên kết');
  const img = (await upload(gv, 'anh.png', png())).body;
  const x = mcq('Có ảnh', [{ text: 'Đúng', correct: true }, { text: 'Sai' }], { image: img, explanation: 'Vì đúng.', points: 2 });
  expect((await aiApprove(gv, les.id, [{ title: 'Bộ AI X', content: set([x], 'Hướng dẫn X', step) }])).status).toBe(200);
  const long = 'T'.repeat(148);
  await draftSet(gv, les.id, long, set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]));
  await publishLesson(gv, les.id);
  const xId = (await getLesson(gv, les.id)).items.find((i: any) => i.title === 'Bộ AI X').id;
  const [hvId] = await studentIds(gv);
  const cls = await newClass(gv, cur.id, [hvId!]);
  await setDeadline(gv, cls.id, xId, vnToday(5));
  const xq = (await setContent(gv, les.id, xId)).questions[0];
  const { page: hv } = await hvPage(browser, hvId!);
  await doSet(hv, cls.id, xId, { [xq.id]: { optionIds: [xq.options[0].id] } });

  // 1. "Nhân bản" on X.
  await gv.goto(T09(cur.id, les.id));
  await setBlock(gv, 1).getByRole('button', { name: 'Nhân bản' }).click();
  await expect(gv.getByText('Đã nhân bản bộ bài tập — bản sao ở trạng thái Nháp.')).toBeVisible();
  const copy = setBlock(gv, 2);
  await expect(copy.getByLabel('Tiêu đề', { exact: true })).toHaveValue('Bộ AI X (bản sao)');
  await expect(copy.getByText('Nháp', { exact: true })).toBeVisible();
  await expect(copy.locator('.cur-item__bar').getByText('AI tạo')).toBeVisible();
  await expect(copy.getByRole('note')).toHaveCount(0);
  await expect(copy.getByRole('img', { name: 'Hình đề câu 1' })).toBeVisible();
  await evidence(gv, 'TC-092');
  const items = (await getLesson(gv, les.id)).items.filter((i: any) => i.section === 'exercise');
  const c = items[1];
  const src = items[0];
  expect([c.status, c.ai, c.title]).toEqual(['draft', true, 'Bộ AI X (bản sao)']);
  expect(c.content.instructions).toBe('Hướng dẫn X');
  expect(c.content.stepId).toBe(step);
  const [cq] = c.content.questions;
  expect([cq.prompt, cq.explanation, cq.points, cq.ai, cq.image?.id ?? cq.image?.fileId]).toEqual([
    'Có ảnh',
    'Vì đúng.',
    2,
    true,
    src.content.questions[0].image?.id ?? src.content.questions[0].image?.fileId,
  ]);
  expect(cq.options.map((o: any) => [o.text, o.correct])).toEqual([['Đúng', true], ['Sai', false]]);
  const counts = (await (await gv.request.get(`/api/exercises/lessons/${les.id}/sets`)).json()).sets;
  expect(counts.find((s: any) => s.id === c.id)?.submissions ?? 0).toBe(0);
  // 2. The 148-character title: cut so the whole stays ≤ 150.
  await setBlock(gv, 3).getByRole('button', { name: 'Nhân bản' }).click();
  await expect(setBlock(gv, 4)).toBeVisible();
  const t = await setBlock(gv, 4).getByLabel('Tiêu đề', { exact: true }).inputValue();
  expect(t.endsWith(' (bản sao)')).toBe(true);
  expect([...t].length).toBeLessThanOrEqual(150);
  expect(t.startsWith('T'.repeat(140))).toBe(true);
});

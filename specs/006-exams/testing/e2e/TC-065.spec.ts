import { expect, test } from '@playwright/test';
import { answerE3, evidence, freshStudents, gvPage, hvPage, newClass, scheduledExam, startOnScreen, uid } from './helpers';

test('[006:AC-9.2] TC-065 one question at a time, the board shows done / partial / unanswered, no key', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-065 ${uid()}`;
  await scheduledExam(page, { name, classIds: [A.id] });
  const hv = await hvPage(browser, h!);
  const p = hv.page;
  await startOnScreen(p, name);
  await expect(p.getByText('Câu 1/3')).toBeVisible();
  await answerE3(p, { q1: 'Xin chào', q2: 'half' });
  await p.getByRole('button', { name: 'Câu trước' }).click();
  await expect(p.getByText('Câu 1/3')).toBeVisible();
  await p.getByRole('button', { name: 'Câu sau' }).click();
  await expect(p.getByText('Câu 2/3')).toBeVisible();
  await p.getByRole('navigation', { name: 'Bảng số câu' }).getByRole('button', { name: /^Câu 3 · / }).click();
  await expect(p.getByText('Câu 3/3')).toBeVisible();
  const board = p.getByRole('navigation', { name: 'Bảng số câu' });
  await expect(board.getByRole('button', { name: 'Câu 1 · đã hoàn thành' })).toBeVisible();
  await expect(board.getByRole('button', { name: 'Câu 2 · trả lời một phần' })).toBeVisible();
  await expect(board.getByRole('button', { name: 'Câu 3 · chưa trả lời' })).toBeVisible();
  for (const n of [1, 2, 3]) {
    await board.getByRole('button', { name: new RegExp(`^Câu ${n} · `) }).click();
    await expect(p.getByText(/Đáp án đúng|Giải thích|你好 = xin chào|Đúng một phần|^Sai$/)).toHaveCount(0);
  }
  await evidence(p, 'TC-065');
});

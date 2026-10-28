import { expect, test } from '@playwright/test';
import {
  S03, S05, S11, ddmm, evidence, gvPage, hvPage, mcq, newClass, newCurriculum, newLesson, publishLesson, publishedSet,
  publishedStep, set, setDeadline, studentIds, vnToday,
} from './helpers';

test('[005:AC-14.1] TC-068 the start screen of S05', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const cur = await newCurriculum(gv);
  const les = await newLesson(gv, cur.id, 'Bài Chào hỏi');
  const step = await publishedStep(gv, les.id, 'Chào hỏi');
  const q = (p: string) => mcq(p, [{ text: 'A', correct: true }, { text: 'B' }]);
  const x = await publishedSet(gv, les.id, 'Luyện chào hỏi', set([q('Một'), q('Hai'), { ...q('Ba'), points: 2 }], 'Đọc kỹ đề.', step));
  await publishLesson(gv, les.id);
  const [hvId] = await studentIds(gv);
  const cls = await newClass(gv, cur.id, [hvId!]);
  const due = vnToday(6);
  await setDeadline(gv, cls.id, x, due);
  const { page } = await hvPage(browser, hvId!);

  // 1. From S11.
  await page.goto(`${S11(cls.id, les.id)}?tab=bai-tap`);
  await page.getByRole('link', { name: /Luyện chào hỏi/ }).click();
  await expect(page).toHaveURL(new RegExp(`${S05(cls.id, x)}$`));
  const main = page.locator('[data-screen="S05"]');
  await expect(main.getByText('Bài Chào hỏi')).toBeVisible();
  await expect(main.getByRole('heading', { name: 'Luyện chào hỏi' })).toBeVisible();
  await expect(main.getByText('Đọc kỹ đề.')).toBeVisible();
  await expect(main.getByRole('term').filter({ hasText: 'Số câu hỏi' })).toBeVisible();
  await expect(main.getByRole('definition').nth(0)).toHaveText('3');
  await expect(main.getByRole('term').filter({ hasText: 'Tổng điểm' })).toBeVisible();
  await expect(main.getByRole('definition').nth(1)).toHaveText(/^4(,0)?$/);
  await expect(main.getByText('Chưa làm', { exact: true })).toBeVisible();
  await expect(main.getByText(`Hạn nộp ${ddmm(due)}`)).toBeVisible();
  await expect(main.getByRole('button', { name: 'Bắt đầu làm' })).toBeVisible();
  await evidence(page, 'TC-068', 1);
  // 2. From "Luyện tập: X" on S03.
  await page.goto(S03(cls.id, step));
  await page.getByRole('link', { name: 'Luyện tập: Luyện chào hỏi' }).click();
  await expect(page).toHaveURL(new RegExp(`${S05(cls.id, x)}$`));
  // 3. Start, answer one question, back to S05.
  await page.getByRole('button', { name: 'Bắt đầu làm' }).click();
  await page.getByRole('radio', { name: /^A\s/ }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Đã lưu' })).toBeVisible();
  await page.goto(S05(cls.id, x));
  await expect(main.getByText('Đang làm', { exact: true })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Tiếp tục làm' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Làm lại' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Làm lại' })).toHaveCount(0);
  await evidence(page, 'TC-068', 2);
});

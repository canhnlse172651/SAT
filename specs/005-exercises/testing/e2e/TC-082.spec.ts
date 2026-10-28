import { expect, test } from '@playwright/test';
import { S05, S06, S11, b6, b6Answers, classWithSets, evidence, gvPage, hvPage, setContent, submit, start } from './helpers';

test('[005:AC-16.2] [005:AC-16.3] [005:AC-16.4] TC-082 S06: score, results, keys and explanations', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [{ title: 'Bộ B6', content: b6() }]);
  const setId = d.sets[0]!;
  const content = await setContent(gv, d.les, setId);
  // 7 / 12: Q1 (1) + Q3 (2) + Q4 (4) right, Q2 Q5 Q7 wrong, Q6 unanswered.
  const answers = b6Answers(content, { correct: [true, false, true, true, false, false, false] });
  delete answers[content.questions[5].id];
  const { page } = await hvPage(browser, d.students[0]!);
  await start(page, d.cls, setId);
  expect((await submit(page, d.cls, setId, answers)).status).toBeLessThan(300);

  // 1. S06 after submitting.
  await page.goto(S06(d.cls, setId));
  await expect(page.getByRole('heading', { name: 'Bộ B6' })).toBeVisible();
  await expect(page.getByText(/^nộp lúc \d\d\/\d\d\/\d{4} \d\d:\d\d$/)).toBeVisible();
  await expect(page.getByText('Bài đã nộp — mỗi bộ bài tập chỉ làm một lần')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Từng câu · đáp án và giải thích' })).toBeVisible();
  const rows = page.locator('[data-screen="S06"] > ol.ex-review__rows > li.ex-review__row');
  await expect(rows).toHaveCount(7);
  const heads = ['Câu 1 · Trắc nghiệm', 'Câu 2 · Chọn nghĩa', 'Câu 3 · Điền chỗ trống', 'Câu 4 · Nối cặp', 'Câu 5 · Sắp xếp câu', 'Câu 6 · Viết chữ Hán', 'Câu 7 · Đọc hiểu'];
  const verdicts = ['Đúng', 'Sai', 'Đúng', 'Đúng', 'Sai', 'Chưa trả lời', 'Sai'];
  for (const [k, h] of heads.entries()) {
    await expect(rows.nth(k).locator('.ex-review__head').first()).toContainText(h);
    await expect(rows.nth(k).locator('.ex-review__head .chip').first()).toHaveText(verdicts[k]!);
  }
  await expect(rows.nth(5)).toContainText('Bạn trả lời: —');
  await expect(rows.nth(0)).toContainText('Đáp án đúng: B. Xin chào');
  await expect(rows.nth(2)).toContainText('Đáp án đúng: (1) 是; (2) 人');
  await expect(rows.nth(3)).toContainText('Đáp án đúng: 你好 → xin chào; 谢谢 → cảm ơn; 再见 → tạm biệt; 老师 → giáo viên');
  await expect(rows.nth(4)).toContainText('Đáp án đúng: 我是越南人');
  await expect(rows.nth(5)).toContainText('Đáp án đúng: 你好');
  await expect(page.getByText(/^Giải thích:/)).toHaveCount(5);
  await expect(rows.nth(3).getByText(/^Giải thích:/)).toHaveCount(0);
  await evidence(page, 'TC-082', 1);
  // The score as "<đạt> / <tổng> điểm (<%>%)".
  await expect.soft(page.getByText('7 / 12 điểm (58%)', { exact: true })).toBeVisible();
  // "Về trang bài" opens S11 on the Bài tập tab.
  await page.getByRole('link', { name: 'Về trang bài' }).click();
  await expect(page).toHaveURL(new RegExp(`${S11(d.cls, d.les)}\\?tab=bai-tap$`));
  await expect(page.getByRole('tab', { name: /^Bài tập/ })).toHaveAttribute('aria-selected', 'true');
  // 2. Again from "Xem lại bài làm" on S05.
  await page.goto(S05(d.cls, setId));
  await page.getByRole('link', { name: 'Xem lại bài làm' }).click();
  await expect(page).toHaveURL(new RegExp(`${S06(d.cls, setId)}$`));
  await expect(page.getByRole('heading', { name: 'Từng câu · đáp án và giải thích' })).toBeVisible();
  await evidence(page, 'TC-082', 2);
});

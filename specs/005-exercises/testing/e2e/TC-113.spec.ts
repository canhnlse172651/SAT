import { expect, test } from '@playwright/test';
import { S05, S06, classWithSets, doSet, evidence, gvPage, hvPage, mcq, saveAnswers, set, setContent, setDeadline, start, view } from './helpers';

test('[005:AC-23.9] [005:AC-23.11] TC-113 clearing the deadline of a set in progress', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const q = (p: string) => mcq(p, [{ text: 'Đúng', correct: true }, { text: 'Sai' }]);
  const d = await classWithSets(gv, [
    { title: 'Bộ Y', content: set([q('Một'), q('Hai'), q('Ba')]) },
    { title: 'Bộ khác chưa mở', content: set([q('Một')]), deadline: null },
  ]);
  const [y, closed] = d.sets as [string, string];
  const qs = (await setContent(gv, d.les, y)).questions;
  const pick = (k: number) => ({ [qs[k].id]: { optionIds: [qs[k].options[0].id] } });
  const done = (await hvPage(browser, d.students[1]!)).page;
  await doSet(done, d.cls, y, { ...pick(0), ...pick(1), ...pick(2) });
  const { page } = await hvPage(browser, d.students[0]!);
  await start(page, d.cls, y);
  await saveAnswers(page, d.cls, y, { ...pick(0), ...pick(1) }, 2);
  await page.goto(S05(d.cls, y));
  await page.getByRole('button', { name: 'Tiếp tục làm' }).click();
  await expect(page.getByText('Câu 3/3')).toBeVisible();

  // 1. The GV clears Y's deadline.
  await setDeadline(gv, d.cls, y, null);
  // 2. The HV answers question 3.
  await page.getByRole('radio', { name: /^A\s*Đúng/ }).click();
  const refused = page.getByRole('alert').filter({ hasText: 'Bài tập chưa mở — giáo viên chưa đặt hạn nộp.' });
  await expect(refused).toBeVisible();
  await expect(refused).toContainText('Câu trả lời đã lưu của bạn được giữ lại.');
  await evidence(page, 'TC-113', 1);
  const v = (await view(page, d.cls, y)).body;
  expect(v.set.status).toBe('closed');
  // 3. "start" of another set that is not open: refused, no attempt.
  const r = await start(page, d.cls, closed);
  expect(r.status).toBe(409);
  expect((await view(page, d.cls, closed)).body.hasAttempt).toBe(false);
  // 4. The HV who submitted.
  await done.goto(S05(d.cls, y));
  await expect(done.getByText(/^Đã hoàn thành · 3(,0)? \/ 3(,0)?$/)).toBeVisible();
  await done.getByRole('link', { name: 'Xem lại bài làm' }).click();
  await expect(done).toHaveURL(new RegExp(`${S06(d.cls, y)}$`));
  await expect(done.getByText('Từng câu · đáp án và giải thích')).toBeVisible();
  await evidence(done, 'TC-113', 2);
});

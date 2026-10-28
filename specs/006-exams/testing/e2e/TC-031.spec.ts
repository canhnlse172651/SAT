import { expect, test } from '@playwright/test';
import { T22, evidence, freshStudents, getExam, gvPage, holder, hvPage, newClass, scheduledExam, start } from './helpers';

test('[006:AC-4.3] TC-031 a question edit saved after the first start is refused, the text kept', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const ex = await scheduledExam(page, { classIds: [A.id] });
  await page.goto(T22(ex.id));
  await page.getByRole('region', { name: 'Câu 1' }).getByRole('radio', { name: 'Đáp án đúng B' }).check();

  const hv = await hvPage(browser, h!);
  const s = await start(hv.page, ex.id, holder());
  expect(s.status).toBe(200);

  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(
    page.getByText('Đề thi vừa bị khóa vì học viên đã bắt đầu làm bài. Thay đổi câu hỏi và lịch không được lưu.'),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'Câu 1' }).getByRole('radio', { name: 'Đáp án đúng B' })).toBeChecked();
  expect((await getExam(page, ex.id)).content.questions[0].options[0].correct).toBe(true);
  await evidence(page, 'TC-031');
});

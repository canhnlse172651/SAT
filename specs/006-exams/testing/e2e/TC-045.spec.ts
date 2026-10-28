import { expect, test } from '@playwright/test';
import {
  MIN, T16, T22, advanceClock, doExam, e3, evidence, freshStudents, getExam, gvPage, hvPage, newClass, resetClock,
  scheduledExam, uid,
} from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-6.6] TC-045 "Nhân bản" makes a Nháp copy with the questions and duration only', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `Kiểm tra HSK2 giữa kỳ ${uid()}`;
  const ex = await scheduledExam(page, { name, classIds: [A.id], content: e3('Không dùng từ điển'), dur: 45, closeAfter: 60 });
  const hv = await hvPage(browser, h!);
  await doExam(page, hv.page, ex.id);
  await advanceClock(page, 61 * MIN);

  await page.goto(T22(ex.id));
  await page.getByRole('button', { name: 'Nhân bản' }).click();
  await expect(page.getByLabel('Tên bài thi')).toHaveValue(`${name} (bản sao)`);
  await expect(page).not.toHaveURL(new RegExp(`${T22(ex.id)}$`));
  const copyId = page.url().split('/').pop()!;
  await expect(page.locator('.xm-status')).toContainText('Nháp');
  await expect(page.getByLabel('Hướng dẫn (tùy chọn)')).toHaveValue('Không dùng từ điển');
  await expect(page.getByRole('region', { name: 'Câu 3' })).toBeVisible();
  await expect(page.getByLabel('Thời lượng (phút)')).toHaveValue('45');
  await expect(page.getByText('Chưa chọn lớp nào')).toBeVisible();
  await expect(page.getByLabel('Giờ mở')).toHaveValue('');
  await expect(page.getByLabel('Giờ đóng')).toHaveValue('');
  const copy = await getExam(page, copyId);
  const orig = await getExam(page, ex.id);
  expect(copy.content.questions).toEqual(orig.content.questions);
  expect(copy.attemptCount).toBe(0);
  await evidence(page, 'TC-045', 1);
  await page.goto(T16(copyId));
  await expect(page.getByText('Bài thi chưa được lên lịch — chưa có kết quả.')).toBeVisible();
  await evidence(page, 'TC-045', 2);
});

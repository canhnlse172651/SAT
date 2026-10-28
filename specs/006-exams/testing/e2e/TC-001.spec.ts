import { expect, test } from '@playwright/test';
import { MIN, T10, advanceClock, api, draftExam, evidence, freshStudents, gvPage, newClass, resetClock, scheduledExam, uid } from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-1.1] TC-001 T10 lists every exam not archived with its columns', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h1, h2, h3] = await freshStudents(page, 3);
  const A = await newClass(page, [h1!, h2!]);
  const B = await newClass(page, [h2!, h3!]);
  const t = uid();
  // Z: closed then archived (clock moved past its close), then the clock goes back.
  const z = await scheduledExam(page, { name: `TC-001 Z ${t}`, classIds: [A.id], dur: 1, closeAfter: 1 });
  await advanceClock(page, 2 * MIN);
  await api(page, 'POST', `/api/exams/${z.id}/archive`);
  await resetClock(page);
  const x = await scheduledExam(page, { name: `TC-001 X ${t}`, classIds: [A.id, B.id], openIn: 24 * 60, dur: 45, closeAfter: 120 });
  await draftExam(page, { name: `TC-001 Y ${t}` });

  await page.goto('/gv');
  await page.getByRole('link', { name: 'Bài thi' }).click();
  await expect(page).toHaveURL(new RegExp(`${T10}$`));
  await expect(page.getByRole('heading', { name: 'Danh sách bài thi' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tạo bài thi' })).toBeVisible();
  const rowX = page.locator('tr', { hasText: `TC-001 X ${t}` });
  await expect(rowX).toContainText(A.name);
  await expect(rowX).toContainText(B.name);
  await expect(rowX).toContainText('45 phút');
  await expect(rowX).toContainText('Đã lên lịch');
  await expect(rowX).toContainText('0/3');
  const o = new Date(x.opensAtDate.getTime() + 7 * 3600e3).toISOString();
  await expect(rowX).toContainText(`${o.slice(8, 10)}/${o.slice(5, 7)}/${o.slice(0, 4)}`);
  await expect(rowX).toContainText(o.slice(11, 16));
  await expect(page.locator('tr', { hasText: `TC-001 Y ${t}` })).toContainText('Nháp');
  await expect(page.locator('tr', { hasText: `TC-001 Z ${t}` })).toHaveCount(0);
  await evidence(page, 'TC-001');
});

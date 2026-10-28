import { expect, test } from '@playwright/test';
import { ORIGIN, S05, classWithSets, clockTo, ddmm, evidence, gvPage, mcq, resetClock, set, vnToday } from './helpers';

test('[005:AC-23.3] [005:AC-23.6] TC-110 deadline labels follow Vietnam time', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const due = vnToday(2);
  const before = vnToday(1);
  const d = await classWithSets(gv, [{ title: 'Bộ múi giờ', content: set([mcq('Câu?', [{ text: 'Đúng', correct: true }, { text: 'Sai' }])]), deadline: due }]);
  // An HV whose browser is at UTC−5.
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, baseURL: ORIGIN, timezoneId: 'America/Bogota' });
  const page = await ctx.newPage();
  const res = await page.request.post('/api/dev/session', { data: { role: 'HV', userId: d.students[0] }, headers: { Origin: ORIGIN } });
  expect(res.status()).toBe(201);
  const main = page.locator('[data-screen="S05"]');
  try {
    // 1. The day before.
    await clockTo(page, `${before}T10:00:00+07:00`);
    await page.goto(S05(d.cls, d.sets[0]!));
    await expect(main.getByText(`Hạn nộp ${ddmm(due)}`)).toBeVisible();
    await expect(main.getByText('Chưa làm', { exact: true })).toBeVisible();
    await evidence(page, 'TC-110', 1);
    // 2. The deadline day (in VN; still the day before in the browser's zone at 08:00 VN).
    await clockTo(page, `${due}T08:00:00+07:00`);
    await page.reload();
    await expect(main.getByText('Hạn hôm nay')).toBeVisible();
    await evidence(page, 'TC-110', 2);
    // 3. 00:00:00 VN the next day, shown again: "Quá hạn" with "Hạn nộp dd/MM".
    await clockTo(page, `${vnToday(3)}T00:00:00+07:00`);
    await page.reload();
    await expect(main.getByText('Quá hạn', { exact: true })).toBeVisible();
    await expect(main.getByText(`Hạn nộp ${ddmm(due)}`)).toBeVisible();
    await evidence(page, 'TC-110', 3);
  } finally {
    await resetClock(page);
  }
});

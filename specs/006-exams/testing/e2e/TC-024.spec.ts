import { expect, test } from '@playwright/test';
import { MIN, T22, draftExam, e3, evidence, freshStudents, gvPage, minuteOf, newClass, serverNow, vnInput } from './helpers';

const ddmmyyyy = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}`;

test('[006:AC-3.7] TC-024 upcoming classes starting after the open day: saved with a warning', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const C = await newClass(page, [h!], { startOffset: 3 });
  const E = await newClass(page, [h!], { startOffset: 10 });
  const base = minuteOf(await serverNow(page));
  const open = new Date(base.getTime() + 24 * 60 * MIN);
  const close = new Date(base.getTime() + 5 * 24 * 60 * MIN);
  const cStart = new Date(base.getTime() + 7 * 3600e3 + 3 * 86400e3).toISOString().slice(0, 10);

  for (const [cls, msg] of [
    [C, `Lớp ${C.name} bắt đầu ngày ${ddmmyyyy(cStart)} — học viên lớp này chỉ vào thi được từ ngày đó.`],
    [E, `Lớp ${E.name} bắt đầu sau giờ đóng — học viên lớp này sẽ không làm được bài thi.`],
  ] as const) {
    const d = await draftExam(page, { content: e3(), classIds: [cls.id] });
    await page.goto(T22(d.id));
    await page.getByLabel('Giờ mở').fill(vnInput(open));
    await page.getByLabel('Thời lượng (phút)').fill('45');
    await page.getByLabel('Giờ đóng').fill(vnInput(close));
    await page.getByRole('button', { name: 'Lên lịch' }).click();
    await expect(page.locator('.xm-status')).toContainText('Đã lên lịch');
    await expect(page.getByText(msg)).toBeVisible();
    await evidence(page, 'TC-024', cls === C ? 1 : 2);
  }
});

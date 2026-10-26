import { test, expect } from '@playwright/test';
import { addDays, createClass, ddmmyyyy, newWorkspaceGv, seedCurriculum, setDeadline, shot, signInLike, vnDay } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-21.2] [003:NFR-6] TC-070 lịch popup: bàn phím, hôm nay, ngày đang có, khoảng ±365, Esc / bấm ra ngoài', async ({ page }) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-070 GT', [{ name: 'Bài 1', sets: 1 }]);
  const cls = await createClass(gv, { name: 'TC-070 Lớp', curriculumId: cur.id });
  const today = vnDay();
  const due = addDays(today, 7);
  await setDeadline(gv, cls.id, cur.lessons[0]!.sets[0]!, due);
  await signInLike(page, gv);
  await page.goto(`/gv/lop-hoc/${cls.id}?tab=noi-dung`);

  const field = page.getByRole('button', { name: `Hạn nộp Bài 1 · Bộ 1: ${ddmmyyyy(due)}` });
  await field.focus();
  await page.keyboard.press('Enter');
  const pop = page.getByRole('dialog', { name: 'Hạn nộp Bài 1 · Bộ 1' });
  await expect(pop).toBeVisible();
  const fieldBox = await field.boundingBox();
  const popBox = await pop.boundingBox();
  expect(popBox!.y).toBeGreaterThan(fieldBox!.y + fieldBox!.height - 1);
  await expect(pop.getByRole('columnheader')).toHaveText(['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']);
  await expect(pop.getByText(/^Tháng \d+ năm \d+$/)).toBeVisible();
  const [y, m, d] = due.split('-').map(Number);
  const dueBtn = pop.getByRole('button', { name: `${d} tháng ${m} năm ${y}`, exact: true });
  await expect(dueBtn).toBeFocused();
  await expect(dueBtn.locator('..')).toHaveAttribute('aria-selected', 'true');
  await expect(pop.getByText(`Hạn nộp: 23:59 ${ddmmyyyy(due)}`, { exact: true })).toBeVisible();
  await expect(pop.getByRole('button', { name: 'Xóa' })).toBeVisible();
  await expect(pop.getByRole('button', { name: 'Áp dụng' })).toBeVisible();
  await shot(page, 'TC-070', 1);

  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(pop.getByText(`Hạn nộp: 23:59 ${ddmmyyyy(addDays(due, 1))}`, { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(pop).toBeHidden();
  await expect(field).toHaveText(ddmmyyyy(due));

  await field.click();
  await expect(pop).toBeVisible();
  // The popup opens on the month of the selected day; go to today's month (it may be another month) and find today marked.
  const toMonth = async (y: number, m: number) => {
    for (let i = 0; i < 14; i++) {
      const cap = await pop.getByText(/^Tháng \d+ năm \d+$/).textContent();
      const [, cm, cy] = /Tháng (\d+) năm (\d+)/.exec(cap ?? '')!.map(Number) as [number, number, number];
      const diff = (y - cy) * 12 + (m - cm);
      if (diff === 0) return;
      await pop.getByRole('button', { name: diff > 0 ? 'Tháng sau' : 'Tháng trước' }).click();
    }
  };
  const [ty, tm, td] = today.split('-').map(Number) as [number, number, number];
  await toMonth(ty, tm);
  await expect(pop.getByRole('button', { name: `${td} tháng ${tm} năm ${ty}`, exact: true })).toHaveAttribute(
    'aria-current',
    'date',
  );
  // 365 days back: the first allowed day is enabled, the day before is disabled.
  const first = addDays(today, -365);
  const [fy, fm, fd] = first.split('-').map(Number) as [number, number, number];
  await toMonth(fy, fm);
  await expect(pop.getByRole('button', { name: `${fd} tháng ${fm} năm ${fy}`, exact: true })).toBeEnabled();
  if (fd > 1) await expect(pop.getByRole('button', { name: `${fd - 1} tháng ${fm} năm ${fy}`, exact: true })).toBeDisabled();
  await expect(pop.getByRole('button', { name: 'Tháng trước' })).toBeDisabled();
  await shot(page, 'TC-070', 2);
  await page.mouse.click(5, 5);
  await expect(pop).toBeHidden();
  await expect(field).toHaveText(ddmmyyyy(due));
});

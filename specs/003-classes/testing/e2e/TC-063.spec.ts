import { test, expect } from '@playwright/test';
import {
  addDays,
  apiAs,
  clockTo,
  createClass,
  hvSave,
  hvSubmit,
  newStudent,
  newWorkspaceGv,
  ok,
  resetClock,
  seedCurriculum,
  setDeadline,
  shot,
  signIn,
  vnDay,
} from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('[003:AC-19.3] [003:AC-19.5] [003:AC-19.7] TC-063 S11 tab Bài tập: số câu, nhãn hạn, 5 trạng thái, mở đúng màn hình', async ({
  page,
}) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-063 GT', [{ name: 'Bài 1', sets: 5, questions: 10 }]);
  const [a, b, c, d, e] = cur.lessons[0]!.sets as [string, string, string, string, string];
  const hv = await newStudent(gv, 'Bảo Trạng thái', { activate: true });
  const cls = await createClass(gv, { name: 'TC-063 Lớp', curriculumId: cur.id, studentIds: [hv.id], startDate: addDays(vnDay(), -10) });
  const today = vnDay();
  const me = await ok(gv, 'GET', '/session');
  const hvApi = await apiAs('HV', hv.id);
  await setDeadline(gv, cls.id, a, addDays(today, 5));
  await setDeadline(gv, cls.id, b, addDays(today, 5));
  await setDeadline(gv, cls.id, c, addDays(today, -2));
  await setDeadline(gv, cls.id, e, addDays(today, -1));
  expect((await hvSave(hvApi, cls.id, b)).status).toBe(200);
  // C is submitted after its deadline (late): 8/10.
  expect((await hvSubmit(hvApi, cls.id, c, 8, 10)).status).toBe(200);
  void d;

  await signIn(page, 'HV', hv.id);
  await page.goto(`/hv/lop/${cls.id}/bai/${cur.lessons[0]!.id}?tab=bai-tap`);
  const row = (n: number) => page.getByRole('tabpanel').locator('li').nth(n);
  await expect(row(0)).toContainText('10 câu');
  await expect(row(0)).toContainText('Chưa làm');
  await expect(row(0)).toContainText(/Hạn nộp \d\d\/\d\d/);
  await expect(row(1)).toContainText('Đang làm');
  await expect(row(2)).toContainText('Đã hoàn thành · 8/10');
  await expect(row(2)).toContainText('Nộp muộn');
  await expect(row(3)).toContainText('Chưa mở');
  await expect(row(4)).toContainText('Quá hạn');
  for (let i = 0; i < 5; i++) await expect(row(i).locator('.hv-row__no, .hv-row__no.is-ok')).toBeVisible();
  await expect(page.getByText('Làm lại')).toHaveCount(0);
  await shot(page, 'TC-063', 1);

  const open = async (n: number, path: RegExp) => {
    await row(n).getByRole('link').click();
    await expect(page).toHaveURL(path);
    await page.goBack();
  };
  await open(0, new RegExp(`/bai-tap/${a}$`));
  await open(1, new RegExp(`/bai-tap/${b}$`));
  await open(4, new RegExp(`/bai-tap/${e}$`));
  await open(2, new RegExp(`/bai-tap/${c}/ket-qua$`));
  const url = page.url();
  await row(3).click();
  await expect(page).toHaveURL(url);
  await shot(page, 'TC-063', 2);
  void clockTo;
  void resetClock;
  void me;
});

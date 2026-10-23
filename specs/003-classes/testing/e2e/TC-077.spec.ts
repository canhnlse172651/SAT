import { test, expect } from '@playwright/test';
import {
  addDays,
  apiAs,
  call,
  createClass,
  ddmm,
  ddmmyyyy,
  hvSave,
  hvSubmit,
  newStudent,
  newWorkspaceGv,
  seedCurriculum,
  setDeadline,
  shot,
  signIn,
  vnDay,
} from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('[003:AC-23.1] [003:AC-23.2] [003:AC-23.3] [003:AC-23.4] TC-077 nhãn Hạn nộp dd/MM(/yyyy), Hạn hôm nay, Quá hạn; nộp muộn được', async ({
  page,
}) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-077 GT', [{ name: 'Bài 1', sets: 4 }]);
  const [x, y, z, w] = cur.lessons[0]!.sets as [string, string, string, string];
  const hv = await newStudent(gv, 'Hải Nhãn', { activate: true });
  const today = vnDay();
  const cls = await createClass(gv, { name: 'TC-077 Lớp', curriculumId: cur.id, studentIds: [hv.id], startDate: addDays(today, -10) });
  const nextYear = `${Number(today.slice(0, 4)) + 1}-01-05`;
  await setDeadline(gv, cls.id, x, addDays(today, 4));
  await setDeadline(gv, cls.id, y, today);
  await setDeadline(gv, cls.id, z, addDays(today, -3));
  await setDeadline(gv, cls.id, w, nextYear);
  const hvApi = await apiAs('HV', hv.id);
  expect((await hvSave(hvApi, cls.id, z)).status).toBe(200);
  await signIn(page, 'HV', hv.id);
  await page.goto(`/hv/lop/${cls.id}/bai/${cur.lessons[0]!.id}?tab=bai-tap`);

  const row = (t: string) => page.getByRole('link', { name: new RegExp(t) });
  await expect(row('Bộ 1')).toContainText(`Hạn nộp ${ddmm(addDays(today, 4))}`);
  await expect(row('Bộ 1')).toContainText('Chưa làm');
  await expect(row('Bộ 2')).toContainText('Hạn hôm nay');
  await expect(row('Bộ 2')).not.toContainText('Hạn nộp');
  await expect(row('Bộ 3')).toContainText('Quá hạn');
  await expect(row('Bộ 3')).toContainText(`Hạn nộp ${ddmm(addDays(today, -3))}`);
  await expect(row('Bộ 3')).not.toContainText('Đang làm');
  await expect(row('Bộ 4')).toContainText(`Hạn nộp ${ddmmyyyy(nextYear)}`);
  await shot(page, 'TC-077', 1);

  // S05 (005) shows the label of its set from 003.
  const item = await call(hvApi, 'GET', `/my-classes/${cls.id}/items/${y}`);
  expect(item.body.set.deadlineLabel).toBe('Hạn hôm nay');
  await row('Bộ 3').click();
  await expect(page).toHaveURL(new RegExp(`/bai-tap/${z}$`));
  expect((await hvSubmit(hvApi, cls.id, z)).status).toBe(200);
  await page.goto(`/hv/lop/${cls.id}/bai/${cur.lessons[0]!.id}?tab=bai-tap`);
  await expect(row('Bộ 3')).toContainText('Đã hoàn thành');
  await expect(row('Bộ 3')).toContainText('Nộp muộn');
  await shot(page, 'TC-077', 2);
});

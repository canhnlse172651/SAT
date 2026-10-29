import { test, expect } from '@playwright/test';
import { addDays, apiAs, call, createClass, ddmmyyyy, newStudent, newWorkspaceGv, seedCurriculum, setDeadline, shot, signIn, vnDay } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('[003:AC-14.3] TC-048 lớp Sắp bắt đầu: S02 chỉ thông tin + thông điệp, từ chối mọi nội dung kể cả đường dẫn trực tiếp', async ({
  page,
}) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-048 GT', [{ name: 'Bài 1', steps: 1, sets: 1 }]);
  const hv = await newStudent(gv, 'Phương Sớm', { activate: true });
  const start = addDays(vnDay(), 6);
  const cls = await createClass(gv, { name: 'TC-048 Lớp', curriculumId: cur.id, studentIds: [hv.id], startDate: start });
  await setDeadline(gv, cls.id, cur.lessons[0]!.sets[0]!, addDays(start, 1));
  const message = `Lớp sẽ bắt đầu vào ngày ${ddmmyyyy(start)}. Nội dung sẽ mở từ ngày này.`;
  await signIn(page, 'HV', hv.id);

  await page.goto(`/hv/lop/${cls.id}`);
  await expect(page.getByRole('heading', { name: 'TC-048 Lớp' })).toBeVisible();
  await expect(page.locator('.hv-info')).toContainText('Sắp bắt đầu');
  await expect(page.getByText(message, { exact: true })).toBeVisible();
  await expect(page.locator('.hv-list')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Thành viên/ })).toHaveCount(0);
  await shot(page, 'TC-048', 1);

  await page.goto(`/hv/lop/${cls.id}/bai/${cur.lessons[0]!.id}`);
  await expect(page.getByText(message, { exact: true })).toBeVisible();
  await expect(page.getByText('Bài 1 · Bước 1')).toHaveCount(0);
  await shot(page, 'TC-048', 2);

  // S03 / S05 belong to 004 / 005: the 003 item access they will call answers with the same message.
  const hvApi = await apiAs('HV', hv.id);
  for (const id of [cur.lessons[0]!.steps[0]!, cur.lessons[0]!.sets[0]!]) {
    const r = await call(hvApi, 'GET', `/my-classes/${cls.id}/items/${id}`);
    expect(r.status).toBe(409);
    expect(r.body.error.message).toBe(message);
  }
  const members = await call(hvApi, 'GET', `/my-classes/${cls.id}/members`);
  expect(members.status).toBe(409);
});

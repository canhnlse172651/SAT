import { test, expect } from '@playwright/test';
import { ORIGIN, addDays, createClass, newStudent, newWorkspaceGv, ok, outbox, seedCurriculum, setDeadline, shot, signIn, vnDay } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

const link = (text: string) => /Làm bài ngay: (\S+)/.exec(text)![1]!;

test('[003:AC-25.4] TC-086 nút "Làm bài ngay": S05 (1 bộ) / S02 (≥ 2 bộ), qua A01 khi chưa đăng nhập, quy tắc truy cập', async ({
  page,
}) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-086 GT', [{ name: 'Bài 1', sets: 2 }]);
  const [x, y] = cur.lessons[0]!.sets as [string, string];
  const today = vnDay();
  const hv = await newStudent(gv, 'Mạnh Bấm link', { activate: true });
  const [activation] = await outbox(gv, hv.email, 'activation');
  const password = /Mật khẩu: (\S+)/.exec(activation.text)![1]!;
  const a = await createClass(gv, { name: 'TC-086 A', curriculumId: cur.id, studentIds: [hv.id], startDate: addDays(today, -2) });
  const b = await createClass(gv, { name: 'TC-086 B', curriculumId: cur.id, studentIds: [hv.id], startDate: addDays(today, -2) });
  await setDeadline(gv, a.id, x, today);
  await setDeadline(gv, b.id, x, today);
  await setDeadline(gv, b.id, y, today);
  await ok(gv, 'POST', '/dev/classes/reminders/run', { reset: true });
  const mails = await outbox(gv, hv.email);
  const one = mails.find((m) => m.subject.endsWith('TC-086 A'))!;
  const two = mails.find((m) => m.subject.endsWith('TC-086 B'))!;
  const oneUrl = link(one.text);
  const twoUrl = link(two.text);
  expect(oneUrl).toBe(`${ORIGIN}/hv/lop/${a.id}/bai-tap/${x}`);
  expect(twoUrl).toBe(`${ORIGIN}/hv/lop/${b.id}`);

  await signIn(page, 'HV', hv.id);
  await page.goto(oneUrl);
  await expect(page).toHaveURL(new RegExp(`/hv/lop/${a.id}/bai-tap/${x}$`));
  await expect(page.getByRole('heading', { name: /S05/ })).toBeVisible();
  await page.goto(twoUrl);
  await expect(page.getByRole('heading', { name: 'TC-086 B' })).toBeVisible();
  await shot(page, 'TC-086', 1);

  // Signed out: A01 first, then straight to the target.
  await page.context().clearCookies();
  await page.goto(oneUrl);
  await expect(page).toHaveURL(/\/dang-nhap\?returnTo=/);
  await page.getByLabel('Email').fill(hv.email);
  await page.getByLabel('Mật khẩu').fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).toHaveURL(new RegExp(`/hv/lop/${a.id}/bai-tap/${x}$`));
  await shot(page, 'TC-086', 2);

  await ok(gv, 'DELETE', `/classes/${b.id}/students/${hv.id}`);
  await page.goto(twoUrl);
  await expect(page.getByText('Bạn không thuộc lớp này hoặc lớp không còn tồn tại', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/hv$/);
  await shot(page, 'TC-086', 3);
});

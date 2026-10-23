import { test, expect } from '@playwright/test';
import {
  createClass,
  newStudent,
  newWorkspaceGv,
  ok,
  outbox,
  seedCurriculum,
  setDeadline,
  setVisibility,
  shot,
  signIn,
  signInLike,
  vnDay,
} from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-22.5] [003:AC-22.6] TC-076 hạn được giữ nhưng không hiệu lực khi phần ẩn / bộ lưu trữ', async ({ page, browser }) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-076 GT', [{ name: 'Bài 1', steps: 1 }, { name: 'Bài 2', steps: 1, sets: 1 }]);
  const l2 = cur.lessons[1]!;
  const x = l2.sets[0]!;
  const hv = await newStudent(gv, 'Giang Nhắc', { activate: true });
  const cls = await createClass(gv, { name: 'TC-076 Lớp', curriculumId: cur.id, studentIds: [hv.id] });
  await setDeadline(gv, cls.id, x, vnDay());
  await signInLike(page, gv);

  await setVisibility(gv, cls.id, true, { kind: 'section', lessonId: l2.id, section: 'exercise' });
  await page.goto(`/gv/lop-hoc/${cls.id}?tab=noi-dung`);
  const row2 = page.getByRole('tabpanel').getByRole('row').filter({ hasText: 'Bài 2' });
  await expect(row2.getByText('Hạn nộp được giữ nhưng không gửi nhắc khi phần đang ẩn.', { exact: true })).toBeVisible();
  await expect(row2.getByRole('button', { name: /^Hạn nộp Bài 2 · Bộ 1:/ })).toBeEnabled();
  await expect(row2.getByRole('button', { name: /^Hạn nộp Bài 2 · Bộ 1:/ })).not.toHaveText('Đặt hạn');
  await shot(page, 'TC-076', 1);

  // Archived set at the 08:00 sweep: no reminder for it.
  const item = (await ok(gv, 'GET', `/lessons/${l2.id}`)).items.find((i: { id: string }) => i.id === x);
  await ok(gv, 'POST', `/lessons/${l2.id}/items/${x}/archive`, { expectedVersion: item.version });
  await setVisibility(gv, cls.id, false, { kind: 'section', lessonId: l2.id, section: 'exercise' });
  await ok(gv, 'POST', '/dev/classes/reminders/run', { reset: true });
  expect(await outbox(gv, hv.email)).toHaveLength(0);

  const archived = (await ok(gv, 'GET', `/lessons/${l2.id}`)).items.find((i: { id: string }) => i.id === x);
  await ok(gv, 'POST', `/lessons/${l2.id}/items/${x}/restore`, { expectedVersion: archived.version });
  const hvPage = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await signIn(hvPage, 'HV', hv.id);
  await hvPage.goto(`/hv/lop/${cls.id}/bai/${l2.id}?tab=bai-tap`);
  await expect(hvPage.getByRole('link', { name: /Bài 2 · Bộ 1/ })).toContainText('Hạn hôm nay');
  await shot(hvPage, 'TC-076', 2);
});

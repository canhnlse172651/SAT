import { test, expect } from '@playwright/test';
import {
  apiAs,
  createClass,
  hvSubmit,
  newStudent,
  newWorkspaceGv,
  ok,
  seedCurriculum,
  setDeadline,
  shot,
  signInLike,
  vnDay,
} from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

const LOCKED = 'Không thể xóa lớp đã có bài nộp của học viên.';

test('[003:AC-11.3] [003:AC-11.4] TC-039 bài nộp (kể cả HV đã gỡ, bài thi tự nộp) chặn xóa lớp', async ({ page }) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-039 GT', [{ name: 'Bài 1', sets: 1 }]);
  const g2 = await seedCurriculum(gv, 'TC-039 GT2', [{ name: 'Bài 1', steps: 1 }]);
  const hv = await newStudent(gv, 'Phúc Nộp', { activate: true });
  const setId = cur.lessons[0]!.sets[0]!;
  const l1 = await createClass(gv, { name: 'TC-039 L1', curriculumId: cur.id, studentIds: [hv.id] });
  await setDeadline(gv, l1.id, setId, vnDay());
  const hvApi = await apiAs('HV', hv.id);
  expect((await hvSubmit(hvApi, l1.id, setId)).status).toBe(200);
  await ok(gv, 'DELETE', `/classes/${l1.id}/students/${hv.id}`);
  const l2 = await createClass(gv, { name: 'TC-039 L2', curriculumId: cur.id, studentIds: [hv.id] });
  const exam = await ok(gv, 'POST', '/dev/classes/exams', { classIds: [l2.id] });
  await ok(gv, 'POST', `/dev/classes/exams/${exam.id}/submissions`, { classId: l2.id, studentId: hv.id });
  const l3 = await createClass(gv, { name: 'TC-039 L3', curriculumId: cur.id, studentIds: [hv.id] });
  await setDeadline(gv, l3.id, setId, vnDay());
  await signInLike(page, gv);

  for (const c of [l1, l2]) {
    await page.goto(`/gv/lop-hoc/${c.id}`);
    await expect(page.getByRole('button', { name: 'Xóa lớp' })).toBeDisabled();
    await expect(page.getByText(LOCKED, { exact: true })).toBeVisible();
  }
  await shot(page, 'TC-039', 1);
  // L2 has only an exam submission: the curriculum can still be changed (AC-9.3 counts exercise submissions only).
  await expect(page.getByRole('tabpanel').getByRole('button', { name: 'Đổi giáo trình' })).toBeEnabled();
  expect((await ok(gv, 'PUT', `/classes/${l2.id}/curriculum`, { curriculumId: g2.id })).curriculum.id).toBe(g2.id);

  await page.goto(`/gv/lop-hoc/${l3.id}`);
  await page.getByRole('button', { name: 'Xóa lớp' }).click();
  expect((await hvSubmit(hvApi, l3.id, setId)).status).toBe(200);
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xóa lớp' }).click();
  await expect(page.getByText(LOCKED, { exact: true }).first()).toBeVisible();
  expect((await ok(gv, 'GET', `/classes/${l3.id}`)).name).toBe('TC-039 L3');
  await expect(page).toHaveURL(new RegExp(`/gv/lop-hoc/${l3.id}$`));
  await shot(page, 'TC-039', 2);
});

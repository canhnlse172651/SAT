import { test, expect } from '@playwright/test';
import { apiAs, createClass, hvSave, newStudent, newWorkspaceGv, seedCurriculum, setDeadline, shot, signInLike, vnDay } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-16.3] TC-054 hộp xác nhận ẩn nêu số HV đang làm dở', async ({ page }) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-054 GT', [{ name: 'Bài 1', steps: 1, sets: 2 }]);
  const h1 = await newStudent(gv, 'Tâm Một', { activate: true });
  const h2 = await newStudent(gv, 'Tâm Hai', { activate: true });
  const h3 = await newStudent(gv, 'Tâm Ba', { activate: true });
  const cls = await createClass(gv, { name: 'TC-054 Lớp', curriculumId: cur.id, studentIds: [h1.id, h2.id, h3.id] });
  for (const s of cur.lessons[0]!.sets) await setDeadline(gv, cls.id, s, vnDay());
  expect((await hvSave(await apiAs('HV', h1.id), cls.id, cur.lessons[0]!.sets[0]!)).status).toBe(200);
  expect((await hvSave(await apiAs('HV', h2.id), cls.id, cur.lessons[0]!.sets[1]!)).status).toBe(200);
  await signInLike(page, gv);
  await page.goto(`/gv/lop-hoc/${cls.id}?tab=noi-dung`);
  await page.getByRole('button', { name: 'Ẩn với lớp: Bài tập của Bài 1' }).click();
  await expect(
    page
      .getByRole('alertdialog')
      .getByText(
        '2 học viên đang làm dở bài tập trong phần này — câu trả lời đã lưu được giữ lại nhưng không nộp được cho tới khi bạn hiện lại.',
      ),
  ).toBeVisible();
  await shot(page, 'TC-054', 1);
});

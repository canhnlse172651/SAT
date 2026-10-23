import { test, expect } from '@playwright/test';
import { addDays, createClass, ddmmyyyy, newWorkspaceGv, seedCurriculum, setDeadline, shot, signInLike, vnDay } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

const WARN =
  'Xóa hạn sẽ đóng bộ bài tập với học viên lớp này: ai chưa nộp sẽ thấy “Chưa mở” và không làm được; bài đã nộp và điểm được giữ.';

test('[003:AC-21.8] TC-073 cảnh báo trước nút Xóa khi đang có hạn', async ({ page }) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-073 GT', [{ name: 'Bài 1', sets: 2 }, { name: 'Bài 2', sets: 1 }]);
  const cls = await createClass(gv, { name: 'TC-073 Lớp', curriculumId: cur.id });
  const due = addDays(vnDay(), 4);
  await setDeadline(gv, cls.id, cur.lessons[0]!.sets[0]!, due);
  await signInLike(page, gv);
  await page.goto(`/gv/lop-hoc/${cls.id}?tab=noi-dung`);
  const open = async (name: string | RegExp, dialog: string) => {
    await page.getByRole('button', { name }).click();
    const pop = page.getByRole('dialog', { name: dialog });
    await expect(pop).toBeVisible();
    return pop;
  };

  let pop = await open(`Hạn nộp Bài 1 · Bộ 1: ${ddmmyyyy(due)}`, 'Hạn nộp Bài 1 · Bộ 1');
  const note = pop.getByRole('note');
  await expect(note).toHaveText(WARN);
  const noteBox = await note.boundingBox();
  const clearBox = await pop.getByRole('button', { name: 'Xóa' }).boundingBox();
  expect(noteBox!.y).toBeLessThan(clearBox!.y);
  await shot(page, 'TC-073', 1);
  await page.keyboard.press('Escape');

  pop = await open('Hạn nộp Bài 1 · Bộ 2: chưa đặt', 'Hạn nộp Bài 1 · Bộ 2');
  await expect(pop.getByText(WARN, { exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  pop = await open('Đặt hạn cho mọi bộ của bài Bài 1: chưa đặt', 'Đặt hạn cho mọi bộ của bài Bài 1');
  await expect(pop.getByText(WARN, { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  pop = await open('Đặt hạn cho mọi bộ của bài Bài 2: chưa đặt', 'Đặt hạn cho mọi bộ của bài Bài 2');
  await expect(pop.getByText(WARN, { exact: true })).toHaveCount(0);
  await shot(page, 'TC-073', 2);
});

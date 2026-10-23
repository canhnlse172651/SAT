import { test, expect } from '@playwright/test';
import {
  READY_SET,
  READY_STEP,
  addItem,
  addLesson,
  asGv,
  createCurriculum,
  devClass,
  getLesson,
  learningData,
  ok,
  otherPage,
  publishLesson,
  shot,
  uid,
} from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-11.5] [002:AC-11.7] [002:AC-19.2] [002:AC-19.3] [002:AC-19.6] TC-044 duyệt AI thay phần Bài tập', async ({
  page,
  browser,
}) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-044 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  const s = await addItem(page, l.id, 'lesson', { title: 'S', content: READY_STEP });
  const e1 = await addItem(page, l.id, 'exercise', { title: 'E1', content: READY_SET });
  await publishLesson(page, l.id, [s, e1]);
  await addItem(page, l.id, 'exercise', { title: 'E2', content: READY_SET });
  await addItem(page, l.id, 'exercise', { title: 'E3', content: READY_SET, archive: true });
  await learningData(page, e1);
  await devClass(page, c.id, 'Lớp TC-044', { studentEmails: ['hv1@sat.dev'] });

  const items = ['AI 1', 'AI 2', 'AI 3', 'AI 4'].map((title) => ({ title, content: READY_SET }));
  const preview = await ok(page, 'POST', '/dev/curriculum/ai-approve/preview', { lessonId: l.id, section: 'exercise', items });
  await ok(page, 'POST', '/dev/curriculum/ai-approve', { lessonId: l.id, section: 'exercise', items, token: preview.token });

  const after = await getLesson(page, l.id);
  expect(after.status).toBe('published');
  const ex = after.items.filter((i: { section: string }) => i.section === 'exercise');
  expect(ex.map((i: { title: string; status: string; ai: boolean }) => [i.title, i.status, i.ai])).toEqual([
    ['AI 1', 'published', true],
    ['AI 2', 'published', true],
    ['AI 3', 'published', true],
    ['AI 4', 'published', true],
    ['E1', 'archived', false],
  ]);
  expect(after.items.filter((i: { section: string }) => i.section === 'lesson').map((i: { title: string }) => i.title)).toEqual(['S']);

  await page.goto(`/gv/giao-trinh/${c.id}/bai/${l.id}/thu-cong`);
  const set = (k: number) => page.getByRole('region', { name: `Bộ bài tập ${k}` });
  await expect(set(1).getByText('AI tạo', { exact: true })).toBeVisible();
  await expect(set(1).getByLabel('Tên')).toHaveValue('AI 1');
  await shot(page, 'TC-044', 1);

  const hv = await otherPage(browser, 'HV');
  const seen = await hv.request.get(`/api/learn/lessons/${l.id}`).then((r) => r.json());
  expect(seen.sections.exercise.map((i: { title: string }) => i.title)).toEqual(['AI 1', 'AI 2', 'AI 3', 'AI 4']);
  expect(JSON.stringify(seen)).not.toContain('"ai"');
  expect(JSON.stringify(seen)).not.toContain('AI tạo');
  await hv.context().close();

  // AI items follow the rules of manual items: edit + save, move, archive, delete.
  await set(1).getByLabel('Tên').fill('AI 1 sửa');
  await set(1).getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByText(/^Đã lưu lúc \d{2}:\d{2}$/).first()).toBeVisible();
  await set(1).getByRole('button', { name: 'Xuống dưới' }).click();
  await expect(page.getByText('Đã chuyển tới vị trí 2/5 · Đã lưu', { exact: true }).first()).toBeVisible();
  await set(1).getByRole('button', { name: 'Lưu trữ' }).click();
  await expect(page.getByText('Đã lưu trữ · Đã lưu', { exact: true })).toBeVisible();
  await set(3).getByRole('button', { name: 'Xóa' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xóa' }).click();
  await expect(page.getByText('Đã xóa · Đã lưu', { exact: true })).toBeVisible();
  const final = (await getLesson(page, l.id)).items.filter((i: { section: string }) => i.section === 'exercise');
  expect(final.map((i: { title: string; status: string }) => [i.title, i.status])).toEqual([
    ['AI 2', 'archived'],
    ['AI 1 sửa', 'published'],
    ['AI 4', 'published'],
    ['E1', 'archived'],
  ]);
});

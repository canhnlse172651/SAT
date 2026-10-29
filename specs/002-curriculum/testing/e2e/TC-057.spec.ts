import { test, expect } from '@playwright/test';
import {
  READY_SET,
  READY_STEP,
  addItem,
  addLesson,
  aiLabel,
  asGv,
  createCurriculum,
  getLesson,
  learningData,
  lessonRow,
  ok,
  publishLesson,
  shot,
  uid,
} from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-14.1] [002:AC-14.2] [002:AC-14.3] TC-057 nhân bản bài: ngay sau bản gốc, tất cả Nháp, giữ AI tạo', async ({
  page,
}) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-057 ${uid()}`, 1);
  await addLesson(page, c.id, 'Bài 1');
  const b2 = await addLesson(page, c.id, 'Bài 2 – 你好');
  await addLesson(page, c.id, 'Bài 3');
  const s1 = await addItem(page, b2.id, 'lesson', { title: 'S1', content: READY_STEP });
  const s2 = await addItem(page, b2.id, 'lesson', { title: 'S2', content: READY_STEP });
  await publishLesson(page, b2.id, [s1, s2]);
  await addItem(page, b2.id, 'lesson', { title: 'S3 lưu trữ', content: READY_STEP, archive: true });
  // Two sets from an approved AI section (published, "AI tạo"); one of them gets learning data.
  const items = [{ title: 'AI 1', content: READY_SET }, { title: 'AI 2', content: READY_SET }];
  const p = await ok(page, 'POST', '/dev/curriculum/ai-approve/preview', { lessonId: b2.id, section: 'exercise', items });
  const approved = await ok(page, 'POST', '/dev/curriculum/ai-approve', { lessonId: b2.id, section: 'exercise', items, token: p.token });
  await learningData(page, approved.items.find((i: { title: string }) => i.title === 'AI 1').id);
  await aiLabel(page, b2.id, 'review');

  await page.goto(`/gv/giao-trinh/${c.id}`);
  await lessonRow(page, 'Bài 2 – 你好').getByRole('button', { name: 'Thao tác với Bài 2 – 你好' }).click();
  await page.getByRole('menuitem', { name: 'Nhân bản bài' }).click();
  await expect(page.getByText('Đã nhân bản bài', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/bai\/[0-9a-f]{24}$/);
  const head = page.getByRole('heading', { level: 1 });
  await expect(head).toContainText('Bài 2 – 你好 (bản sao)');
  await expect(head).toContainText('Nháp');
  const manual = page.getByRole('region', { name: 'Thủ công' });
  await expect(manual.getByRole('region', { name: 'Phần Bài học' })).toContainText('2 bước học · 2 nháp');
  await expect(manual.getByRole('region', { name: 'Phần Bài tập' })).toContainText('2 bộ bài tập · 2 nháp');
  await expect(page.getByRole('button', { name: /^AI · / })).toHaveCount(0);
  await expect(page.getByText('Có dữ liệu học viên')).toHaveCount(0);
  await shot(page, 'TC-057', 1);

  const copyId = page.url().split('/').pop()!;
  const copy = await getLesson(page, copyId);
  expect(copy.items.map((i: { title: string; status: string; ai: boolean }) => [i.title, i.status, i.ai])).toEqual([
    ['S1', 'draft', false],
    ['S2', 'draft', false],
    ['AI 1', 'draft', true],
    ['AI 2', 'draft', true],
  ]);
  expect(copy.hasLearningData).toBe(false);

  await page.getByRole('button', { name: 'Soạn thủ công' }).click();
  await page.getByRole('tab', { name: /Bài tập/ }).click();
  await expect(page.getByRole('region', { name: 'Bộ bài tập 1' }).getByText('AI tạo', { exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Bộ bài tập 2' }).getByText('AI tạo', { exact: true })).toBeVisible();

  await page.goto(`/gv/giao-trinh/${c.id}`);
  await expect(page.locator('.cur-row__name')).toHaveText(['Bài 1', 'Bài 2 – 你好', 'Bài 2 – 你好 (bản sao)', 'Bài 3']);
});

import { test, expect } from '@playwright/test';
import {
  READY_STEP,
  addItem,
  addLesson,
  aiLabel,
  asGv,
  createCurriculum,
  devClass,
  lessonRow,
  otherPage,
  publishLesson,
  shot,
  uid,
} from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-10.4] [002:AC-11.2] [002:AC-11.3] TC-039 nhãn AI, mọi thao tác vẫn dùng được, HV chỉ thấy nội dung đã lưu', async ({
  page,
  browser,
}) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-039 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  const s = await addItem(page, l.id, 'lesson', { title: 'S1', content: READY_STEP });
  await publishLesson(page, l.id, [s]);
  await devClass(page, c.id, 'Lớp TC-039', { studentEmails: ['hv1@sat.dev'] });
  await aiLabel(page, l.id, 'generating', 45);

  await page.goto(`/gv/giao-trinh/${c.id}`);
  await expect(lessonRow(page, 'Bài 1').getByRole('button', { name: 'AI · Đang tạo 45%' })).toBeVisible();
  await page.getByRole('link', { name: 'Bài 1' }).click();
  await expect(page.getByRole('button', { name: 'AI · Đang tạo 45%' })).toBeVisible();
  await shot(page, 'TC-039', 1);

  // Every action keeps working while AI content is being generated.
  await page.getByRole('button', { name: 'Soạn thủ công' }).click();
  await page.getByRole('button', { name: 'Thêm bước học' }).click();
  const s2 = page.getByRole('region', { name: 'Bước học 2' });
  await s2.getByLabel('Tên').fill('S2');
  await s2.getByLabel('Nội dung khối 1').fill('谢谢 xièxie');
  await s2.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(page.getByText(/^Đã lưu lúc \d{2}:\d{2}$/).first()).toBeVisible();
  await s2.getByRole('button', { name: 'Lên trên' }).click();
  await expect(page.getByText('Đã chuyển tới vị trí 1/2 · Đã lưu', { exact: true }).first()).toBeVisible();
  await page.getByRole('region', { name: 'Bước học 1' }).getByRole('button', { name: 'Xuất bản' }).click();
  await expect(page.getByText(/^Đã xuất bản · Đã lưu lúc/)).toBeVisible();
  await page.getByRole('button', { name: 'Về Soạn bài' }).click();
  await page.getByRole('button', { name: 'Thao tác với bài', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Đổi tên' }).click();
  await page.getByRole('dialog', { name: 'Đổi tên bài' }).getByLabel('Tên bài').fill('Bài 1 AI');
  await page.getByRole('dialog', { name: 'Đổi tên bài' }).getByRole('button', { name: 'Lưu' }).click();
  await expect(page.getByText('Đã đổi tên bài', { exact: true })).toBeVisible();
  const manual = page.getByRole('region', { name: 'Thủ công' });
  await expect(manual.getByRole('region', { name: 'Phần Bài học' })).toContainText('2 bước học · 2 đã xuất bản');

  const hv = await otherPage(browser, 'HV');
  const seen = await hv.request.get(`/api/learn/lessons/${l.id}`).then((r) => r.json());
  expect(seen.name).toBe('Bài 1 AI');
  expect(seen.sections.lesson.map((i: { title: string }) => i.title)).toEqual(['S2', 'S1']);
  expect(JSON.stringify(seen)).not.toMatch(/"ai"/);
  await hv.context().close();

  await aiLabel(page, l.id, 'review');
  await page.reload();
  await expect(page.getByRole('button', { name: 'AI · Chờ duyệt' })).toBeVisible();
  await aiLabel(page, l.id, null);
  await page.reload();
  await expect(page.getByRole('button', { name: /^AI · / })).toHaveCount(0);
});

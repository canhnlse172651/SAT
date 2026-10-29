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
  publishLesson,
  shot,
  uid,
} from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

const png = () => {
  const b = Buffer.alloc(2048, 0);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b);
  return b;
};

test('[002:AC-15.2] [002:AC-15.3] [002:AC-15.4] TC-061 nhân bản giáo trình: đầy đủ, giữ trạng thái, độc lập', async ({
  page,
}) => {
  const name = `TC-061 ${uid()}`;
  await asGv(page);
  const c = await createCurriculum(page, name, 1, 'Mô tả TC-061 你好');
  const cover = await page.request
    .post('/api/curricula/covers', { data: png(), headers: { 'Content-Type': 'image/png', Origin: 'http://127.0.0.1:4173' } })
    .then((r) => r.json());
  await ok(page, 'PATCH', `/curricula/${c.id}`, { expectedVersion: c.version, coverFileId: cover.fileId });
  const b1 = await addLesson(page, c.id, 'Bài 1');
  const b2 = await addLesson(page, c.id, 'Bài 2');
  const s = await addItem(page, b1.id, 'lesson', { title: 'Bước xuất bản', content: READY_STEP });
  await publishLesson(page, b1.id, [s]);
  // An approved AI set (published, "AI tạo") and an archived set with learning data.
  const items = [{ title: 'Bộ AI', content: READY_SET }];
  const p = await ok(page, 'POST', '/dev/curriculum/ai-approve/preview', { lessonId: b1.id, section: 'exercise', items });
  await ok(page, 'POST', '/dev/curriculum/ai-approve', { lessonId: b1.id, section: 'exercise', items, token: p.token });
  const old = await addItem(page, b1.id, 'exercise', { title: 'Bộ lưu trữ', content: READY_SET, archive: true });
  await learningData(page, old);
  await addItem(page, b2.id, 'lesson', { title: 'Bước nháp', content: READY_STEP });
  await devClass(page, c.id, 'Lớp TC-061');
  await ok(page, 'POST', `/curricula/${c.id}/archive`);
  const originalB1 = await getLesson(page, b1.id);

  await page.goto(`/gv/giao-trinh/${c.id}`);
  await page.getByRole('button', { name: 'Nhân bản', exact: true }).click();
  const dlg = page.getByRole('dialog', { name: 'Nhân bản giáo trình' });
  await dlg.getByRole('button', { name: 'HSK3', exact: true }).click();
  await dlg.getByRole('button', { name: 'Nhân bản' }).click();
  await expect(page.getByText('Đã nhân bản giáo trình', { exact: true })).toBeVisible();
  await expect(page).not.toHaveURL(new RegExp(c.id));
  const head = page.getByRole('heading', { level: 1 });
  await expect(head).toContainText(`${name} (bản sao)`);
  await expect(head).toContainText('HSK3');
  await expect(head).not.toContainText('Đã lưu trữ');
  await expect(page.getByText('Mô tả TC-061 你好')).toBeVisible();
  await expect(page.getByRole('img', { name: `Ảnh bìa ${name} (bản sao)` })).toHaveAttribute('src', `/api/files/${cover.fileId}`);
  await expect(page.getByRole('button', { name: 'Dùng bởi 0 lớp' })).toBeVisible();
  await expect(page.locator('.cur-row__name')).toHaveText(['Bài 1', 'Bài 2']);
  await expect(page.getByText('Có dữ liệu học viên')).toHaveCount(0);
  await shot(page, 'TC-061', 1);

  const copyId = page.url().split('/').pop()!;
  const copy = await ok(page, 'GET', `/curricula/${copyId}`);
  expect(copy.lessons.map((l: { name: string; status: string }) => [l.name, l.status])).toEqual([
    ['Bài 1', 'published'],
    ['Bài 2', 'draft'],
  ]);
  const cb1 = await getLesson(page, copy.lessons[0].id);
  expect(cb1.items.map((i: { title: string; status: string; ai: boolean }) => [i.title, i.status, i.ai])).toEqual([
    ['Bước xuất bản', 'published', false],
    ['Bộ AI', 'published', true],
  ]);

  // Changing the copy leaves the original untouched.
  const cb2 = await getLesson(page, copy.lessons[1].id);
  await ok(page, 'POST', `/lessons/${cb2.id}/publish`, { expectedVersion: cb2.version, itemIds: [cb2.items[0].id] });
  await ok(page, 'DELETE', `/lessons/${cb1.id}`);
  const orig = await ok(page, 'GET', `/curricula/${c.id}`);
  expect(orig.lessons.map((l: { name: string; status: string }) => [l.name, l.status])).toEqual([
    ['Bài 1', 'published'],
    ['Bài 2', 'draft'],
  ]);
  expect((await getLesson(page, b1.id)).items).toEqual(originalB1.items);
  expect(orig.archived).toBe(true);
});

import { test, expect } from '@playwright/test';
import {
  ORIGIN,
  READY_STEP,
  addItem,
  addLesson,
  asGv,
  createCurriculum,
  devClass,
  ok,
  otherPage,
  publishLesson,
  uid,
} from './helpers';

const png = () => {
  const b = Buffer.alloc(1024, 0);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b);
  return b;
};

test('[002:AC-2.4] [002:AC-10.6] TC-076 thông tin giáo trình mới hiện cho HV các lớp đang dùng', async ({ page, browser }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-076 ${uid()}`, 1, 'Mô tả cũ');
  const l = await addLesson(page, c.id, 'Bài 1');
  const s = await addItem(page, l.id, 'lesson', { title: 'S', content: READY_STEP });
  await publishLesson(page, l.id, [s]);
  await devClass(page, c.id, 'Lớp A', { studentEmails: ['hv1@sat.dev'] });
  await devClass(page, c.id, 'Lớp B');
  const hv = await otherPage(browser, 'HV');
  const before = await hv.request.get(`/api/learn/curricula/${c.id}`).then((r) => r.json());

  const cover = await page.request
    .post('/api/curricula/covers', { data: png(), headers: { 'Content-Type': 'image/png', Origin: ORIGIN } })
    .then((r) => r.json());
  await ok(page, 'PATCH', `/curricula/${c.id}`, {
    expectedVersion: c.version,
    name: `${c.name} mới`,
    description: 'Mô tả mới',
    coverFileId: cover.fileId,
  });

  const after = await hv.request.get(`/api/learn/curricula/${c.id}`).then((r) => r.json());
  expect(after.name).toBe(`${c.name} mới`);
  expect(after.description).toBe('Mô tả mới');
  expect(after.coverUrl).toBe(`/api/files/${cover.fileId}`);
  expect(after.lessons).toEqual(before.lessons);
  expect((await hv.request.get(after.coverUrl)).status()).toBe(200);
  await hv.context().close();
});

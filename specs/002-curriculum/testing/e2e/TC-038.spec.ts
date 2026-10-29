import { test, expect } from '@playwright/test';
import {
  READY_SET,
  READY_STEP,
  addItem,
  addLesson,
  asGv,
  createCurriculum,
  devClass,
  ok,
  otherPage,
  publishLesson,
  shot,
  uid,
} from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('[002:AC-10.5] [002:AC-17.3] TC-038 HV mở nội dung không được thấy: 404 đồng nhất, trang quản trị chuyển về S01, A05', async ({
  page,
  browser,
}) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-038 ${uid()}`, 1);
  const b1 = await addLesson(page, c.id, 'Bài 1');
  const s = await addItem(page, b1.id, 'lesson', { title: 'S xuất bản', content: READY_STEP });
  const d = await addItem(page, b1.id, 'lesson', { title: 'D nháp', content: READY_STEP });
  const a = await addItem(page, b1.id, 'exercise', { title: 'A lưu trữ', content: READY_SET, archive: true });
  const gone = await addItem(page, b1.id, 'lesson', { title: 'Sẽ xóa', content: READY_STEP });
  await publishLesson(page, b1.id, [s]);
  await ok(page, 'DELETE', `/lessons/${b1.id}/items/${gone}`);
  const b2 = await addLesson(page, c.id, 'Bài 2 nháp');
  await addItem(page, b2.id, 'lesson', { title: 'X', content: READY_STEP, publish: true });
  await devClass(page, c.id, 'Lớp TC-038', { studentEmails: ['hv1@sat.dev'] });
  const other = await createCurriculum(page, `TC-038 Khác ${uid()}`, 1);
  const ob = await addLesson(page, other.id, 'Bài khác');
  const os = await addItem(page, ob.id, 'lesson', { title: 'Y', content: READY_STEP });
  await publishLesson(page, ob.id, [os]);

  const hv = await otherPage(browser, 'HV');
  await hv.setViewportSize({ width: 390, height: 844 });
  const bodies: string[] = [];
  for (const path of [
    `/api/learn/lessons/${b2.id}`,
    `/api/learn/items/${d}`,
    `/api/learn/items/${a}`,
    `/api/learn/lessons/${ob.id}`,
    `/api/learn/items/${gone}`,
  ]) {
    const r = await hv.request.get(path);
    expect(r.status(), path).toBe(404);
    const body = await r.json();
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Không tìm thấy nội dung bạn yêu cầu.');
    bodies.push(JSON.stringify({ ...body.error, requestId: undefined }));
  }
  expect(new Set(bodies).size).toBe(1);
  for (const leak of ['Bài 2 nháp', 'D nháp', 'A lưu trữ', 'Bài khác', 'Sẽ xóa']) {
    expect(bodies.join(' ')).not.toContain(leak);
  }

  for (const path of [
    '/gv/giao-trinh',
    `/gv/giao-trinh/${c.id}`,
    `/gv/giao-trinh/${c.id}/bai/${b1.id}`,
    `/gv/giao-trinh/${c.id}/bai/${b1.id}/bai-hoc`,
    `/gv/giao-trinh/${c.id}/bai/${b1.id}/xem-truoc`,
  ]) {
    await hv.goto(path);
    await expect(hv, path).toHaveURL(/\/hv$/);
    await expect(hv.getByText(c.name)).toHaveCount(0);
  }
  await shot(hv, 'TC-038', 1);

  // The HV lesson page (S11, module 003) for a Bài the HV may not see shows A05.
  await hv.goto(`/hv/lop/x/bai/${b2.id}`);
  await shot(hv, 'TC-038', 2);
  await expect(hv.getByRole('heading', { name: 'Không tìm thấy nội dung bạn yêu cầu.' })).toBeVisible();
  await hv.context().close();
});

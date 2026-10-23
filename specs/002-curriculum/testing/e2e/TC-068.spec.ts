import { test, expect } from '@playwright/test';
import {
  ORIGIN,
  READY_STEP,
  addItem,
  addLesson,
  asGv,
  createCurriculum,
  getLesson,
  ok,
  registerGv,
  shot,
  uid,
} from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-17.1] [002:AC-17.2] TC-068 GV workspace khác: A05 và 404 đồng nhất, không đổi dữ liệu (NFR-6)', async ({
  page,
  browser,
}) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-068 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài bí mật');
  const s = await addItem(page, l.id, 'lesson', { title: 'Mục bí mật', content: READY_STEP });
  const before = await ok(page, 'GET', `/curricula/${c.id}`);
  const beforeLesson = await getLesson(page, l.id);

  const ctx = await browser.newContext({ baseURL: ORIGIN, viewport: { width: 1280, height: 800 } });
  const b = await ctx.newPage();
  await b.goto('/');
  await registerGv(b, 'Cô Bình');

  for (const path of [
    `/gv/giao-trinh/${c.id}`,
    `/gv/giao-trinh/${c.id}/bai/${l.id}`,
    `/gv/giao-trinh/${c.id}/bai/${l.id}/bai-hoc`,
    `/gv/giao-trinh/${c.id}/bai/${l.id}/thu-cong`,
    `/gv/giao-trinh/${c.id}/bai/${l.id}/xem-truoc`,
  ]) {
    await b.goto(path);
    await expect(b.getByRole('heading', { name: 'Không tìm thấy nội dung bạn yêu cầu.' }), path).toBeVisible();
    await expect(b.getByText(c.name)).toHaveCount(0);
    await expect(b.getByText('Bài bí mật')).toHaveCount(0);
  }
  await shot(b, 'TC-068', 1);

  const v = { expectedVersion: 1 };
  const writes: [string, string, unknown?][] = [
    ['GET', `/curricula/${c.id}`],
    ['PATCH', `/curricula/${c.id}`, { ...v, name: 'Chiếm' }],
    ['DELETE', `/curricula/${c.id}`],
    ['POST', `/curricula/${c.id}/archive`],
    ['POST', `/curricula/${c.id}/restore`],
    ['POST', `/curricula/${c.id}/duplicate`, { name: 'Chiếm bản sao', hsk: 1 }],
    ['POST', `/curricula/${c.id}/lessons`, { name: 'Bài lạ' }],
    ['PUT', `/curricula/${c.id}/lesson-order`, { expectedOrder: [l.id], order: [l.id] }],
    ['GET', `/curricula/${c.id}/classes`],
    ['GET', `/lessons/${l.id}`],
    ['PATCH', `/lessons/${l.id}`, { ...v, name: 'Đổi' }],
    ['POST', `/lessons/${l.id}/publish`, { ...v, itemIds: [s] }],
    ['POST', `/lessons/${l.id}/duplicate`],
    ['DELETE', `/lessons/${l.id}`],
    ['POST', `/lessons/${l.id}/items`, { section: 'lesson' }],
    ['PUT', `/lessons/${l.id}/items/${s}`, { ...v, title: 'x', content: READY_STEP }],
    ['POST', `/lessons/${l.id}/items/${s}/publish`, { ...v, title: 'x', content: READY_STEP }],
    ['POST', `/lessons/${l.id}/items/${s}/archive`, v],
    ['POST', `/lessons/${l.id}/items/${s}/restore`, v],
    ['POST', `/lessons/${l.id}/items/${s}/move`, { direction: 'up', expectedOrder: [s] }],
    ['DELETE', `/lessons/${l.id}/items/${s}`],
  ];
  const bodies = new Set<string>();
  for (const [method, path, data] of writes) {
    const res = await b.request.fetch(`/api${path}`, {
      method,
      ...(data === undefined ? {} : { data }),
      headers: { Origin: ORIGIN },
    });
    expect(res.status(), `${method} ${path}`).toBe(404);
    const body = await res.json();
    bodies.add(`${body.error.code}|${body.error.message}`);
  }
  expect([...bodies]).toEqual(['NOT_FOUND|Không tìm thấy nội dung bạn yêu cầu.']);
  for (const path of ['/curricula/abc', '/lessons/123', `/lessons/${l.id}/items/zz`]) {
    const res = await b.request.get(`/api${path}`);
    expect(res.status(), path).toBe(404);
  }
  await ctx.close();

  expect(await ok(page, 'GET', `/curricula/${c.id}`)).toEqual(before);
  expect(await getLesson(page, l.id)).toEqual(beforeLesson);
});

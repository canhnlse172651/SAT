import { expect, test } from '@playwright/test';
import {
  ORIGIN,
  api,
  fileBlock,
  gvPage,
  hvPage,
  newClass,
  newCurriculum,
  newLesson,
  png,
  publishLesson,
  publishedStep,
  studentIds,
  upload,
} from './helpers';

test('[004:NFR-6] TC-104 a copied file link: no use without sign-in, by another HV or after 60 minutes', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [hv1, , hv3] = await studentIds(page);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const img = await upload(page, 'image', 'anh.png', png());
  const step = await publishedStep(page, les.id, 'Ảnh', [fileBlock('image', img.body)]);
  await publishLesson(page, les.id);
  const cls = await newClass(page, cur.id, [hv1!, hv3!]);
  const hv = await hvPage(browser, hv1);
  const view = await api(hv.page, 'GET', `/api/learn/classes/${cls.id}/steps/${step}`);
  const url: string = view.step.blocks[0].file.url;
  expect((await hv.page.request.get(url)).status()).toBe(200);

  const anon = await browser.newContext({ baseURL: ORIGIN });
  expect((await anon.request.get(url)).status()).toBe(401);
  const classmate = await hvPage(browser, hv3);
  expect((await classmate.page.request.get(url)).status()).toBe(404);

  await api(page, 'POST', '/api/dev/clock', { advanceMs: 61 * 60_000 });
  try {
    expect((await hv.page.request.get(url)).status()).toBe(404);
  } finally {
    await page.request.delete('/api/dev/clock', { headers: { Origin: ORIGIN } });
  }
});

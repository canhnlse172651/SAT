import { expect, test } from '@playwright/test';
import {
  ORIGIN,
  addStep,
  api,
  fileBlock,
  freshGvPage,
  gvPage,
  hideSection,
  hvPage,
  newClass,
  newCurriculum,
  newLesson,
  png,
  publishLesson,
  publishedStep,
  studentIds,
  text,
  upload,
} from './helpers';

const NOT_FOUND = 'Không tìm thấy nội dung bạn yêu cầu.';

test('[004:AC-13.2] [004:AC-13.4] [004:NFR-6] TC-077 only an HV meeting every condition gets the step and its files', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const [hv1, hv2, hv3] = await studentIds(gv);
  const cur = await newCurriculum(gv);
  const les = await newLesson(gv, cur.id);
  const img = await upload(gv, 'image', 'anh.png', png());
  const step = await publishedStep(gv, les.id, 'Bước mở', [text('<p>开</p>'), fileBlock('image', img.body)]);
  const draftStep = await addStep(gv, les.id);
  await publishLesson(gv, les.id);
  const draftLes = await newLesson(gv, cur.id, 'Bài nháp');
  const inDraftLesson = await publishedStep(gv, draftLes.id, 'Trong bài nháp', [text('<p>草</p>')]);
  const cls = await newClass(gv, cur.id, [hv1!, hv3!]);
  const hiddenCls = await newClass(gv, cur.id, [hv3!]);
  await hideSection(gv, hiddenCls.id, les.id, 'lesson');

  const member = await hvPage(browser, hv1);
  const view = await api(member.page, 'GET', `/api/learn/classes/${cls.id}/steps/${step}`);
  expect(view.step.title).toBe('Bước mở');
  const fileUrl: string = view.step.blocks[1].file.url;
  expect((await member.page.request.get(fileUrl)).status()).toBe(200);
  // The generic files route never serves lesson media to an HV.
  expect((await member.page.request.get(`/api/files/${img.body.id}`)).status()).toBe(404);

  const refused = async (page: typeof gv, path: string) => {
    const res = await page.request.get(path);
    expect(res.status(), path).toBe(404);
    expect.soft((await res.json()).error.message, path).toBe(NOT_FOUND);
  };
  await refused(member.page, `/api/learn/classes/${cls.id}/steps/${draftStep}`);
  await refused(member.page, `/api/learn/classes/${cls.id}/steps/${inDraftLesson}`);
  const hidden = await hvPage(browser, hv3);
  await refused(hidden.page, `/api/learn/classes/${hiddenCls.id}/steps/${step}`);
  const outsider = await hvPage(browser, hv2);
  await refused(outsider.page, `/api/learn/classes/${cls.id}/steps/${step}`);
  expect((await outsider.page.request.get(fileUrl)).status()).toBe(404);
  // Another GV: the HV routes answer the uniform 404 for a wrong role (no content, no hint of existence).
  const otherGv = await freshGvPage(browser);
  const asGv = await otherGv.page.request.get(`/api/learn/classes/${cls.id}/steps/${step}`);
  expect(asGv.status()).toBe(404);
  expect(await asGv.text()).not.toContain('Bước mở');
  // Not signed in.
  const anon = await browser.newContext({ baseURL: ORIGIN });
  expect((await anon.request.get(`/api/learn/classes/${cls.id}/steps/${step}`)).status()).toBe(401);
  expect((await anon.request.get(fileUrl)).status()).toBe(401);
  // A locked account loses its session.
  const lockedHv = await hvPage(browser, hv3);
  await api(gv, 'POST', `/api/students/${hv3}/lock`);
  expect((await lockedHv.page.request.get(`/api/learn/classes/${cls.id}/steps/${step}`)).status()).toBe(401);
  await api(gv, 'POST', `/api/students/${hv3}/unlock`);
});

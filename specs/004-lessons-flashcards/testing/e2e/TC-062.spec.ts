import { expect, test } from '@playwright/test';
import {
  addSet,
  aiApprove,
  api,
  deck,
  fileBlock,
  freshGvPage,
  getLesson,
  hvPage,
  linkPractice,
  markCard,
  newClass,
  newCurriculum,
  newLesson,
  png,
  publishLesson,
  publishSet,
  publishedStep,
  text,
  upload,
} from './helpers';

test('[004:AC-9.5] TC-062 replaced steps are deleted with their files, marks and practice links', async ({ browser }) => {
  const { page } = await freshGvPage(browser);
  const hvAccount = await api(page, 'POST', '/api/students', { displayName: 'HV QA', email: `hvqa+${Date.now()}@sat.dev` });
  await api(page, 'POST', `/api/students/${hvAccount.id}/activate`);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const img = await upload(page, 'image', 'anh.png', png());
  const old = await publishedStep(page, les.id, 'Cũ', [fileBlock('image', img.body), deck([{ id: 'c1', front: '你', meaning: 'bạn' }])]);
  const set = await addSet(page, les.id);
  await publishSet(page, les.id, set, 'Bộ liên kết');
  await linkPractice(page, set, old);
  await publishLesson(page, les.id);
  const cls = await newClass(page, cur.id, [hvAccount.id]);
  const hv = await hvPage(browser, hvAccount.id);
  await markCard(hv.page, cls.id, old, 'k', 'c1', 'known');
  const used = async () => (await api<{ usedBytes: number }>(page, 'GET', '/api/steps/storage')).usedBytes;
  const before = await used();

  await aiApprove(page, les.id, [{ title: 'Mới', content: { goal: '', blocks: [text('<p>新</p>')] } }]);
  const lesson = await getLesson(page, les.id);
  expect(lesson.items.some((i: { id: string }) => i.id === old)).toBe(false);
  expect(lesson.items.some((i: { id: string }) => i.id === set)).toBe(true);
  expect(await used()).toBe(before - img.body.size);
  const info = await api(page, 'GET', `/api/steps/lessons/${les.id}/info`);
  expect(Object.values(info.practice).flat()).toEqual([]);
  // The old step (and its marks) is gone for the HV.
  const gone = await api(hv.page, 'GET', `/api/learn/classes/${cls.id}/steps/${old}`, undefined, 404);
  expect(gone.error.code).toBe('NOT_FOUND');
});

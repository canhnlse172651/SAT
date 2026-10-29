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
  ok,
  otherPage,
  publishLesson,
  shot,
  uid,
} from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-8.3] [002:AC-10.2] TC-032 cùng một thứ tự cho T07, T21 và HV', async ({ page, browser }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-032 ${uid()}`, 1);
  const ids: Record<string, string> = {};
  const lessons: string[] = [];
  for (const n of ['Bài 1', 'Bài 2']) {
    const l = await addLesson(page, c.id, n);
    lessons.push(l.id);
    for (const t of ['bước a', 'bước b']) ids[`${n} ${t}`] = await addItem(page, l.id, 'lesson', { title: `${n} ${t}`, content: READY_STEP });
    for (const t of ['bộ a', 'bộ b']) ids[`${n} ${t}`] = await addItem(page, l.id, 'exercise', { title: `${n} ${t}`, content: READY_SET });
    await publishLesson(page, l.id, Object.entries(ids).filter(([k]) => k.startsWith(n)).map(([, v]) => v));
  }
  await devClass(page, c.id, 'Lớp TC-032', { studentEmails: ['hv1@sat.dev'] });

  // GV: Bài 2 first, then swap the two steps of Bài 2.
  await ok(page, 'PUT', `/curricula/${c.id}/lesson-order`, { expectedOrder: lessons, order: [lessons[1], lessons[0]] });
  const l2 = await getLesson(page, lessons[1]!);
  const stepOrder = l2.items.filter((i: { section: string }) => i.section === 'lesson').map((i: { id: string }) => i.id);
  await ok(page, 'POST', `/lessons/${lessons[1]}/items/${ids['Bài 2 bước b']}/move`, { direction: 'up', expectedOrder: stepOrder });

  const hv = await otherPage(browser, 'HV');
  const seen = await hv.request.get(`/api/learn/curricula/${c.id}`).then((r) => r.json());
  const titles = (l: { sections: Record<string, { title: string }[]> }, s: string) => l.sections[s]!.map((i) => i.title);
  expect(seen.lessons.map((l: { name: string }) => l.name)).toEqual(['Bài 2', 'Bài 1']);
  expect(titles(seen.lessons[0], 'lesson')).toEqual(['Bài 2 bước b', 'Bài 2 bước a']);
  expect(titles(seen.lessons[0], 'exercise')).toEqual(['Bài 2 bộ a', 'Bài 2 bộ b']);
  expect(Object.keys(seen.lessons[0].sections)).toEqual(['lesson', 'exercise']);
  await hv.context().close();

  await page.goto(`/gv/giao-trinh/${c.id}/bai/${lessons[1]}/bai-hoc`);
  await expect(page.getByRole('region', { name: 'Bước học 1' }).getByLabel('Tên')).toHaveValue('Bài 2 bước b');
  await page.goto(`/gv/giao-trinh/${c.id}/bai/${lessons[1]}/xem-truoc`);
  await expect(page.getByRole('article')).toHaveText([/Bài 2 bước b/, /Bài 2 bước a/]);
  await page.getByRole('tab', { name: /Bài tập/ }).click();
  await expect(page.getByRole('article')).toHaveText([/Bài 2 bộ a/, /Bài 2 bộ b/]);
  await shot(page, 'TC-032', 1);
});

import { expect, test } from '@playwright/test';
import {
  S03,
  S04,
  api,
  archiveStep,
  deck,
  evidence,
  gvPage,
  hvPage,
  newClass,
  newCurriculum,
  newLesson,
  publishLesson,
  publishedStep,
  text,
} from './helpers';

const GONE = 'Bước học này hiện không còn khả dụng.';

test('[004:AC-13.5] TC-080 the next action after the step became unavailable', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const one = await publishedStep(page, les.id, 'Bước 1', [
    text('<p>一</p>'),
    deck([{ id: 'c1', front: '你', meaning: 'bạn' }]),
  ]);
  const two = await publishedStep(page, les.id, 'Bước 2', [text('<p>二</p>')]);
  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  const cls = await newClass(page, cur.id, [hv.who.user.id]);

  // 1. Step archived while open → "Tiếp" → S11 of the Bài.
  await hv.page.goto(S03(cls.id, one));
  await expect(hv.page.getByRole('heading', { name: 'Bước 1' })).toBeVisible();
  await archiveStep(page, les.id, one);
  await hv.page.getByRole('button', { name: /Tiếp ›/ }).click();
  await expect.soft(hv.page.getByText(GONE)).toBeVisible();
  await expect.soft(hv.page).toHaveURL(new RegExp(`/hv/lop/${cls.id}/bai/${les.id}$`));
  await evidence(hv.page, 'TC-080', 1);

  // 2. The whole Bài hidden while S04 is open → "Đã thuộc" → S02.
  await api(page, 'POST', `/api/lessons/${les.id}/items/${one}/restore`, {
    expectedVersion: (await api(page, 'GET', `/api/lessons/${les.id}`)).items.find((i: { id: string }) => i.id === one).version,
  });
  await hv.page.goto(S04(cls.id, one, 'k'));
  await expect(hv.page.getByText('Thẻ 1/1')).toBeVisible();
  await api(page, 'PUT', `/api/classes/${cls.id}/visibility`, { hidden: true, scope: { kind: 'lesson', lessonId: les.id } });
  await hv.page.getByRole('button', { name: 'Đã thuộc' }).click();
  await expect(hv.page.getByText(GONE)).toBeVisible();
  await expect(hv.page).toHaveURL(new RegExp(`/hv/lop/${cls.id}$`));
  await evidence(hv.page, 'TC-080', 2);
  await api(page, 'PUT', `/api/classes/${cls.id}/visibility`, { hidden: false, scope: { kind: 'lesson', lessonId: les.id } });
  const marks = await api(hv.page, 'GET', `/api/learn/classes/${cls.id}/steps/${one}`);
  expect(marks.marks).toEqual({});

  // 3. Removed from the class while S03 is open → "Trước" → S01.
  await hv.page.goto(S03(cls.id, two));
  await expect(hv.page.getByRole('heading', { name: 'Bước 2' })).toBeVisible();
  await api(page, 'DELETE', `/api/classes/${cls.id}/students/${hv.who.user.id}`);
  await hv.page.getByRole('button', { name: /‹ Trước/ }).click();
  await expect(hv.page.getByText(GONE)).toBeVisible();
  await expect(hv.page).toHaveURL(/\/hv$/);
  await evidence(hv.page, 'TC-080', 3);
});

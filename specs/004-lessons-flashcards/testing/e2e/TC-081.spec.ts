import { expect, test } from '@playwright/test';
import {
  S03,
  evidence,
  gvPage,
  hvPage,
  newClass,
  newCurriculum,
  newLesson,
  publishLesson,
  publishedStep,
  saveStep,
  text,
} from './helpers';

test('[004:AC-13.6] TC-081 the HV keeps the version open; the new one at the next opening', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const step = await publishedStep(page, les.id, 'Bước', [text('<p>Bản cũ</p>')]);
  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  const cls = await newClass(page, cur.id, [hv.who.user.id]);
  await hv.page.goto(S03(cls.id, step));
  await expect(hv.page.getByText('Bản cũ')).toBeVisible();
  await saveStep(page, les.id, step, 'Bước', { goal: '', blocks: [text('<p>Bản mới</p>')] });
  await hv.page.waitForTimeout(3000);
  await expect(hv.page.getByText('Bản cũ')).toBeVisible();
  await expect(hv.page.getByText('Bản mới')).toHaveCount(0);
  await evidence(hv.page, 'TC-081', 1);
  await hv.page.goto(S03(cls.id, step));
  await expect(hv.page.getByText('Bản mới')).toBeVisible();
  await evidence(hv.page, 'TC-081', 2);
});

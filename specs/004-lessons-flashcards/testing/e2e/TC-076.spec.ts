import { expect, test } from '@playwright/test';
import { T07, addStep, deck, evidence, freshGvPage, gvPage, newCurriculum, newLesson, saveStep } from './helpers';

test('[004:AC-13.1] TC-076 another GV gets A05 for T07 / T08 of a Bài that is not theirs', async ({ browser }) => {
  const { page: owner } = await gvPage(browser);
  const cur = await newCurriculum(owner);
  const les = await newLesson(owner, cur.id);
  const id = await addStep(owner, les.id);
  await saveStep(owner, les.id, id, 'Bí mật', { goal: '', blocks: [deck([{ id: 'c1', front: '秘', meaning: 'bí mật' }])] });

  const { page } = await freshGvPage(browser);
  for (const path of [
    T07(cur.id, les.id),
    `/gv/giao-trinh/${cur.id}/bai/${les.id}/the-tu`,
    T07(cur.id, '64b7f0c2a1b2c3d4e5f60718'),
  ]) {
    await page.goto(path);
    await expect(page.getByText('Không tìm thấy nội dung bạn yêu cầu.')).toBeVisible();
    await expect(page.getByText('Bí mật')).toHaveCount(0);
    await expect(page.getByText('秘')).toHaveCount(0);
  }
  await evidence(page, 'TC-076');
});

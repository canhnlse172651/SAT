import { expect, test } from '@playwright/test';
import {
  S03,
  S04,
  S11,
  addStep,
  aiApprove,
  deck,
  evidence,
  getLesson,
  gvPage,
  hvPage,
  newClass,
  newCurriculum,
  newLesson,
  publishLesson,
  publishStep,
  text,
} from './helpers';

test('[004:AC-9.6] TC-063 the HV never sees "AI tạo"', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await aiApprove(page, les.id, [
    { title: 'Bước AI', content: { goal: '', blocks: [text('<p>AI</p>'), deck([{ id: 'c1', front: '你', meaning: 'bạn' }])] } },
  ]);
  const gvStep = await addStep(page, les.id);
  await publishStep(page, les.id, gvStep, 'Bước GV', { goal: '', blocks: [text('<p>GV</p>')] });
  await publishLesson(page, les.id);
  const aiStep = (await getLesson(page, les.id)).items.find((i: { ai: boolean }) => i.ai).id;
  const hv = await hvPage(browser);
  const cls = await newClass(page, cur.id, [hv.who.user.id]);

  for (const path of [S11(cls.id, les.id), S03(cls.id, aiStep), S03(cls.id, gvStep), S04(cls.id, aiStep, 'k')]) {
    await hv.page.goto(path);
    await expect(hv.page.locator('main')).not.toBeEmpty();
    await expect(hv.page.getByText('AI tạo')).toHaveCount(0);
    await expect(hv.page.getByText(/\bAI\b.*tạo/)).toHaveCount(0);
  }
  await hv.page.goto(S03(cls.id, aiStep));
  await expect(hv.page.getByRole('heading', { name: 'Bước AI' })).toBeVisible();
  await evidence(hv.page, 'TC-063');
});

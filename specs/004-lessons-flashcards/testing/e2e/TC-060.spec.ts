import { expect, test } from '@playwright/test';
import {
  S11,
  T07,
  api,
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

test('[004:AC-9.2] TC-060 AI content not approved shows nowhere', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await publishedStep(page, les.id, 'Bước GV 1', [text('<p>一</p>')]);
  await publishedStep(page, les.id, 'Bước GV 2', [text('<p>二</p>')]);
  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  const cls = await newClass(page, cur.id, [hv.who.user.id]);
  await api(page, 'POST', '/api/dev/curriculum/ai-approve/preview', {
    lessonId: les.id,
    section: 'lesson',
    items: [{ title: 'Bước AI chưa duyệt', content: { goal: '', blocks: [text('<p>AI</p>')] } }],
  });
  await page.goto(T07(cur.id, les.id));
  await expect(page.getByRole('region', { name: /^Bước học \d+$/ })).toHaveCount(2);
  await expect(page.getByRole('toolbar', { name: 'Phần Bài học' })).toContainText('2 bước học');
  await page.goto(`/gv/giao-trinh/${cur.id}/bai/${les.id}`);
  await expect(page.getByText('2 bước học · 2 đã xuất bản')).toBeVisible();
  await expect(page.getByText('Bước AI chưa duyệt')).toHaveCount(0);
  await hv.page.goto(S11(cls.id, les.id));
  await expect(hv.page.getByText('Bước GV 2')).toBeVisible();
  await expect(hv.page.getByText('Bước AI chưa duyệt')).toHaveCount(0);
  await evidence(hv.page, 'TC-060');
});

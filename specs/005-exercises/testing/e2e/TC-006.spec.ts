import { expect, test } from '@playwright/test';
import {
  S05, addItem, evidence, gvPage, hvPage, mcq, newClass, newCurriculum, newLesson, publishLesson, publishedSet,
  publishedStep, saveItem, set, setDeadline, studentIds, vnToday,
} from './helpers';

test('[005:AC-1.5] TC-006 "Luyện tập cho" only for a step the HV can see', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const cur = await newCurriculum(gv);
  const les = await newLesson(gv, cur.id);
  const s = await publishedStep(gv, les.id, 'Chào hỏi');
  const draft = await addItem(gv, les.id, 'lesson');
  await saveItem(gv, les.id, draft, 'Bước nháp', { goal: '', blocks: [] });
  const q = () => [mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])];
  const x = await publishedSet(gv, les.id, 'Bộ X', set(q(), '', s));
  const y = await publishedSet(gv, les.id, 'Bộ Y', set(q(), '', draft));
  await publishLesson(gv, les.id);
  const [hvId] = await studentIds(gv);
  const cls = await newClass(gv, cur.id, [hvId!]);
  await setDeadline(gv, cls.id, x, vnToday(5));
  await setDeadline(gv, cls.id, y, vnToday(5));

  const { page } = await hvPage(browser, hvId!);
  // 1. S05 of X.
  await page.goto(S05(cls.id, x));
  const link = page.getByRole('link', { name: 'Luyện tập cho: Chào hỏi' });
  await expect(link).toBeVisible();
  await evidence(page, 'TC-006', 1);
  // 2. The line opens S03 of S.
  await link.click();
  await expect(page).toHaveURL(new RegExp(`/hv/lop/${cls.id}/buoc/${s}$`));
  // 3. S05 of Y: no such line.
  await page.goto(S05(cls.id, y));
  await expect(page.getByRole('heading', { name: 'Bộ Y' })).toBeVisible();
  await expect(page.getByText(/Luyện tập cho:/)).toHaveCount(0);
  await evidence(page, 'TC-006', 2);
});

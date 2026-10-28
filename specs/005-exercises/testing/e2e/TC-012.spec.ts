import { expect, test } from '@playwright/test';
import {
  T09, evidence, gvPage, hvPage, mcq, newCurriculum, newLesson, otherGvPage, publishedSet, set, studentIds,
} from './helpers';

test('[005:AC-1.13] [005:AC-21.2] TC-012 direct link to T09', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await publishedSet(page, les.id, 'Bộ 1', set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]));
  // A Bài of a second GV's workspace.
  const { page: other } = await otherGvPage(browser);
  const curB = await newCurriculum(other);
  const lesB = await newLesson(other, curB.id);

  // 1. Own Bài: T07 opens with the "Bài tập" tab selected.
  await page.goto(T09(cur.id, les.id));
  await expect(page.getByRole('heading', { name: 'Soạn bài thủ công' })).toBeVisible();
  await expect(page.getByRole('tab', { name: /^Bài tập/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: /^Bài học/ })).toHaveAttribute('aria-selected', 'false');
  await expect(page.getByRole('toolbar', { name: 'Phần Bài tập' })).toBeVisible();
  await evidence(page, 'TC-012', 1);
  // 2. The same kind of link to a Bài of the other workspace.
  await page.goto(T09(curB.id, lesB.id));
  await expect(page.getByText('Không tìm thấy nội dung')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Soạn bài thủ công' })).toHaveCount(0);
  await evidence(page, 'TC-012', 2);
  // 3. An HV opens the link of Bài 1.
  const [hvId] = await studentIds(page);
  const { page: hv } = await hvPage(browser, hvId!);
  await hv.goto(T09(cur.id, les.id));
  await hv.waitForLoadState('networkidle');
  // V19-1: the HV is sent to S01 "Lớp của tôi", nothing of the Bài or its sets is shown.
  await expect(hv).toHaveURL(/\/hv$/);
  await expect(hv).toHaveTitle(/Lớp của tôi/);
  await expect(hv.getByText('Bộ 1')).toHaveCount(0);
  await expect(hv.getByText('Câu?')).toHaveCount(0);
  await expect(hv.getByRole('heading', { name: 'Soạn bài thủ công' })).toHaveCount(0);
  await evidence(hv, 'TC-012', 3);
});

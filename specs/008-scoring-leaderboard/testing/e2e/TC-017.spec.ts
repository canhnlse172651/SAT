import { expect, test } from '@playwright/test';
import { evidence, expectSummary, gvPage, hideExercises, myScore, openS09, refresh, regrade, tc016Data, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-4.3] TC-017 a re-grade of hidden content updates the hidden line and the average', async ({ browser }) => {
  test.setTimeout(150_000);
  const { page: gv } = await gvPage(browser);
  const d = await tc016Data(browser, gv, { twoQ: ['S3a'], anS3aReal: true, skipClock: true });
  await hideExercises(gv, d.A.id, d.r.lessons[2]!);
  await openS09(d.an);
  await myScore(d.an);
  const line = d.an.getByRole('note').filter({ hasText: 'Nội dung đã ẩn' });
  await expect(line).toHaveText('Nội dung đã ẩn: 2 bộ bài tập · 175 điểm');

  // 1. Key of question 2 of S3a changed, re-grade confirmed. 2. "Làm mới".
  await regrade(gv, d.r, 'S3a', 1, 1);
  await refresh(d.an);
  await expect(line).toHaveText('Nội dung đã ẩn: 2 bộ bài tập · 125 điểm');
  await expectSummary(d.an, { avgEx: '71,7' });
  await evidence(d.an, 'TC-017', 1);
});

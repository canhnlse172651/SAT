import { expect, test } from '@playwright/test';
import { LESSONS, evidence, expectSummary, gvPage, hideExercises, lessonGroup, myScore, openS09, refresh, setRow, tc016Data, useClockReset, closeOpened } from './helpers';

test.afterEach(closeOpened);

useClockReset();

test('[008:AC-4.1] [008:AC-4.2] [008:AC-4.5] [008:AC-11.3] TC-016 hiding a Bài tập section keeps submitted points in one anonymous line', async ({ browser }) => {
  test.setTimeout(150_000);
  const { page: gv } = await gvPage(browser);
  const d = await tc016Data(browser, gv);
  const hiddenLine = (p: typeof d.an) => p.getByRole('note').filter({ hasText: 'Nội dung đã ẩn' });

  // 1. Before hiding.
  await openS09(d.an);
  await myScore(d.an);
  await expectSummary(d.an, { score: '26,5' });
  await openS09(d.dung);
  await myScore(d.dung);
  await expectSummary(d.dung, { avgEx: '46,7', score: '14,0' });

  // 2. GV hides the Bài tập section of Bài 3 in class A. 3. "Làm mới".
  await hideExercises(gv, d.A.id, d.r.lessons[2]!);
  await refresh(d.an);
  await expectSummary(d.an, { avgEx: '88,3', score: '26,5', submitted: '1/1' });
  await expect(lessonGroup(d.an, LESSONS[2])).toHaveCount(0);
  await expect(hiddenLine(d.an)).toHaveCount(1);
  await expect(hiddenLine(d.an)).toHaveText('Nội dung đã ẩn: 2 bộ bài tập · 175 điểm');
  await expect(hiddenLine(d.an).getByRole('link')).toHaveCount(0);
  await expect(d.an.locator('body')).not.toContainText(LESSONS[2]);
  await evidence(d.an, 'TC-016', 1);

  await refresh(d.dung);
  await expectSummary(d.dung, { avgEx: '70,0', score: '21,0' });
  await expect(hiddenLine(d.dung)).toHaveText('Nội dung đã ẩn: 1 bộ bài tập · 80 điểm');
  await evidence(d.dung, 'TC-016', 2);

  // 4. Shown again.
  await hideExercises(gv, d.A.id, d.r.lessons[2]!, false);
  await refresh(d.an);
  await expect(lessonGroup(d.an, LESSONS[2])).toHaveCount(1);
  await expect(setRow(d.an, LESSONS[2], 'Luyện từ mới')).toContainText('Đã có điểm');
  await expect(setRow(d.an, LESSONS[2], 'Luyện từ mới').locator('.rk-row__pts')).toHaveText('100/100');
  await expect(hiddenLine(d.an)).toHaveCount(0);
  await refresh(d.dung);
  const s3b = setRow(d.dung, LESSONS[2], 'Luyện mẫu câu');
  await expect(s3b).toContainText('Quá hạn');
  await expect(s3b.locator('.rk-row__pts')).toHaveText('0/100');
  await expectSummary(d.dung, { avgEx: '46,7', score: '14,0' });
  await expect(hiddenLine(d.dung)).toHaveCount(0);
  await evidence(d.dung, 'TC-016', 3);
});

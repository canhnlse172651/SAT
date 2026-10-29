import { expect, test } from '@playwright/test';
import { evidence, examRow, gvPage, myScore, openS09, takeExam, tc057Data, useClockReset, closeOpened } from './helpers';

test.afterEach(closeOpened);

useClockReset();

test('[008:AC-11.11] [008:AC-11.12] TC-058 an exam row with a submission opens its S08 result, others open nothing', async ({ browser }) => {
  test.setTimeout(180_000);
  const { page: gv } = await gvPage(browser);
  const d = await tc057Data(browser, gv);
  await takeExam(gv, d.an, d.Y.id, 'three');
  await openS09(d.an);
  await myScore(d.an);

  // 1. Tap Y ("Đã có điểm").
  await expect(examRow(d.an, d.Y.name)).toContainText('Đã có điểm');
  await examRow(d.an, d.Y.name).click();
  await expect(d.an).toHaveURL(new RegExp(`/hv/bai-thi/${d.Y.id}\\?ket-qua=1$`));
  await evidence(d.an, 'TC-058', 1);
  // 2. Back; tap X ("Không làm bài") and Z ("Chưa thi"): nothing opens.
  await d.an.goBack();
  await myScore(d.an);
  const url = d.an.url();
  for (const e of [d.X, d.Z]) {
    const row = examRow(d.an, e.name);
    await expect(row).toHaveAttribute('aria-disabled', 'true');
    await expect(row.getByRole('link')).toHaveCount(0);
    await row.click();
    await expect(d.an).toHaveURL(url);
  }
  await evidence(d.an, 'TC-058', 2);
});

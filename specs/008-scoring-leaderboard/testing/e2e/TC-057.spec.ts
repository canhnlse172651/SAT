import { expect, test } from '@playwright/test';
import { evidence, examRow, gvPage, myScore, openS09, tc057Data, useClockReset, closeOpened } from './helpers';

test.afterEach(closeOpened);

useClockReset();

test('[008:AC-11.8] TC-057 the "Bài thi" group: order by opening time, states, close times; exams closed before joining are left out', async ({ browser }) => {
  test.setTimeout(180_000);
  const { page: gv } = await gvPage(browser);
  const d = await tc057Data(browser, gv);

  // 1. An.
  await openS09(d.an);
  await myScore(d.an);
  // By opening time: X (and W, opened the same minute, which An also did not take) before Y before Z.
  const titles = await d.an.locator('.rk-mine > .rk-row .rk-row__title').allInnerTexts();
  const at = (n: string) => titles.indexOf(n);
  expect(at(d.X.name)).toBeGreaterThanOrEqual(0);
  expect(at(d.X.name)).toBeLessThan(at(d.Y.name));
  expect(at(d.Y.name)).toBeLessThan(at(d.Z.name));
  expect(at(d.Z.name)).toBe(titles.length - 1);
  const x = examRow(d.an, d.X.name);
  await expect(x).toContainText('Không làm bài');
  await expect(x.locator('.rk-row__pts')).toHaveText('0/100');
  const y = examRow(d.an, d.Y.name);
  await expect(y).toContainText('Chưa thi');
  await expect(y.locator('.rk-row__pts')).toHaveText('—');
  await expect(examRow(d.an, d.Z.name)).toContainText('Chưa thi');
  for (const e of [d.X, d.Y, d.Z]) await expect(examRow(d.an, e.name)).toContainText(`Đóng ${d.close(e.closesAtDate)}`);
  await evidence(d.an, 'TC-057', 1);

  // 2. Chi: no W.
  await openS09(d.chi);
  await myScore(d.chi);
  await expect(examRow(d.chi, d.W.name)).toHaveCount(0);
  await evidence(d.chi, 'TC-057', 2);
});

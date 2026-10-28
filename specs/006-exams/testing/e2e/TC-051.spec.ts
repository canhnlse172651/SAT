import { expect, test } from '@playwright/test';
import { S07, card, evidence, freshStudents, gvPage, hvPage, newClass, scheduledExam, uid } from './helpers';

const secs = (s: string) => s.split(':').map(Number).reduce((a, x) => a * 60 + x, 0);

test('[006:AC-7.5] TC-051 "Mở sau hh:mm:ss" under 24 h, ticking each second; none beyond 24 h', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const t = uid();
  await scheduledExam(page, { name: `TC-051 A ${t}`, classIds: [A.id], openIn: 120, dur: 30, closeAfter: 60 });
  await scheduledExam(page, { name: `TC-051 B ${t}`, classIds: [A.id], openIn: 30 * 60, dur: 30, closeAfter: 60 });
  const hv = await hvPage(browser, h!);
  await hv.page.goto(S07);
  const cd = card(hv.page, `TC-051 A ${t}`).getByText(/Mở sau \d\d:\d\d:\d\d/);
  await expect(cd).toHaveText(/Mở sau 01:5\d:\d\d/);
  const read = async () => secs((await cd.innerText()).replace(/.*Mở sau /, '').trim());
  const first = await read();
  await hv.page.waitForTimeout(2100);
  const later = await read();
  expect(first - later).toBeGreaterThanOrEqual(2);
  expect(first - later).toBeLessThanOrEqual(3);
  await expect(card(hv.page, `TC-051 B ${t}`).getByText(/Mở sau/)).toHaveCount(0);
  await evidence(hv.page, 'TC-051');
});

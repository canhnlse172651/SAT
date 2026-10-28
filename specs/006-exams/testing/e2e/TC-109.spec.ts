/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { S07, card, clockOf, evidence, freshStudents, gvPage, hvPage, newClass, scheduledExam, startOnScreen, timerSeconds, uid } from './helpers';

const secs = (s: string) => s.split(':').map(Number).reduce((a, x) => a * 60 + x, 0);

test('[006:NFR-1] TC-109 countdowns follow the server within 2 s on a device 3 h off in another time zone', async ({ browser }) => {
  test.setTimeout(60_000);
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const t = uid();
  await scheduledExam(page, { name: `TC-109 sau ${t}`, classIds: [A.id], openIn: 120, dur: 30, closeAfter: 60 });
  const ex = await scheduledExam(page, { name: `TC-109 ${t}`, classIds: [A.id], dur: 45, closeAfter: 60 });
  const hv = await hvPage(browser, h!, { timezoneId: 'Asia/Tokyo' });
  await hv.page.clock.install({ time: new Date(Date.now() + 3 * 3600e3) });
  await hv.page.goto(S07);
  // "Mở sau": the server's time to the open.
  const cd = card(hv.page, `TC-109 sau ${t}`).getByText(/Mở sau \d\d:\d\d:\d\d/);
  const shown = secs((await cd.innerText()).replace(/.*Mở sau /, '').trim());
  const real = (Date.parse((await hv.page.request.get('/api/learn/exams').then((r) => r.json())).items.find((x: any) => x.name === `TC-109 sau ${t}`).opensAt) -
    Date.parse((await hv.page.request.get('/api/learn/exams').then((r) => r.json())).serverNow)) / 1000;
  expect(Math.abs(shown - real)).toBeLessThanOrEqual(2);
  await startOnScreen(hv.page, `TC-109 ${t}`);
  await hv.page.waitForTimeout(1500);
  const c = await clockOf(hv.page, ex.id);
  const expected = (Date.parse(c.endsAt) - Date.parse(c.serverNow)) / 1000;
  expect(Math.abs((await timerSeconds(hv.page)) - expected)).toBeLessThanOrEqual(2);
  await evidence(hv.page, 'TC-109');
});

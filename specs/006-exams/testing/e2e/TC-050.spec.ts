import { expect, test } from '@playwright/test';
import { S07, doExam, evidence, freshStudents, gvPage, holder, hvPage, newClass, scheduledExam, start, uid } from './helpers';

test('[006:AC-7.4] TC-050 S07 order: in progress, open (close soonest), not open (open soonest), the rest (latest close)', async ({ browser }) => {
  test.setTimeout(90_000);
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const t = uid();
  const n = (s: string) => `TC-050 ${s} ${t}`;
  const hv = await hvPage(browser, h!);
  const done1 = await scheduledExam(page, { name: n('nộp đóng +200'), classIds: [A.id], dur: 30, closeAfter: 200 });
  const done2 = await scheduledExam(page, { name: n('nộp đóng +300'), classIds: [A.id], dur: 30, closeAfter: 300 });
  await doExam(page, hv.page, done1.id);
  await doExam(page, hv.page, done2.id);
  await scheduledExam(page, { name: n('chưa mở ngày kia'), classIds: [A.id], openIn: 48 * 60, dur: 30, closeAfter: 60 });
  await scheduledExam(page, { name: n('chưa mở ngày mai'), classIds: [A.id], openIn: 24 * 60, dur: 30, closeAfter: 60 });
  await scheduledExam(page, { name: n('mở đóng +120'), classIds: [A.id], dur: 30, closeAfter: 120 });
  await scheduledExam(page, { name: n('mở đóng +60'), classIds: [A.id], dur: 30, closeAfter: 60 });
  const doing = await scheduledExam(page, { name: n('đang làm'), classIds: [A.id], dur: 30, closeAfter: 90 });
  expect((await start(hv.page, doing.id, holder())).status).toBe(200);

  await hv.page.goto(S07);
  await expect(hv.page.locator('article h2')).toHaveCount(7);
  expect(await hv.page.locator('article h2').allInnerTexts()).toEqual([
    n('đang làm'),
    n('mở đóng +60'),
    n('mở đóng +120'),
    n('chưa mở ngày mai'),
    n('chưa mở ngày kia'),
    n('nộp đóng +300'),
    n('nộp đóng +200'),
  ]);
  await evidence(hv.page, 'TC-050');
});

import { expect, test } from '@playwright/test';
import {
  T16, addToClass, advanceClock, api, contentOf, evidence, freshStudents, gvPage, holder, hvPage, inactiveStudent,
  mcqAnswers, mcqs, newClass, resetClock, save, scheduledExam, serverNow, start,
} from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-15.2] [006:AC-15.3] TC-100 one state per HV with its data, counts and average; after the close', async ({ browser }) => {
  test.setTimeout(90_000);
  const { page } = await gvPage(browser);
  const [h1, h2, h4, h6, h7] = await freshStudents(page, 5);
  const na = await inactiveStudent(page);
  const A = await newClass(page, [h1!, h2!, h4!, h6!, na]);
  await api(page, 'POST', `/api/students/${h6}/lock`);
  const ex = await scheduledExam(page, { classIds: [A.id], content: mcqs(5), dur: 5, closeAfter: 30 });
  const content = await contentOf(page, ex.id);
  // hv1: 4 / 5 saved, never submitted → automatic at the end of its attempt (80).
  const hv1 = await hvPage(browser, h1!);
  const k1 = holder();
  const s1 = await start(hv1.page, ex.id, k1);
  const a = mcqAnswers(content);
  delete a[content.questions[4].id];
  await save(hv1.page, ex.id, k1, a);
  await advanceClock(page, Date.parse(s1.body.endsAt) + 15_000 - (await serverNow(page)).getTime());
  // hv2 starts now (doing).
  const hv2 = await hvPage(browser, h2!);
  expect((await start(hv2.page, ex.id, holder())).status).toBe(200);

  await page.goto(T16(ex.id));
  const row = (id: string) => page.locator(`tr[data-sid="${id}"]`);
  await expect(row(h1!)).toContainText('Đã nộp');
  await expect(row(h1!)).toContainText('80/100');
  await expect(row(h1!)).toContainText('Nộp tự động');
  await expect(row(h1!)).toContainText(/\d\d\/\d\d\/\d{4} \d\d:\d\d/);
  await expect(row(h1!)).toContainText('5 phút');
  await expect(row(h2!)).toContainText('Đang làm');
  await expect(row(h2!)).toContainText(/Bắt đầu \d\d:\d\d/);
  await expect(row(h2!)).toContainText(/còn \d\d:\d\d/);
  await expect(row(h4!)).toContainText('Chưa làm');
  await expect(row(h6!)).toContainText('Chưa làm');
  await expect(row(h6!)).toContainText('Đã khóa');
  await expect(row(na)).toHaveCount(0);
  const counts = page.getByLabel('Số liệu của lớp');
  await expect(counts).toContainText(/Đã nộp\s*1/);
  await expect(counts).toContainText(/Đang làm\s*1/);
  await expect(counts).toContainText(/Chưa làm\s*2/);
  await expect(counts).toContainText(/Điểm trung bình \(Đã nộp\)\s*80,0/);
  await evidence(page, 'TC-100', 1);

  await advanceClock(page, ex.closesAtDate.getTime() + 15_000 - (await serverNow(page)).getTime());
  await page.request.get('/api/exams');
  await addToClass(page, A.id, [h7!]);
  await page.reload();
  await expect(row(h4!)).toContainText('Không làm bài · 0/100');
  await expect(row(h6!)).toContainText('Không làm bài · 0/100');
  await expect(row(h7!)).toContainText('Vào lớp sau khi bài thi đóng');
  await evidence(page, 'TC-100', 2);
});

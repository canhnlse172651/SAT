/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { NAMES, addToClass, api, evidence, gvPage, lockStudent, openRankingTab, student, tableRows, tc029Data, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-10.1] TC-049 the GV tab lists activated members (locked labelled) with every column', async ({ browser }) => {
  test.setTimeout(150_000);
  const { page: gv } = await gvPage(browser);
  const d = await tc029Data(browser, gv);
  const Ha = await student(gv, NAMES.Hà, { email: `ha+${Date.now()}@sat.dev`, activate: false });
  // An HV whose activation e-mail bounces ("Gửi email thất bại").
  const failed = await student(gv, 'Gửi lỗi Thư', { email: `bounce+${Date.now()}@sat.invalid`, activate: false });
  await api(gv, 'POST', `/api/students/${failed}/activate`);
  await expect.poll(async () => (await api<any>(gv, 'GET', `/api/students/${failed}`)).status, { timeout: 15_000 }).toBe('failed');
  await addToClass(gv, d.A.id, [Ha, failed]);
  await lockStudent(gv, d.Bình);

  await openRankingTab(gv, d.A.id);
  await expect(gv.locator('.rk-tbl thead th')).toHaveText([
    'Hạng', 'Họ tên', 'Email', 'TB bài tập', 'TB bài thi', 'Điểm xếp hạng', 'Cập nhật lần cuối', '',
  ]);
  const rows = await tableRows(gv);
  expect(rows.map((x) => x.name)).toEqual(['Nguyễn Văn An', 'Trần Thị Bình', 'Phạm Thu Chi', 'Lê Văn Dũng']);
  expect(rows.map((x) => x.rank)).toEqual(['1', '2', '2', '4']);
  expect(rows.map((x) => x.locked)).toEqual([false, true, false, false]);
  for (const r of rows) {
    expect(r.email).toMatch(/@sat\.dev$/);
    expect(r.avgEx).toMatch(/^\d+,\d$/);
    expect(r.avgExam).toBe('0,0');
    expect(r.score).toMatch(/^\d+,\d$/);
    // "Cập nhật lần cuối (dd/mm/yyyy HH:mm)".
    expect(r.updated).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
  }
  await expect(gv.locator('.rk-tbl tbody tr .avatar')).toHaveCount(4);
  await evidence(gv, 'TC-049', 1);
});

import { type Locator, expect, test } from '@playwright/test';
import { evidence, gvPage, hvPage, newClass, openRankingTab, openS09, people, r1, closeOpened } from './helpers';

test.afterEach(closeOpened);

const EXPECT = [
  'Điểm xếp hạng = 30% × TB bài tập + 70% × TB bài thi',
  'thang 0–100',
  'bộ bài tập đã có hạn nộp',
  'quá hạn mà chưa nộp thì tính 0',
  'qua giờ đóng mà không làm thì tính 0',
  'TB bằng 0 khi chưa có mục nào được tính',
  'một chữ số thập phân',
  'từ 0,05 làm tròn lên',
  'tăng hoặc giảm',
  'Nội dung đã ẩn',
  'Bài thi đã gỡ',
  '(1, 2, 2, 4)',
  'Ví dụ:',
];
async function explains(box: Locator) {
  for (const t of EXPECT) await expect(box).toContainText(t);
}

test('[008:AC-13.1] TC-059 "Cách tính điểm" explains the rules on S09 and on the GV tab', async ({ browser }) => {
  test.setTimeout(90_000);
  const { page: gv } = await gvPage(browser);
  const { An } = await people(gv, ['An']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An]);

  // 1. HV.
  const { page: hv } = await hvPage(browser, An);
  await openS09(hv);
  await hv.getByRole('button', { name: 'Cách tính điểm' }).click();
  const sheet = hv.getByRole('dialog', { name: 'Cách tính điểm' });
  await explains(sheet);
  await evidence(hv, 'TC-059', 1);
  await sheet.getByRole('button', { name: 'Đã hiểu' }).click();

  // 2. GV.
  await openRankingTab(gv, A.id);
  await gv.getByRole('button', { name: 'Cách tính điểm' }).click();
  const dialog = gv.getByRole('dialog', { name: 'Cách tính điểm' });
  await explains(dialog);
  await evidence(gv, 'TC-059', 2);
});

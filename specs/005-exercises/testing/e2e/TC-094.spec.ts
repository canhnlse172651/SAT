/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { T09, aiApprove, archiveItem, draftSet, evidence, getLesson, gvPage, mcq, newCurriculum, newLesson, set, setBlock } from './helpers';

test('[005:AC-18.7] TC-094 every set edited in place with its own actions', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const q = () => set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]);
  expect((await aiApprove(page, les.id, [{ title: 'Bộ xuất bản AI', content: q() }, { title: 'Bộ lưu trữ', content: q() }])).status).toBe(200);
  const archived = (await getLesson(page, les.id)).items.find((i: any) => i.title === 'Bộ lưu trữ').id;
  await archiveItem(page, les.id, archived);
  await draftSet(page, les.id, 'Bộ nháp', q());
  await page.goto(T09(cur.id, les.id));
  await page.getByRole('switch', { name: /^Hiện mục lưu trữ/ }).click();

  const cases: [number, string, string, string[], string[]][] = [
    [1, 'Đã xuất bản', 'Lưu thay đổi', ['Lưu trữ'], ['Lưu nháp', 'Xuất bản', 'Khôi phục']],
    [2, 'Lưu trữ', 'Lưu thay đổi', ['Khôi phục'], ['Lưu nháp', 'Xuất bản']],
    [3, 'Nháp', 'Lưu nháp', ['Xuất bản'], ['Lưu thay đổi', 'Lưu trữ', 'Khôi phục']],
  ];
  for (const [n, status, saveLabel, has, hasNot] of cases) {
    const b = setBlock(page, n);
    await expect(b.locator('.cur-item__bar').first().getByText(status, { exact: true })).toBeVisible();
    for (const name of ['Lên', 'Xuống']) await expect(b.getByRole('button', { name, exact: true })).toBeVisible();
    for (const name of [saveLabel, ...has, 'Nhân bản', 'Thêm sau', 'Xóa']) await expect(b.getByRole('button', { name, exact: true }), `${status}: ${name}`).toBeVisible();
    for (const name of hasNot) await expect(b.getByRole('button', { name, exact: true }), `${status}: no ${name}`).toHaveCount(0);
    // Every field editable in place, no mode switch.
    await expect(b.getByRole('button', { name: /Chỉnh sửa|Sửa bộ|Xong/ })).toHaveCount(0);
    await b.getByLabel('Tiêu đề', { exact: true }).fill(`${status} sửa`);
    await b.getByLabel('Hướng dẫn (tùy chọn)').fill('Mới');
    await b.getByRole('region', { name: 'Câu 1', exact: true }).getByLabel('Đề bài').fill('Đề mới');
    await b.getByRole('region', { name: 'Câu 1', exact: true }).getByRole('textbox', { name: 'Phương án B' }).fill('B mới');
    await expect(b.getByText('Chưa lưu', { exact: true })).toBeVisible();
  }
  await expect(setBlock(page, 1).locator('.cur-item__bar').first().getByText('AI tạo')).toBeVisible();
  await evidence(page, 'TC-094');
});

import { expect, test } from '@playwright/test';
import {
  S03,
  S11,
  T07,
  addSet,
  api,
  deck,
  evidence,
  fileBlock,
  freshGvPage,
  getLesson,
  hvPage,
  linkPractice,
  markCard,
  newClass,
  newCurriculum,
  newLesson,
  png,
  publishLesson,
  publishSet,
  publishedStep,
  studentIds,
  text,
  upload,
} from './helpers';

test('[004:AC-8.1] [004:AC-8.2] TC-056 delete a step seen and marked by HV: warnings, cleanup', async ({ browser }) => {
  // Own workspace (storage is compared before / after) with its own activated HV.
  const { page } = await freshGvPage(browser);
  const hvAccount = await api(page, 'POST', '/api/students', { displayName: 'HV QA', email: `hvqa+${Date.now()}@sat.dev` });
  await api(page, 'POST', `/api/students/${hvAccount.id}/activate`);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const img = await upload(page, 'image', 'anh.png', png());
  const id = await publishedStep(page, les.id, 'Từ mới', [
    text('<p>你好</p>'),
    fileBlock('image', img.body),
    deck([{ id: 'c1', front: '你', meaning: 'bạn' }], 'Bộ 1', 'k1'),
    deck([{ id: 'c2', front: '好', meaning: 'tốt' }], 'Bộ 2', 'k2'),
  ]);
  await publishedStep(page, les.id, 'Bước sau', [text('<p>后</p>')]);
  const set = await addSet(page, les.id);
  await publishSet(page, les.id, set, 'Luyện từ mới');
  await linkPractice(page, set, id);
  await publishLesson(page, les.id);
  const ids = await studentIds(page);
  const c1 = await newClass(page, cur.id, ids);
  await newClass(page, cur.id, ids);

  const hv = await hvPage(browser, hvAccount.id);
  await hv.page.goto(S03(c1.id, id));
  await expect(hv.page.getByRole('heading', { name: 'Từ mới' })).toBeVisible();
  await markCard(hv.page, c1.id, id, 'k1', 'c1', 'known');

  const used = async () => (await api<{ usedBytes: number }>(page, 'GET', '/api/steps/storage')).usedBytes;
  const before = await used();
  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 1' });
  await expect(page.getByText('Có dữ liệu học viên')).toHaveCount(0);
  await step.getByRole('button', { name: 'Xóa', exact: true }).click();
  const dialog = page.getByRole('alertdialog', { name: 'Xóa “Từ mới”?' });
  await expect(dialog.getByText('Thao tác có hiệu lực ngay và không hoàn tác được.')).toBeVisible();
  await expect(dialog.getByText('Bước đang hiển thị với học viên của 2 lớp.')).toBeVisible();
  await expect(
    dialog.getByText('Đánh dấu Đã thuộc/Chưa thuộc của học viên với 2 bộ thẻ của bước cũng sẽ bị xóa.'),
  ).toBeVisible();
  await evidence(page, 'TC-056', 1);
  await dialog.getByRole('button', { name: 'Xóa' }).click();
  await expect(page.getByText('Đã xóa · Đã lưu').first()).toBeVisible();
  await expect(page.getByRole('region', { name: /^Bước học \d+$/ })).toHaveCount(1);
  await expect(page.getByRole('region', { name: 'Bước học 1' }).getByLabel('Tên bước học')).toHaveValue('Bước sau');
  const lesson = await getLesson(page, les.id);
  expect(lesson.items.some((i: { id: string }) => i.id === set)).toBe(true);
  expect(await used()).toBe(before - img.body.size);
  await evidence(page, 'TC-056', 2);

  await hv.page.goto(S11(c1.id, les.id));
  await expect(hv.page.getByText('Bước sau')).toBeVisible();
  await expect(hv.page.getByText('Từ mới')).toHaveCount(0);
});

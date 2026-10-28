import { expect, test } from '@playwright/test';
import { T22, evidence, freshStudents, gvPage, newClass, scheduledExam, uid, vnInput } from './helpers';

test('[006:AC-15.1] TC-099 T16 header and the class selector (first class A→Z by default)', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h1, h2] = await freshStudents(page, 2);
  const t = uid();
  const B = await newClass(page, [h2!], { name: `Lớp B ${t}` });
  const A = await newClass(page, [h1!], { name: `Lớp A ${t}` });
  const name = `TC-099 ${t}`;
  const ex = await scheduledExam(page, { name, classIds: [B.id, A.id], dur: 45, closeAfter: 60 });
  await page.goto(T22(ex.id));
  await page.getByRole('link', { name: 'Xem kết quả' }).click();
  await expect(page.getByRole('heading', { name: 'Kết quả bài thi' })).toBeVisible();
  await expect(page.locator('.page-sub')).toContainText(name);
  await expect(page.locator('.page-sub')).toContainText('Đang mở');
  await expect(page.locator('.xm-meta')).toContainText(`Giờ mở ${vnInput(ex.opensAtDate)}`);
  await expect(page.locator('.xm-meta')).toContainText('Thời lượng 45 phút');
  await expect(page.locator('.xm-meta')).toContainText(`Giờ đóng ${vnInput(ex.closesAtDate)}`);
  const pick = page.getByRole('group', { name: 'Chọn lớp' });
  await expect(pick.getByRole('button')).toHaveText([`Lớp A ${t}`, `Lớp B ${t}`]);
  await expect(pick.getByRole('button', { name: `Lớp A ${t}` })).toHaveAttribute('aria-pressed', 'true');
  await evidence(page, 'TC-099');
});

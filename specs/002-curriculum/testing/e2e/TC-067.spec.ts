import { test, expect } from '@playwright/test';
import { READY_SET, READY_STEP, addItem, addLesson, asGv, createCurriculum, publishLesson, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-16.7] [002:AC-16.8] [002:AC-16.9] TC-067 Web / Mobile: mặc định Web, giữ trạng thái, nhớ trong phiên', async ({
  page,
}) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-067 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  const e = await addItem(page, l.id, 'exercise', { title: 'Bộ 1', content: READY_SET });
  await publishLesson(page, l.id, [e]);
  await addItem(page, l.id, 'exercise', { title: 'Bộ nháp', content: READY_SET });
  await addItem(page, l.id, 'lesson', { title: 'S', content: READY_STEP });
  const url = `/gv/giao-trinh/${c.id}/bai/${l.id}/xem-truoc`;

  await page.goto(url);
  const mode = page.getByRole('radiogroup', { name: 'Chế độ hiển thị' });
  await expect(mode.getByRole('radio', { name: 'Web' })).toHaveAttribute('aria-checked', 'true');
  const screen = page.locator('.pv-frame__screen');
  expect((await screen.boundingBox())!.width).toBeGreaterThan(600);

  await page.getByRole('tab', { name: /Bài tập/ }).click();
  await page.getByRole('switch', { name: 'Gồm cả mục Nháp' }).click();
  await page.getByRole('radio', { name: 'Xin chào' }).first().check();
  await mode.getByRole('radio', { name: 'Mobile' }).click();
  await expect(mode.getByRole('radio', { name: 'Mobile' })).toHaveAttribute('aria-checked', 'true');
  const box = (await screen.boundingBox())!;
  expect(Math.round(box.width)).toBe(375 + 2 * 14 + 2 * 10); // 375 px content + padding + bezel
  expect(await screen.evaluate((el) => getComputedStyle(el).width)).toBe('375px');
  await expect(page.getByRole('tab', { name: /Bài tập/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('switch', { name: 'Gồm cả mục Nháp' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('radio', { name: 'Xin chào' }).first()).toBeChecked();
  await expect(page.getByRole('article')).toHaveCount(2);
  await shot(page, 'TC-067', 1);

  await page.getByRole('button', { name: 'Thoát xem trước' }).click();
  await page.goto(url);
  await expect(page.getByRole('radiogroup', { name: 'Chế độ hiển thị' }).getByRole('radio', { name: 'Mobile' })).toHaveAttribute(
    'aria-checked',
    'true',
  );

  // Sign out (T17) and sign in again (A01): a new session starts on Web.
  await page.goto('/gv/tai-khoan');
  await page.getByRole('button', { name: 'Đăng xuất' }).first().click();
  await page.getByRole('alertdialog', { name: 'Đăng xuất khỏi SAT?' }).getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page).toHaveURL(/\/dang-nhap/);
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('lan@sat.dev');
  await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill('LanHSK2026');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).toHaveURL(/\/gv/);
  await page.goto(url);
  await expect(page.getByRole('radiogroup', { name: 'Chế độ hiển thị' }).getByRole('radio', { name: 'Web' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
});

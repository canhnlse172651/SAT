import { test, expect } from '@playwright/test';
import { READY_SET, addItem, addLesson, asGv, createCurriculum, getLesson, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-18.5] TC-056 không lưu trữ được khi còn thay đổi chưa lưu', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-056 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  const e1 = await addItem(page, l.id, 'exercise', { title: 'E1', content: READY_SET, publish: true });
  await page.goto(`/gv/giao-trinh/${c.id}/bai/${l.id}/thu-cong`);
  const set = page.getByRole('region', { name: 'Bộ bài tập 1' });
  const archive = set.getByRole('button', { name: 'Lưu trữ' });
  await expect(archive).not.toHaveAttribute('aria-disabled', 'true');

  await set.getByLabel('Tên').fill('E1 sửa');
  await expect(archive).toHaveAttribute('aria-disabled', 'true');
  await expect(set.getByText('Hãy lưu hoặc bỏ thay đổi trước khi lưu trữ', { exact: true })).toBeVisible();
  // aria-disabled: a click (forced, as a user clicking it would) changes nothing.
  await archive.click({ force: true });
  expect((await getLesson(page, l.id)).items.find((i: { id: string }) => i.id === e1).status).toBe('published');
  await shot(page, 'TC-056', 1);

  await set.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByText(/^Đã lưu lúc \d{2}:\d{2}$/).first()).toBeVisible();
  await expect(archive).not.toHaveAttribute('aria-disabled', 'true');
  await expect(set.getByText('Hãy lưu hoặc bỏ thay đổi trước khi lưu trữ', { exact: true })).toHaveCount(0);
});

import { test, expect } from '@playwright/test';
import { READY_SET, READY_STEP, addItem, addLesson, asGv, createCurriculum, getLesson, ok, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });
test.setTimeout(240_000);

const timed = async (fn: () => Promise<unknown>) => {
  const t = Date.now();
  await fn();
  return Date.now() - t;
};

test('[002:NFR-2] TC-071 hiệu năng T06, T18, thao tác lưu, Web/Mobile và duyệt AI', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-071 ${uid()}`, 1);
  for (let i = 1; i <= 99; i++) await addLesson(page, c.id, `Bài ${i}`);
  const big = await addLesson(page, c.id, 'Bài lớn');
  for (let i = 1; i <= 30; i++) await addItem(page, big.id, 'lesson', { title: `S${i}`, content: READY_STEP, publish: i <= 2 });
  for (let i = 1; i <= 30; i++) await addItem(page, big.id, 'exercise', { title: `E${i}`, content: READY_SET });
  const notes: string[] = [];

  const t06 = await timed(async () => {
    await page.goto(`/gv/giao-trinh/${c.id}`);
    await expect(page.locator('.cur-row__name')).toHaveCount(100);
  });
  const t18 = await timed(async () => {
    await page.goto(`/gv/giao-trinh/${c.id}/bai/${big.id}`);
    await expect(page.getByRole('region', { name: 'Phần Bài tập' })).toContainText('30 bộ bài tập');
  });
  notes.push(`T06 100 bài: ${t06} ms`, `T18 30+30: ${t18} ms`);
  expect(t06).toBeLessThanOrEqual(2000);
  expect(t18).toBeLessThanOrEqual(2000);

  await page.goto(`/gv/giao-trinh/${c.id}/bai/${big.id}/bai-hoc`);
  await expect(page.getByRole('region', { name: 'Bước học 30', exact: true })).toBeVisible();
  const move = await timed(async () => {
    await page.getByRole('region', { name: 'Bước học 2', exact: true }).getByRole('button', { name: 'Lên trên' }).click();
    await expect(page.getByText('Đã chuyển tới vị trí 1/30 · Đã lưu', { exact: true }).first()).toBeVisible();
  });
  const publish = await timed(async () => {
    await page.getByRole('region', { name: 'Bước học 3', exact: true }).getByRole('button', { name: 'Xuất bản' }).click();
    await expect(page.getByText(/^Đã xuất bản · Đã lưu lúc/)).toBeVisible();
  });
  const archive = await timed(async () => {
    await page.getByRole('region', { name: 'Bước học 1', exact: true }).getByRole('button', { name: 'Lưu trữ' }).click();
    await expect(page.getByText('Đã lưu trữ · Đã lưu', { exact: true })).toBeVisible();
  });
  const l = await getLesson(page, big.id);
  const rename = await timed(() => ok(page, 'PATCH', `/lessons/${big.id}`, { expectedVersion: l.version, name: 'Bài lớn 2' }));
  notes.push(`Lên trên ${move} ms`, `Xuất bản mục ${publish} ms`, `Lưu trữ ${archive} ms`, `Đổi tên ${rename} ms`);
  for (const ms of [move, publish, archive, rename]) expect(ms).toBeLessThanOrEqual(1000);

  await page.goto(`/gv/giao-trinh/${c.id}/bai/${big.id}/xem-truoc`);
  await expect(page.getByRole('article').first()).toBeVisible();
  const vp = await timed(async () => {
    await page.getByRole('radiogroup', { name: 'Chế độ hiển thị' }).getByRole('radio', { name: 'Mobile' }).click();
    await expect(page.locator('.pv-frame--mobile')).toBeVisible();
  });
  notes.push(`Web→Mobile ${vp} ms`);
  expect(vp).toBeLessThanOrEqual(1000);

  // AI approval replacing a section: 30 new sets, 30 old ones.
  const items = Array.from({ length: 30 }, (_, i) => ({ title: `AI ${i + 1}`, content: READY_SET }));
  const p = await ok(page, 'POST', '/dev/curriculum/ai-approve/preview', { lessonId: big.id, section: 'exercise', items });
  const approve = await timed(() =>
    ok(page, 'POST', '/dev/curriculum/ai-approve', { lessonId: big.id, section: 'exercise', items, token: p.token }),
  );
  notes.push(`Duyệt AI 30+30: ${approve} ms`);
  test.info().annotations.push({ type: 'NFR-2', description: notes.join(' · ') });
  expect(approve).toBeLessThanOrEqual(3000);
});

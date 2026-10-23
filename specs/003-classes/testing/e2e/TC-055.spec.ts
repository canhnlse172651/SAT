import { test, expect } from '@playwright/test';
import { createClass, newWorkspaceGv, ok, seedCurriculum, setVisibility, shot, signInLike } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-16.4] [003:NFR-4] TC-055 ẩn / hiện hàng loạt theo cột và theo dòng; 50 Bài ≤ 3 giây', async ({ page }) => {
  test.setTimeout(300_000);
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-055 GT', [
    { name: 'Bài 1', steps: 1, sets: 1 },
    { name: 'Bài 2', steps: 1, sets: 1 },
    { name: 'Bài 3', steps: 1, sets: 1 },
    { name: 'Bài 4', steps: 1, sets: 1, draft: true },
  ]);
  const name = 'TC-055 Lớp';
  const cls = await createClass(gv, { name, curriculumId: cur.id });
  await setVisibility(gv, cls.id, true, { kind: 'section', lessonId: cur.lessons[1]!.id, section: 'exercise' });
  await signInLike(page, gv);
  await page.goto(`/gv/lop-hoc/${cls.id}?tab=noi-dung`);
  const panel = page.getByRole('tabpanel');
  const confirm = page.getByRole('alertdialog');

  await panel.getByRole('button', { name: 'Ẩn Bài tập ở mọi bài' }).click();
  await expect(confirm).toContainText(
    `Ẩn «Bài tập» của 3 bài với lớp ${name}? Học viên của lớp này sẽ không còn thấy phần này, kể cả kết quả đã làm. Điểm xếp hạng đã có được giữ nguyên. Các lớp khác dùng giáo trình này không bị ảnh hưởng. Bạn có thể hiện lại bất cứ lúc nào.`,
  );
  await shot(page, 'TC-055', 1);
  await confirm.getByRole('button', { name: 'Ẩn với lớp' }).click();
  await expect(page.getByText('Đã cập nhật 3 phần', { exact: true })).toBeVisible();
  const row4 = panel.getByRole('row').filter({ hasText: 'Bài 4' });
  await expect(row4.getByText('Đang ẩn', { exact: true })).toHaveCount(1);
  await expect(panel.getByText('4 bài · 4 phần đang ẩn với lớp này', { exact: true })).toBeVisible();

  await panel.getByRole('button', { name: 'Hiện cả bài: Bài 3' }).click();
  await confirm.getByRole('button', { name: 'Hiện với lớp' }).click();
  await expect(page.getByText('Đã cập nhật 1 phần', { exact: true })).toBeVisible();
  const row3 = panel.getByRole('row').filter({ hasText: 'Bài 3' });
  await expect(row3.getByText('Đang ẩn', { exact: true })).toHaveCount(0);

  await panel.getByRole('button', { name: 'Ẩn Bài tập ở mọi bài' }).click();
  await confirm.getByRole('button', { name: 'Ẩn với lớp' }).click();
  await panel.getByRole('button', { name: 'Ẩn Bài học ở mọi bài' }).click();
  await confirm.getByRole('button', { name: 'Ẩn với lớp' }).click();
  await expect(panel.getByText('4 bài · 8 phần đang ẩn với lớp này', { exact: true })).toBeVisible();
  await expect(panel.getByRole('button', { name: /^Ẩn .* ở mọi bài$/ })).toHaveCount(0);
  await expect(panel.getByRole('button', { name: /^Ẩn cả bài/ })).toHaveCount(0);
  await shot(page, 'TC-055', 2);

  // NFR-4: bulk hide over 50 Bài.
  const big = await seedCurriculum(gv, 'TC-055 50', Array.from({ length: 50 }, (_, i) => ({ name: `B${i + 1}`, steps: 1 })));
  const c50 = await createClass(gv, { name: 'TC-055 50', curriculumId: big.id });
  const t0 = Date.now();
  const res = await ok(gv, 'PUT', `/classes/${c50.id}/visibility`, { hidden: true, scope: { kind: 'column', section: 'lesson' } });
  const ms = Date.now() - t0;
  expect(res.changed).toBe(50);
  expect(ms).toBeLessThanOrEqual(3000);
  test.info().annotations.push({ type: 'NFR-4', description: `bulk hide on 50 Bài in ${ms} ms` });
});

import { expect, test } from '@playwright/test';
import {
  S03,
  evidence,
  fileBlock,
  gvPage,
  hvPage,
  newClass,
  newCurriculum,
  newLesson,
  png,
  publishLesson,
  publishedStep,
  upload,
} from './helpers';

test('[004:AC-14.4] TC-085 an image full screen with zoom up to 4×', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const img = await upload(page, 'image', 'tra.png', png());
  const step = await publishedStep(page, les.id, 'Ảnh', [fileBlock('image', img.body, 'Ảnh trà')]);
  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  const cls = await newClass(page, cur.id, [hv.who.user.id]);
  await hv.page.goto(S03(cls.id, step));
  await hv.page.getByRole('button', { name: 'Xem ảnh toàn màn hình' }).tap().catch(() =>
    hv.page.getByRole('button', { name: 'Xem ảnh toàn màn hình' }).click(),
  );
  const box = hv.page.getByRole('dialog', { name: 'Ảnh trà' });
  await expect(box).toBeVisible();
  await expect(box.getByText('Ảnh trà')).toBeVisible();
  await expect(box.getByText('100%')).toBeVisible();
  const plus = box.getByRole('button', { name: 'Phóng to' });
  for (let i = 0; i < 6 && (await plus.isEnabled()); i++) await plus.click();
  await expect(box.getByText('400%')).toBeVisible();
  await expect(plus).toBeDisabled();
  await evidence(hv.page, 'TC-085');
  await box.getByRole('button', { name: 'Đóng' }).click();
  await expect(box).toHaveCount(0);
});

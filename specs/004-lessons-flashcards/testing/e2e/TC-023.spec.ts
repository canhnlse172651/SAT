import { expect, test } from '@playwright/test';
import {
  S03,
  T07,
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

test('[004:AC-3.4] TC-023 caption of a file block, shown under the content', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const img = await upload(page, 'image', 'tra.png', png());
  const id = await publishedStep(page, les.id, 'Ảnh', [fileBlock('image', img.body, '')]);
  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  const cls = await newClass(page, cur.id, [hv.who.user.id]);

  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 1' });
  const caption = step.getByLabel('Chú thích');
  await caption.fill('c'.repeat(201));
  await expect(caption).toHaveValue('c'.repeat(200));
  await caption.fill('Ảnh trà');
  await step.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(step.getByText('Chưa lưu', { exact: true })).toHaveCount(0);

  await hv.page.goto(S03(cls.id, id));
  const figure = hv.page.locator('figure').filter({ has: hv.page.getByRole('button', { name: 'Xem ảnh toàn màn hình' }) });
  await expect(figure.getByText('Ảnh trà')).toBeVisible();
  const imgBox = await figure.getByRole('button', { name: 'Xem ảnh toàn màn hình' }).boundingBox();
  const capBox = await figure.getByText('Ảnh trà').boundingBox();
  expect(capBox!.y).toBeGreaterThan(imgBox!.y);
  await evidence(hv.page, 'TC-023');
});

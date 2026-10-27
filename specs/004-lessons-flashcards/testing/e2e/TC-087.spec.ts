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
  text,
  upload,
} from './helpers';

test('[004:AC-14.6] TC-087 a block that cannot load shows its error; the others stay', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const img = await upload(page, 'image', 'tra.png', png());
  const step = await publishedStep(page, les.id, 'Ảnh', [text('<p>Chữ vẫn hiện</p>'), fileBlock('image', img.body)]);
  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  const cls = await newClass(page, cur.id, [hv.who.user.id]);
  await hv.page.route(`**/files/${img.body.id}?**`, (r) => r.abort('internetdisconnected'));
  await hv.page.goto(S03(cls.id, step));
  await expect(hv.page.getByText('Không tải được nội dung.')).toBeVisible();
  await expect(hv.page.getByRole('button', { name: 'Thử lại' })).toBeVisible();
  await expect(hv.page.getByText('Chữ vẫn hiện')).toBeVisible();
  await evidence(hv.page, 'TC-087', 1);
  await hv.page.unroute(`**/files/${img.body.id}?**`);
  await hv.page.getByRole('button', { name: 'Thử lại' }).click();
  const image = hv.page.getByRole('button', { name: 'Xem ảnh toàn màn hình' }).locator('img');
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((i: HTMLImageElement) => i.naturalWidth)).toBeGreaterThan(0);
  await expect(hv.page.getByText('Không tải được nội dung.')).toHaveCount(0);
  await evidence(hv.page, 'TC-087', 2);
});

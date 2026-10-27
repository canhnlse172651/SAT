import { expect, test } from '@playwright/test';
import {
  S03,
  T07,
  addStep,
  evidence,
  getLesson,
  gvPage,
  hvPage,
  newClass,
  newCurriculum,
  newLesson,
  publishLesson,
} from './helpers';

test('[004:AC-3.5] TC-024 text formats, 8 colours, http(s) links only', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 1' });
  await step.getByLabel('Tên bước học').fill('Định dạng');
  const box = step.getByRole('textbox', { name: 'Nội dung khối 1' });
  await expect(step.getByText('0/20.000')).toBeVisible();
  const colors = step.getByRole('group', { name: 'Màu chữ' }).getByRole('button');
  await expect(colors).toHaveCount(8);

  const line = async (t: string, tool?: string) => {
    await box.press('End');
    await box.pressSequentially(t);
    if (tool) {
      await box.press('Shift+Home');
      await step.getByRole('button', { name: tool, exact: true }).click();
      await box.press('End');
    }
    await box.press('Enter');
  };
  await box.click();
  await line('Tiêu đề lớn', 'Tiêu đề 1');
  await line('Tiêu đề nhỏ', 'Tiêu đề 2');
  await step.getByRole('button', { name: 'Đoạn thường', exact: true }).click();
  await line('Chữ đậm', 'Đậm');
  await line('Chữ nghiêng', 'Nghiêng');
  await line('Gạch chân', 'Gạch chân');
  await line('Màu đỏ', 'Màu chữ: Đỏ');
  await step.getByRole('button', { name: 'Danh sách gạch đầu dòng', exact: true }).click();
  await box.pressSequentially('Mục một');
  await box.press('Enter');
  await box.press('Enter');
  await step.getByRole('button', { name: 'Danh sách đánh số', exact: true }).click();
  await box.pressSequentially('Số một');
  await box.press('Enter');
  await box.press('Enter');
  await box.pressSequentially('Trang HSK');
  await box.press('Shift+Home');
  await step.getByRole('button', { name: 'Chèn liên kết' }).click();
  await step.getByLabel('Địa chỉ liên kết').fill('javascript:alert(1)');
  await step.getByRole('button', { name: 'Chèn', exact: true }).click();
  await expect(step.getByText('Liên kết phải bắt đầu bằng http:// hoặc https://')).toBeVisible();
  await step.getByLabel('Địa chỉ liên kết').fill('https://hsk.vn');
  await step.getByRole('button', { name: 'Chèn', exact: true }).click();

  await step.getByRole('button', { name: 'Xuất bản' }).click();
  await expect(step.getByText('Đã xuất bản', { exact: true })).toBeVisible();
  const html: string = (await getLesson(page, les.id)).items.find((i: { id: string }) => i.id === id).content.blocks[0].html;
  for (const tag of ['<h3>', '<h4>', '<b>', '<i>', '<u>', '<ul>', '<ol>', '<li>', 'style="color:#dc2626"', 'href="https://hsk.vn"']) {
    expect(html, tag).toContain(tag);
  }
  expect(html).not.toContain('javascript');
  await evidence(page, 'TC-024', 1);

  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  const cls = await newClass(page, cur.id, [hv.who.user.id]);
  await hv.page.goto(S03(cls.id, id));
  const view = hv.page.locator('.st-richtext').first();
  await expect(view.locator('h3')).toHaveText('Tiêu đề lớn');
  await expect(view.locator('h4')).toHaveText('Tiêu đề nhỏ');
  await expect(view.locator('b')).toContainText('Chữ đậm');
  await expect(view.locator('i')).toContainText('Chữ nghiêng');
  await expect(view.locator('u')).toContainText('Gạch chân');
  await expect(view.locator('span[style*="color"]')).toContainText('Màu đỏ');
  await expect(view.locator('ul li')).toContainText('Mục một');
  await expect(view.locator('ol li')).toContainText('Số một');
  await expect(view.getByRole('link', { name: 'Trang HSK' })).toHaveAttribute('href', 'https://hsk.vn');
  await evidence(hv.page, 'TC-024', 2);
});

import { expect, test } from '@playwright/test';
import { T07, addStep, chooseFile, docx, evidence, fileBlock, gvPage, newCurriculum, newLesson, saveStep } from './helpers';

test('[004:AC-6.6] TC-046 a broken DOCX cannot be processed', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Tài liệu', { goal: '', blocks: [fileBlock('document', null)] });
  await page.goto(T07(cur.id, les.id));
  const block = page.locator('.st-block').nth(0);
  const broken = docx(['Một', 'Hai']).subarray(0, 60); // valid zip header, truncated
  await chooseFile(page, block.getByRole('button', { name: 'Chọn tệp' }), {
    name: 'hong.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: Buffer.from(broken),
  });
  await expect(
    block.getByText('Không xử lý được tệp. Hãy kiểm tra tệp rồi tải lên lại (video nên ở dạng MP4 H.264).'),
  ).toBeVisible();
  await expect(block.getByRole('button', { name: 'Thay tệp' })).toHaveCount(0);
  await evidence(page, 'TC-046');
});

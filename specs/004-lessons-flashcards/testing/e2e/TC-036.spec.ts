import { expect, test } from '@playwright/test';
import { T07, addStep, chooseFile, evidence, fileBlock, gvPage, newCurriculum, newLesson, saveStep } from './helpers';

test('[004:AC-5.4] TC-036 a renamed executable is refused as a corrupt document', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Tài liệu', { goal: '', blocks: [fileBlock('document', null)] });
  await page.goto(T07(cur.id, les.id));
  const block = page.locator('.st-block').nth(0);
  const exe = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(2048, 0x90)]);
  await chooseFile(page, block.getByRole('button', { name: 'Chọn tệp' }), {
    name: 'bai.pdf',
    mimeType: 'application/pdf',
    buffer: exe,
  });
  await expect(block.getByText('Tệp bị hỏng hoặc không đúng định dạng Tài liệu.')).toBeVisible();
  await expect(block.getByRole('button', { name: 'Thay tệp' })).toHaveCount(0);
  await expect(block.getByRole('button', { name: 'Chọn tệp', exact: true })).toBeVisible();
  await evidence(page, 'TC-036');
});

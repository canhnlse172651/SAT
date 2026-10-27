import { expect, test } from '@playwright/test';
import { MB, T07, addStep, chooseFile, deck, evidence, gvPage, newCurriculum, newLesson, padded, saveStep, wav } from './helpers';

test('[004:AC-11.3] TC-068 deck name, card fields and card files with their limits', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Bước', { goal: '', blocks: [deck([{ id: 'c1', front: '', meaning: '' }], 'Tên cũ')] });
  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 1' });
  await step.getByRole('button', { name: 'Soạn bộ thẻ' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Tên bộ thẻ').fill('');
  await dialog.getByRole('button', { name: 'Xong' }).click();
  await expect(step.locator('.st-block').nth(0)).toContainText('Bộ thẻ · 1 thẻ');

  await step.getByRole('button', { name: 'Soạn bộ thẻ' }).click();
  await dialog.getByLabel('Mặt trước (chữ Hán) *').fill('你好');
  await dialog.getByLabel('Pinyin', { exact: true }).fill('nǐ hǎo');
  await dialog.getByLabel('Nghĩa *').fill('xin chào');
  await dialog.getByLabel('Ví dụ').fill('你好，老师！');
  await chooseFile(page, dialog.getByRole('button', { name: 'Hình ảnh' }), {
    name: 'anh3.png',
    mimeType: 'image/png',
    buffer: padded('png', 3 * MB),
  });
  await expect(dialog.getByRole('button', { name: 'Thay hình ảnh' })).toBeVisible();
  await chooseFile(page, dialog.getByRole('button', { name: 'Âm thanh' }), {
    name: 'am.wav',
    mimeType: 'audio/wav',
    buffer: wav(1),
  });
  await expect(dialog.getByRole('button', { name: 'Thay âm thanh' })).toBeVisible();
  await evidence(page, 'TC-068', 1);

  await chooseFile(page, dialog.getByRole('button', { name: 'Thay hình ảnh' }), {
    name: 'anh6.png',
    mimeType: 'image/png',
    buffer: padded('png', 6 * MB),
  });
  await expect(dialog.getByText('Tệp anh6.png (6 MB) vượt quá giới hạn 5 MB của khối Hình ảnh.')).toBeVisible();
  await chooseFile(page, dialog.getByRole('button', { name: 'Thay âm thanh' }), {
    name: 'am.ogg',
    mimeType: 'audio/ogg',
    buffer: Buffer.from('OggS'),
  });
  await expect(dialog.getByText('Định dạng không được hỗ trợ. Khối Âm thanh chỉ nhận: MP3, M4A, WAV.')).toBeVisible();
  await evidence(page, 'TC-068', 2);
});

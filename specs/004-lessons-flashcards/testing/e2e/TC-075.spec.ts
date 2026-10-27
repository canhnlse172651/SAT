import { expect, test } from '@playwright/test';
import { T07, addStep, chooseFile, deck, evidence, gvPage, newCurriculum, newLesson, saveStep, xlsx } from './helpers';

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const HEAD = ['Chữ Hán', 'Pinyin', 'Loại từ', 'Nghĩa tiếng Việt', 'Ví dụ'];

test('[004:AC-12.5] [004:AC-12.6] TC-075 capacity of the deck; a file without valid rows', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Bước', {
    goal: '',
    blocks: [deck(Array.from({ length: 198 }, (_, i) => ({ id: `c${i}`, front: '字', pinyin: `zi${i}`.replace(/\d/g, ''), meaning: `nghĩa ${i}` })))],
  });
  await page.goto(T07(cur.id, les.id));
  await page.getByRole('button', { name: 'Soạn bộ thẻ' }).click();
  const dialog = page.getByRole('dialog');
  const five = xlsx([HEAD, ...['一', '二', '三', '四', '五'].map((h, i) => [h, '', '', `số ${i + 1}`, ''])]);
  await chooseFile(page, dialog.getByRole('button', { name: 'Nhập từ Excel' }), { name: 'nam.xlsx', mimeType: XLSX, buffer: five });
  await dialog.getByRole('button', { name: 'Thêm 5 từ hợp lệ' }).click();
  await expect(dialog.getByText('Chỉ còn chỗ cho 2 từ nhưng tệp có 5 dòng hợp lệ.')).toBeVisible();
  await expect(dialog.getByLabel('Mặt trước (chữ Hán) *')).toHaveCount(198);
  await evidence(page, 'TC-075', 1);

  const bad = xlsx([HEAD, ['abc', '', '', 'x', ''], ['水', '', '', '', '']]);
  await chooseFile(page, dialog.getByRole('button', { name: 'Nhập từ Excel' }), { name: 'loi.xlsx', mimeType: XLSX, buffer: bad });
  await expect(dialog.getByText('Tệp không có dòng hợp lệ nào để nhập.')).toBeVisible();
  await expect(dialog.getByText('Dòng 2: Chữ Hán không chứa chữ Hán nào')).toBeVisible();
  await expect(dialog.getByText('Dòng 3: Thiếu Nghĩa tiếng Việt')).toBeVisible();
  await expect(dialog.getByRole('button', { name: /^Thêm \d+ từ hợp lệ$/ })).toHaveCount(0);
  await evidence(page, 'TC-075', 2);
});

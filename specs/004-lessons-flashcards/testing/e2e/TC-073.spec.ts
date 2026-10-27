import { expect, test } from '@playwright/test';
import { MB, T07, addStep, chooseFile, deck, evidence, gvPage, newCurriculum, newLesson, saveStep, xlsx } from './helpers';

test('[004:AC-12.2] TC-073 an import file that is not the template is refused whole', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Bước', { goal: '', blocks: [deck([{ id: 'c1', front: '你', meaning: 'bạn' }])] });
  await page.goto(T07(cur.id, les.id));
  await page.getByRole('button', { name: 'Soạn bộ thẻ' }).click();
  const dialog = page.getByRole('dialog');
  const importButton = dialog.getByRole('button', { name: 'Nhập từ Excel' });
  const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  await chooseFile(page, importButton, { name: 'tu.csv', mimeType: 'text/csv', buffer: Buffer.from('Chữ Hán,Nghĩa\n你,bạn') });
  await expect(dialog.getByText('Chỉ hỗ trợ tệp Excel .xlsx tối đa 5 MB.')).toBeVisible();
  const big = Buffer.concat([xlsx([['Chữ Hán', 'Nghĩa tiếng Việt']]), Buffer.alloc(6 * MB)]);
  await chooseFile(page, importButton, { name: 'lon.xlsx', mimeType: XLSX, buffer: big });
  await expect(dialog.getByText('Chỉ hỗ trợ tệp Excel .xlsx tối đa 5 MB.')).toBeVisible();
  await chooseFile(page, importButton, {
    name: 'thieu.xlsx',
    mimeType: XLSX,
    buffer: xlsx([['Chữ Hán', 'Pinyin'], ['你', 'nǐ']]),
  });
  await expect(dialog.getByText('Tệp không đúng mẫu: thiếu cột “Nghĩa tiếng Việt”. Hãy dùng file mẫu.')).toBeVisible();
  await expect(dialog.getByLabel('Mặt trước (chữ Hán) *')).toHaveCount(1);
  await evidence(page, 'TC-073');
});

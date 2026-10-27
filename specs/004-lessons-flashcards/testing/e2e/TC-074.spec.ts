import { expect, test } from '@playwright/test';
import { T07, addStep, chooseFile, deck, evidence, gvPage, newCurriculum, newLesson, saveStep, vocab, xlsx } from './helpers';

const FILE = xlsx([
  ['Chữ Hán', 'Pinyin', 'Loại từ', 'Nghĩa tiếng Việt', 'Ví dụ'],
  ['你好', 'nǐ hǎo', '', 'xin chào', ''], // line 2: duplicate of the existing entry
  ['谢谢', 'xie4 xie5', 'danh từ', 'cảm ơn', ''], // line 3
  ['学生', 'xuésheng', 'Danh từ', 'học sinh', ''],
  ['老师', 'lǎoshī', '', 'giáo viên', ''],
  ['', '', '', '', ''], // line 6: empty
  ['书', 'shū', '', 'sách', ''],
  ['水', 'shuǐ', '', '', ''], // line 8: no meaning
  ['茶', 'chá', '', '', ''], // line 9: no meaning
  ['猫', 'māo', '', 'mèo', ''],
  ['狗', 'gǒu', '', 'chó', ''],
]);
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

test('[004:AC-12.3] [004:AC-12.4] TC-074 import preview, then the valid rows are added', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Bước', {
    goal: '',
    blocks: [
      deck([{ id: 'c1', front: '你好', pinyin: 'nǐ hǎo', meaning: 'xin chào' }]),
      vocab([{ hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'xin chào' }]),
    ],
  });
  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 1' });
  await step.getByRole('button', { name: 'Soạn bộ thẻ' }).click();
  const dialog = page.getByRole('dialog');
  await chooseFile(page, dialog.getByRole('button', { name: 'Nhập từ Excel' }), { name: 'tu.xlsx', mimeType: XLSX, buffer: FILE });
  const preview = dialog.getByRole('region', { name: 'Xem trước dữ liệu nhập' });
  await expect(preview.getByText('6 dòng hợp lệ · 2 dòng lỗi · 1 dòng trùng')).toBeVisible();
  await expect(preview.getByText('Dòng 8: Thiếu Nghĩa tiếng Việt')).toBeVisible();
  await expect(preview.getByText('Dòng 9: Thiếu Nghĩa tiếng Việt')).toBeVisible();
  await expect(preview.getByText(/Dòng 2: 你好 nǐ hǎo — trùng, bỏ qua/)).toBeVisible();
  await expect(dialog.getByLabel('Mặt trước (chữ Hán) *')).toHaveCount(1);
  await evidence(page, 'TC-074', 1);
  await preview.getByRole('button', { name: 'Thêm 6 từ hợp lệ' }).click();
  await expect(page.getByText('Đã thêm 6 từ. Hãy lưu để giữ thay đổi.')).toBeVisible();
  const fronts = dialog.getByLabel('Mặt trước (chữ Hán) *');
  await expect(fronts).toHaveCount(7);
  await expect(fronts.nth(1)).toHaveValue('谢谢');
  await expect(dialog.getByLabel('Pinyin', { exact: true }).nth(1)).toHaveValue('xiè xie');
  await expect(fronts.nth(6)).toHaveValue('狗');
  await dialog.getByRole('button', { name: 'Xong' }).click();

  const vocabBlock = step.locator('.st-block').nth(1);
  await chooseFile(page, vocabBlock.getByRole('button', { name: 'Nhập từ Excel' }), { name: 'tu.xlsx', mimeType: XLSX, buffer: FILE });
  await vocabBlock.getByRole('button', { name: 'Thêm 6 từ hợp lệ' }).click();
  await expect(step.getByLabel(/^Chữ Hán của từ \d+$/)).toHaveCount(7);
  await expect(step.getByLabel('Loại từ của từ 2')).toHaveValue('Danh từ');
  await expect(step.getByLabel('Pinyin của từ 2')).toHaveValue('xiè xie');
  await expect(step.getByText('Chưa lưu', { exact: true })).toBeVisible();
  await evidence(page, 'TC-074', 2);
});

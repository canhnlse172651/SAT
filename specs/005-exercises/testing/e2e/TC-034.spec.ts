import { expect, test } from '@playwright/test';
import { T09, draftSet, evidence, gvPage, newCurriculum, newLesson, set, setBlock, vocab } from './helpers';

test('[005:AC-5.2] [005:AC-5.3] [005:AC-5.4] TC-034 vocabulary rules', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const opts = (a: string, b: string) => [{ text: a, correct: true }, { text: b }];
  await draftSet(
    page,
    les.id,
    'Bộ từ vựng',
    set([
      vocab('meaning', { wordPinyin: 'nǐ hǎo' }, opts('xin chào', 'tạm biệt')),
      vocab('hanzi', {}, opts('你好', '再见')),
      vocab('meaning', { word: '你好' }, opts('xin chào', 'tạm biệt')),
      vocab('hanzi', { meaning: 'xin chào' }, opts('你好', '再见')),
      vocab('pinyin', { word: '你好' }, opts('nǐ hǎo', 'zài jiàn')),
    ]),
  );
  await page.goto(T09(cur.id, les.id));
  const block = setBlock(page, 1);
  const q = (n: number) => block.getByRole('region', { name: `Câu ${n}`, exact: true });
  const leave = () => block.getByLabel('Tiêu đề', { exact: true }).focus();

  // 1. Chọn nghĩa without a word.
  await expect(q(1)).toContainText('Hãy nhập Từ (chữ Hán)');
  // 2. Chọn chữ Hán without pinyin and meaning.
  await expect(q(2)).toContainText('Hãy nhập Pinyin hoặc Nghĩa của từ');
  // 3. Word "ni好".
  await q(3).getByRole('textbox', { name: 'Từ (chữ Hán)', exact: true }).fill('ni好');
  await leave();
  await expect(q(3)).toContainText('Từ chỉ được chứa chữ Hán');
  // 4. Chọn chữ Hán option "abc".
  await q(4).getByRole('textbox', { name: 'Phương án A' }).fill('abc');
  await leave();
  await expect(q(4)).toContainText('Phương án A chỉ được chứa chữ Hán');
  // 5. Chọn pinyin option "hǎu".
  await q(5).getByRole('textbox', { name: 'Phương án A' }).fill('hǎu');
  await leave();
  await expect(q(5)).toContainText('Pinyin không hợp lệ: hǎu');
  await evidence(page, 'TC-034');
});

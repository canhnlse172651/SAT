import { expect, test } from '@playwright/test';
import { S05, classWithSets, cloze, evidence, gvPage, hvPage, mcq, reading, set } from './helpers';

test('[005:AC-11.3] [005:AC-11.4] TC-054 reading: numbering, passage, pinyin', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const subs = () => [mcq('小明 là ai?', [{ text: 'Giáo viên' }, { text: 'Học sinh', correct: true }]), cloze('Tên', '小[[明]]')];
  const d = await classWithSets(gv, [
    {
      title: 'Bộ đọc',
      content: set([
        mcq('Câu đầu', [{ text: 'Đúng', correct: true }, { text: 'Sai' }]),
        reading('Đọc và trả lời', '我叫小明。我是学生。', subs(), 'Wǒ jiào Xiǎo Míng. Wǒ shì xuésheng.'),
        reading('Đọc không phiên âm', '他是老师。', subs()),
      ]),
    },
  ]);
  const { page } = await hvPage(browser, d.students[0]!);
  await page.goto(S05(d.cls, d.sets[0]!));
  await page.getByRole('button', { name: 'Bắt đầu làm' }).click();
  await page.getByRole('button', { name: 'Câu 2 · chưa trả lời' }).click();

  // 1. Sub-questions 2.1, 2.2; answer 2.1; the passage stays; pinyin hidden by default.
  await expect(page.getByRole('heading', { name: 'Câu 2.1' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Câu 2.2' })).toBeVisible();
  await page.getByRole('region', { name: 'Câu 2.1', exact: true }).getByRole('radio', { name: /^B\s*Học sinh/ }).click();
  await expect(page.getByText('我叫小明。我是学生。')).toBeVisible();
  await expect(page.getByText('Wǒ jiào Xiǎo Míng. Wǒ shì xuésheng.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Hiện pinyin' }).click();
  await expect(page.getByText('Wǒ jiào Xiǎo Míng. Wǒ shì xuésheng.')).toBeVisible();
  await evidence(page, 'TC-054', 1);
  await page.getByRole('button', { name: 'Ẩn pinyin' }).click();
  await expect(page.getByText('Wǒ jiào Xiǎo Míng. Wǒ shì xuésheng.')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Câu 2.1', exact: true }).getByRole('radio', { name: /^B\s*Học sinh/ })).toBeChecked();
  // 2. Question 3 has no pinyin button.
  await page.getByRole('button', { name: 'Câu sau' }).click();
  await expect(page.getByText('他是老师。')).toBeVisible();
  await expect(page.getByRole('button', { name: /pinyin/ })).toHaveCount(0);
  await evidence(page, 'TC-054', 2);
});

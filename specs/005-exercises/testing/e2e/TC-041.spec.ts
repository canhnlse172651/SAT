import { expect, test } from '@playwright/test';
import { S05, classWithSets, evidence, gvPage, hvPage, set, vocab, write } from './helpers';

test('[005:AC-7.5] TC-041 pinyin with tone marks for the HV', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [
    {
      title: 'Bộ pinyin',
      content: set([
        write('Viết chữ Hán', 'ni3  hao3', ['你好']),
        vocab('meaning', { word: '绿', wordPinyin: 'lv4' }, [{ text: 'xanh lá', correct: true }, { text: 'đỏ' }]),
      ]),
    },
  ]);
  const { page } = await hvPage(browser, d.students[0]!);
  await page.goto(S05(d.cls, d.sets[0]!));
  await page.getByRole('button', { name: 'Bắt đầu làm' }).click();
  const pinyin = page.locator('.qv-pinyin');
  await expect(pinyin).toHaveText('nǐ  hǎo', { useInnerText: false });
  expect(await pinyin.textContent()).toBe('nǐ  hǎo');
  await evidence(page, 'TC-041', 1);
  await page.getByRole('button', { name: 'Câu sau' }).click();
  await expect(page.locator('.qv-pinyin')).toHaveText('lǜ');
  await evidence(page, 'TC-041', 2);
});

import { expect, test } from '@playwright/test';
import { T07, addStep, deck, evidence, gvPage, newCurriculum, newLesson, saveStep, vocab } from './helpers';

const CASES: [string, string][] = [
  ['ni3 hao3', 'nǐ hǎo'],
  ['lv4', 'lǜ'],
  ['ma5', 'ma'],
  ['nǐ hao3', 'nǐ hǎo'],
];

test('[004:AC-4.5] TC-031 tone numbers become tone marks when leaving a pinyin field', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Pinyin', {
    goal: '',
    blocks: [
      vocab([{ hanzi: '你好', meaning: 'x' }]),
      { id: 'g', type: 'grammar', name: 'M', examples: [{ sentence: '吗' }] },
      { id: 'd', type: 'dialogue', lines: [{ hanzi: '你好' }] },
      deck([{ id: 'c1', front: '你', meaning: 'bạn' }]),
    ],
  });
  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 1' });
  const check = async (field: ReturnType<typeof step.getByLabel>) => {
    for (const [typed, shown] of CASES) {
      await field.fill(typed);
      await field.blur();
      await expect(field).toHaveValue(shown);
    }
  };
  await check(step.getByLabel('Pinyin của từ 1'));
  await check(step.getByLabel('Pinyin ví dụ 1'));
  await check(step.getByLabel('Pinyin lời 1'));
  await step.getByRole('button', { name: 'Soạn bộ thẻ' }).click();
  const dialog = page.getByRole('dialog');
  await check(dialog.getByLabel('Pinyin', { exact: true }));
  await evidence(page, 'TC-031');
});

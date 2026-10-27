import { expect, test } from '@playwright/test';
import {
  S03,
  S04,
  T07,
  deck,
  evidence,
  gvPage,
  hvPage,
  newClass,
  newCurriculum,
  newLesson,
  publishLesson,
  publishedStep,
  text,
  vocab,
} from './helpers';

const MIX = '你好 nǐ hǎo – xin chào';
const MARKS = 'lǜ ǖ ǘ ǚ ǜ ā á ǎ à';
const VI = 'Tiếng Việt có dấu: ắ ặ ề ộ ữ đ';

test('[004:AC-3.6] [004:NFR-5] TC-025 Hanzi, tone marks and Vietnamese kept everywhere', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await publishedStep(page, les.id, `Bước ${MIX}`, [
    text(`<p>${MIX}</p><p>${MARKS}</p><p>${VI}</p>`),
    vocab([{ hanzi: '绿', pinyin: 'lǜ', meaning: VI, example: MIX }]),
    {
      id: 'd',
      type: 'dialogue',
      kind: 'dialogue',
      title: '',
      lines: [{ speaker: 'A', hanzi: '你好', pinyin: MARKS, translation: VI }],
    },
    deck([{ id: 'c1', front: '你好', pinyin: 'nǐ hǎo', meaning: VI, example: MIX }]),
  ]);
  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  const cls = await newClass(page, cur.id, [hv.who.user.id]);

  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 1' });
  await expect(step.getByLabel('Tên bước học')).toHaveValue(`Bước ${MIX}`);
  await expect(step.getByRole('textbox', { name: 'Nội dung khối 1' })).toContainText(MARKS);
  await expect(step.getByLabel('Nghĩa của từ 1')).toHaveValue(VI);
  await expect(step.getByLabel('Pinyin lời 1')).toHaveValue(MARKS);

  await hv.page.goto(S03(cls.id, id));
  const main = hv.page.locator('main');
  for (const s of [MIX, MARKS, VI]) await expect(main.getByText(s).first()).toBeVisible();
  await evidence(hv.page, 'TC-025', 1);
  await hv.page.goto(S04(cls.id, id, 'k'));
  await hv.page.getByRole('button', { name: /^Mặt trước/ }).click();
  await expect(hv.page.getByText(VI)).toBeVisible();
  await expect(hv.page.getByText(MIX)).toBeVisible();
  await evidence(hv.page, 'TC-025', 2);
});

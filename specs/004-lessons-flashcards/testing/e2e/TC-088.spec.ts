import { type Locator, expect, test } from '@playwright/test';
import {
  S03,
  evidence,
  gvPage,
  hvPage,
  newClass,
  newCurriculum,
  newLesson,
  publishLesson,
  publishedStep,
  vocab,
} from './helpers';

const fontPx = (l: Locator) => l.evaluate((e) => parseFloat(getComputedStyle(e).fontSize));

test('[004:AC-15.1] [004:AC-15.2] [004:AC-15.3] [004:AC-15.4] TC-088 vocabulary, grammar and dialogue views; switches remembered', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const step = await publishedStep(page, les.id, 'Ba loại khối', [
    vocab([
      { hanzi: '你好', pinyin: 'nǐ hǎo', pos: 'Cụm từ', meaning: 'xin chào', example: '你好，老师！' },
      { hanzi: '书', pinyin: 'shū', pos: '', meaning: 'sách', example: '' },
    ]),
    {
      id: 'g',
      type: 'grammar',
      name: 'Câu hỏi với 吗',
      structure: 'Chủ ngữ + Động từ + 吗？',
      explanation: '<p>Thêm <b>吗</b> cuối câu.</p>',
      examples: [{ sentence: '你好吗？', pinyin: 'nǐ hǎo ma?', meaning: 'Bạn khỏe không?' }],
    },
    { id: 'd1', type: 'dialogue', kind: 'dialogue', title: 'Gặp nhau', lines: [{ speaker: 'An', hanzi: '你好！', pinyin: 'nǐ hǎo!', translation: 'Xin chào!' }] },
    { id: 'd2', type: 'dialogue', kind: 'passage', title: '', lines: [{ hanzi: '我是学生。', pinyin: 'wǒ shì xuésheng.', translation: 'Tôi là học sinh.' }] },
  ]);
  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  await hv.page.setViewportSize({ width: 360, height: 780 });
  const cls = await newClass(page, cur.id, [hv.who.user.id]);
  await hv.page.goto(S03(cls.id, step));

  const rows = hv.page.locator('.sv-vocab__row');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText('你好');
  await expect(rows.nth(0)).toContainText('nǐ hǎo');
  await expect(rows.nth(0)).toContainText('Cụm từ');
  await expect(rows.nth(0)).toContainText('xin chào');
  await expect(rows.nth(0)).toContainText('你好，老师！');
  expect(await fontPx(rows.nth(0).locator('[lang="zh-Hans"]').first())).toBeGreaterThanOrEqual(24);
  expect((await rows.nth(1).innerText()).split('\n').filter((l) => l.trim())).toEqual(['书', 'shū', 'sách']);
  expect(await hv.page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);

  await expect(hv.page.getByRole('heading', { name: 'Câu hỏi với 吗' })).toBeVisible();
  await expect(hv.page.locator('.sv-struct')).toHaveText('Chủ ngữ + Động từ + 吗？');
  await expect(hv.page.locator('.sv-card b', { hasText: '吗' })).toBeVisible();
  await expect(hv.page.getByText('Bạn khỏe không?')).toBeVisible();

  await expect(hv.page.getByRole('heading', { name: 'Hội thoại · Gặp nhau' })).toBeVisible();
  await expect(hv.page.getByRole('heading', { name: 'Bài khóa' })).toBeVisible();
  const who = hv.page.locator('.sv-line__who', { hasText: 'An' });
  expect(await who.evaluate((e) => parseInt(getComputedStyle(e).fontWeight))).toBeGreaterThanOrEqual(600);
  const han = hv.page.locator('.sv-line__han').first();
  expect(await fontPx(han)).toBeGreaterThanOrEqual(20);
  const hanBox = await han.boundingBox();
  const pyBox = await hv.page.getByText('nǐ hǎo!').boundingBox();
  const trBox = await hv.page.getByText('Xin chào!').boundingBox();
  expect(pyBox!.y).toBeGreaterThan(hanBox!.y);
  expect(trBox!.y).toBeGreaterThan(pyBox!.y);
  const pinyinSwitches = hv.page.getByRole('switch', { name: 'Pinyin' });
  await expect(pinyinSwitches.first()).toBeChecked();
  await expect(hv.page.getByRole('switch', { name: 'Bản dịch' }).first()).toBeChecked();
  await evidence(hv.page, 'TC-088', 1);

  await pinyinSwitches.first().click();
  await hv.page.getByRole('switch', { name: 'Bản dịch' }).first().click();
  await expect(hv.page.getByText('nǐ hǎo!')).toHaveCount(0);
  await expect(hv.page.getByText('wǒ shì xuésheng.')).toHaveCount(0);
  await expect(hv.page.getByText('Tôi là học sinh.')).toHaveCount(0);
  await hv.page.reload();
  await expect(hv.page.getByText('我是学生。')).toBeVisible();
  await expect(hv.page.getByText('wǒ shì xuésheng.')).toHaveCount(0);
  await expect(hv.page.getByRole('switch', { name: 'Pinyin' }).first()).not.toBeChecked();
  await evidence(hv.page, 'TC-088', 2);
});

import { expect, test } from '@playwright/test';
import {
  S03,
  deck,
  evidence,
  gvPage,
  hvPage,
  newClass,
  newCurriculum,
  newLesson,
  png,
  publishLesson,
  publishedStep,
  upload,
  wav,
} from './helpers';

test('[004:AC-16.1] [004:AC-16.2] [004:AC-16.3] [004:AC-16.4] TC-089 deck summary, card faces, flip and audio', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const audio = await upload(page, 'cardAudio', 'ni.wav', wav(1));
  const image = await upload(page, 'cardImage', 'hao.png', png());
  const step = await publishedStep(page, les.id, 'Thẻ', [
    deck(
      [
        { id: 'c1', front: '你', pinyin: 'nǐ', meaning: 'bạn', example: '你好！', audio: audio.body },
        { id: 'c2', front: '好', pinyin: 'hǎo', meaning: 'tốt', example: '很好。', image: image.body },
        { id: 'c3', front: '我', pinyin: 'wǒ', meaning: 'tôi' },
        { id: 'c4', front: '他', pinyin: 'tā', meaning: 'anh ấy' },
        { id: 'c5', front: '她', pinyin: 'tā', meaning: 'cô ấy' },
      ],
      'Từ mới bài 1',
    ),
  ]);
  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  const cls = await newClass(page, cur.id, [hv.who.user.id]);
  await hv.page.goto(S03(cls.id, step));
  await expect(hv.page.getByText('Từ mới bài 1')).toBeVisible();
  await expect(hv.page.getByText('5 thẻ · Đã thuộc 0/5')).toBeVisible();
  await hv.page.getByRole('button', { name: 'Học flashcard' }).click();

  await expect(hv.page).toHaveURL(/\/the-tu\?khoi=k$/);
  await expect(hv.page.getByText('Thẻ 1/5')).toBeVisible();
  await expect(hv.page.getByText('Chưa đánh dấu', { exact: true })).toBeVisible();
  const card = hv.page.getByRole('button', { name: /^Mặt (trước|sau)/ });
  await expect(card).toHaveAccessibleName(/Mặt trước: 你/);
  const front = card.locator('[lang="zh-Hans"]').first();
  expect(await front.evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(48);
  await expect(hv.page.getByRole('button', { name: 'Phát âm 你' })).toBeVisible();
  await expect(hv.page.getByRole('button', { name: 'Thẻ trước' })).toBeDisabled();
  await expect(hv.page.getByRole('button', { name: 'Thẻ sau' })).toBeVisible();
  await evidence(hv.page, 'TC-089', 1);

  await card.click();
  await expect(card).toContainText('nǐ');
  await expect(card).toContainText('bạn');
  await expect(card).toContainText('你好！');
  await card.click();
  await expect(card).toHaveAccessibleName(/Mặt trước: 你/);
  await hv.page.getByRole('button', { name: 'Lật thẻ', exact: true }).click();
  await expect(card).toHaveAccessibleName(/Mặt sau/);

  const played: string[] = [];
  await hv.page.exposeFunction('onPlayed', (src: string) => played.push(src));
  await hv.page.evaluate(() => {
    const orig = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      (window as unknown as { onPlayed: (s: string) => void }).onPlayed(this.currentSrc || this.src);
      this.muted = true;
      return orig.call(this);
    };
  });
  await hv.page.getByRole('button', { name: 'Phát âm 你' }).click();
  await expect.poll(() => played.length).toBe(1);
  await hv.page.getByRole('button', { name: 'Thẻ sau' }).click();
  await expect(hv.page.getByText('Thẻ 2/5')).toBeVisible();
  await card.click();
  await expect(card.locator('img')).toBeVisible();
  await hv.page.waitForTimeout(500);
  expect(played.length).toBe(1);
  await evidence(hv.page, 'TC-089', 2);
});

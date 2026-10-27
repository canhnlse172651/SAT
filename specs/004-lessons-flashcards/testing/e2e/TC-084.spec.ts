import { expect, test } from '@playwright/test';
import {
  S03,
  evidence,
  fileBlock,
  gvPage,
  hvPage,
  newClass,
  newCurriculum,
  newLesson,
  publishLesson,
  publishedStep,
  upload,
  wav,
  webm,
} from './helpers';

test('[004:AC-14.2] [004:AC-14.3] TC-084 video and audio players: controls, speeds, one at a time', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await page.goto('/gv');
  const v1 = await upload(page, 'video', 'mot.webm', await webm(page, 2500));
  const v2 = await upload(page, 'video', 'hai.webm', await webm(page, 2500));
  const a1 = await upload(page, 'audio', 'am.wav', wav(3));
  const step = await publishedStep(page, les.id, 'Nghe nhìn', [
    fileBlock('video', v1.body, 'Video 1', 'v1'),
    fileBlock('video', v2.body, 'Video 2', 'v2'),
    fileBlock('audio', a1.body, 'Bài nghe', 'a1'),
  ]);
  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  const cls = await newClass(page, cur.id, [hv.who.user.id]);
  await hv.page.goto(S03(cls.id, step));

  const videos = hv.page.locator('video');
  const audio = hv.page.locator('audio');
  await expect(videos).toHaveCount(2);
  await expect(audio).toHaveCount(1);
  for (const media of [videos.nth(0), videos.nth(1), audio.nth(0)]) {
    await expect(media).toHaveAttribute('controls', '');
    await expect(media).toHaveAttribute('controlslist', /nodownload/);
    expect(await media.evaluate((m: HTMLMediaElement) => m.autoplay || !m.paused)).toBe(false);
  }
  await expect(videos.nth(0)).not.toHaveAttribute('controlslist', /nofullscreen/);
  const speeds = hv.page.getByLabel('Tốc độ phát').first();
  await expect(speeds.locator('option')).toHaveText(['0,5×', '0,75×', '1×', '1,25×', '1,5×']);
  await expect(speeds).toHaveValue('1');
  await speeds.selectOption({ label: '1,5×' });
  expect(await videos.nth(0).evaluate((m: HTMLMediaElement) => m.playbackRate)).toBe(1.5);
  await evidence(hv.page, 'TC-084', 1);

  await videos.nth(0).evaluate(async (m: HTMLMediaElement) => {
    m.muted = true;
    await m.play();
  });
  await expect.poll(() => videos.nth(0).evaluate((m: HTMLMediaElement) => m.paused)).toBe(false);
  await audio.nth(0).evaluate(async (m: HTMLMediaElement) => {
    m.muted = true;
    await m.play();
  });
  await expect.poll(() => videos.nth(0).evaluate((m: HTMLMediaElement) => m.paused)).toBe(true);
  expect(await audio.nth(0).evaluate((m: HTMLMediaElement) => m.paused)).toBe(false);
  await evidence(hv.page, 'TC-084', 2);
});

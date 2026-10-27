import { type Page, expect, test } from '@playwright/test';
import {
  S03,
  S04,
  deck,
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
  webm,
} from './helpers';

/** Simulated 4G (10 Mbps down, RTT 100 ms) and a mid-range phone CPU (4× slower). */
async function phone(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 100,
    downloadThroughput: (10 * 1024 * 1024) / 8,
    uploadThroughput: (5 * 1024 * 1024) / 8,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
}

const p95 = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.ceil(xs.length * 0.95) - 1]!;

test('[004:NFR-1] [004:NFR-2] TC-098 S03 / S04 response times on a simulated 4G phone', async ({ browser }) => {
  test.setTimeout(240_000);
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await page.goto('/gv');
  const video = await upload(page, 'video', 'bai.webm', await webm(page, 2000));
  const lines = Array.from({ length: 100 }, (_, i) => ({ speaker: i % 2 ? 'B' : 'A', hanzi: `你好${i}`, pinyin: 'nǐ hǎo', translation: `Xin chào ${i}` }));
  const one = await publishedStep(page, les.id, 'Hội thoại dài', [
    { id: 'd', type: 'dialogue', kind: 'dialogue', title: '', lines },
    fileBlock('video', video.body, 'Video', 'v'),
  ]);
  const cards = Array.from({ length: 200 }, (_, i) => ({ id: `c${i}`, front: '字', pinyin: 'zì', meaning: `nghĩa ${i}` }));
  const two = await publishedStep(page, les.id, 'Bộ 200 thẻ', [deck(cards)]);
  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  const cls = await newClass(page, cur.id, [hv.who.user.id]);
  const p = hv.page;
  await phone(p);

  const open: number[] = [];
  for (let i = 0; i < 5; i++) {
    const t0 = Date.now();
    await p.goto(S03(cls.id, one));
    await expect(p.getByRole('heading', { name: 'Hội thoại dài' })).toBeVisible();
    await expect(p.getByText('你好0')).toBeVisible();
    open.push(Date.now() - t0);
  }
  const next: number[] = [];
  for (let i = 0; i < 3; i++) {
    await p.goto(S03(cls.id, one));
    await expect(p.getByText('你好0')).toBeVisible();
    const t0 = Date.now();
    await p.getByRole('button', { name: /Tiếp ›/ }).click();
    await expect(p.getByRole('heading', { name: 'Bộ 200 thẻ' })).toBeVisible();
    next.push(Date.now() - t0);
  }
  await p.goto(S03(cls.id, one));
  await expect(p.getByText('你好0')).toBeVisible();
  const toggle: number[] = [];
  for (let i = 0; i < 6; i++) {
    toggle.push(
      await p.evaluate(async () => {
        const sw = document.querySelector('[role="switch"]') as HTMLElement;
        const t0 = performance.now();
        sw.click();
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        return performance.now() - t0;
      }),
    );
  }
  const playStart = await p.locator('video').evaluate(async (v: HTMLVideoElement) => {
    v.muted = true;
    const t0 = performance.now();
    await new Promise<void>((resolve) => {
      v.addEventListener('playing', () => resolve(), { once: true });
      void v.play();
    });
    return performance.now() - t0;
  });

  await p.goto(S04(cls.id, two, 'k'));
  await expect(p.getByText('Thẻ 1/200')).toBeVisible();
  const flip: number[] = [];
  for (let i = 0; i < 10; i++) {
    flip.push(
      await p.evaluate(async (useNext) => {
        const btn = useNext
          ? (document.querySelector('[aria-label="Thẻ sau"]') as HTMLElement)
          : (document.querySelector('.fc-card') as HTMLElement);
        const t0 = performance.now();
        btn.click();
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        return performance.now() - t0;
      }, i % 2 === 1),
    );
  }
  const markSaved: number[] = [];
  for (let i = 0; i < 5; i++) {
    const t0 = Date.now();
    const saved = p.waitForResponse((r) => r.url().includes('/api/learn/marks') && r.status() === 204);
    await p.getByRole('button', { name: 'Đã thuộc', exact: true }).click();
    await saved;
    markSaved.push(Date.now() - t0);
  }
  const report = { open: p95(open), next: p95(next), toggle: p95(toggle), playStart, flip: p95(flip), markSaved: p95(markSaved) };
  console.log('NFR-1/2 p95 (ms)', JSON.stringify(report));
  test.info().annotations.push({ type: 'measurements', description: JSON.stringify(report) });
  await evidence(p, 'TC-098');
  expect.soft(report.open, 'S03 first block').toBeLessThanOrEqual(3000);
  expect.soft(report.next, '"Tiếp"').toBeLessThanOrEqual(3000);
  expect.soft(report.toggle, 'Pinyin switch on 100 lines').toBeLessThanOrEqual(100);
  expect.soft(report.playStart, 'video starts').toBeLessThanOrEqual(4000);
  expect.soft(report.flip, 'flip / next card').toBeLessThanOrEqual(100);
  expect.soft(report.markSaved, 'mark saved').toBeLessThanOrEqual(2000);
});

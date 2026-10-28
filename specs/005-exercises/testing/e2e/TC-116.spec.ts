/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { type Page, expect, test } from '@playwright/test';
import { S05, T14, classWithSets, doSet, evidence, gvPage, hvPage, mcq, p95, set, setContent } from './helpers';

/** 10 Mbps both ways, 100 ms latency (Chromium network emulation). */
async function slow(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 100,
    downloadThroughput: (10 * 1024 * 1024) / 8,
    uploadThroughput: (10 * 1024 * 1024) / 8,
  });
}

test('[005:NFR-2] TC-116 S05 and T14 of a 100-question set on a 10 Mbps / 100 ms network', async ({ browser }) => {
  test.setTimeout(240_000);
  const { page: gv } = await gvPage(browser);
  const qs = Array.from({ length: 100 }, (_, k) => mcq(`Câu ${k + 1}: 你好 nǐ hǎo?`, [{ text: 'Xin chào', correct: true }, { text: 'Tạm biệt' }]));
  const d = await classWithSets(gv, [{ title: 'Bộ 100 câu', content: set(qs) }, { title: 'Bộ 100 câu (2)', content: set(qs.map((q) => ({ ...q, id: `${q.id}b`, options: q.options.map((o: any) => ({ ...o, id: `${o.id}b` })) }))) }]);
  const [setA, setB] = d.sets as [string, string];
  // A submission of 100 questions for T14.
  const saved = (await setContent(gv, d.les, setB)).questions;
  const { page: done } = await hvPage(browser, d.students[1]!);
  await doSet(done, d.cls, setB, Object.fromEntries(saved.map((q: any) => [q.id, { optionIds: [q.options[0].id] }])));

  // 1. HV: open S05, "Bắt đầu làm" until the first question (5 runs, fresh page each).
  const hvTimes: number[] = [];
  for (let k = 0; k < 5; k++) {
    const { page, ctx } = await hvPage(browser, d.students[0]!);
    await slow(page);
    const t0 = Date.now();
    await page.goto(S05(d.cls, setA));
    await page.getByRole('button', { name: /^(Bắt đầu làm|Tiếp tục làm)$/ }).click();
    await expect(page.getByText('Câu 1/100')).toBeVisible({ timeout: 15_000 });
    hvTimes.push(Date.now() - t0);
    if (k === 4) await evidence(page, 'TC-116', 1);
    await ctx.close();
  }
  // 2. GV: T14 of the 100-question submission.
  const gvTimes: number[] = [];
  for (let k = 0; k < 5; k++) {
    const ctx = gv.context();
    const page = await ctx.newPage();
    await slow(page);
    const t0 = Date.now();
    await page.goto(T14(d.cls, d.students[1]!, setB));
    await expect(page.getByText('Câu 100 · Trắc nghiệm')).toBeVisible({ timeout: 15_000 });
    gvTimes.push(Date.now() - t0);
    if (k === 4) await evidence(page, 'TC-116', 2);
    await page.close();
  }
  console.log(`TC-116: S05 ${hvTimes.join(', ')} ms (p95 ${p95(hvTimes)}); T14 ${gvTimes.join(', ')} ms (p95 ${p95(gvTimes)})`);
  expect(p95(hvTimes)).toBeLessThanOrEqual(3000);
  expect(p95(gvTimes)).toBeLessThanOrEqual(2000);
});

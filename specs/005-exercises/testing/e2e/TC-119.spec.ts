/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { type Page, expect, test } from '@playwright/test';
import { S05, S06, classWithSets, doSet, evidence, gvPage, hvPage, match, order, set, setContent } from './helpers';

/** No horizontal scroll, touch targets ≥ 44 × 44, Hanzi ≥ 18 px. */
async function checkLayout(page: Page, where: string) {
  const r = await page.evaluate(() => {
    const doc = document.documentElement;
    const main = document.querySelector('main') ?? document.body;
    const small = [...main.querySelectorAll('button, input, a, [role="button"]')]
      .filter((el) => {
        const b = el.getBoundingClientRect();
        return b.width > 0 && b.height > 0 && !el.closest('nav[aria-label="Thanh tab"]');
      })
      .filter((el) => {
        const b = el.getBoundingClientRect();
        return b.width < 44 || b.height < 44;
      })
      .map((el) => `${el.tagName} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30)}" ${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}`);
    const hanzi = [...main.querySelectorAll('[lang="zh-Hans"], [lang="zh"]')]
      .filter((el) => /[一-鿿]/.test(el.textContent ?? '') && el.getBoundingClientRect().width > 0)
      .map((el) => parseFloat(getComputedStyle(el).fontSize))
      .filter((s) => s < 18);
    return { overflow: doc.scrollWidth - doc.clientWidth, small, hanzi };
  });
  expect(r.overflow, `${where}: horizontal scroll`).toBeLessThanOrEqual(0);
  expect.soft(r.small, `${where}: touch targets under 44 × 44`).toEqual([]);
  expect.soft(r.hanzi, `${where}: Hanzi under 18 px`).toEqual([]);
}

test('[005:NFR-6] TC-119 the largest matching and ordering questions at 360 and 430 px', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const thirty = (s: string) => s.padEnd(30, '一').slice(0, 30);
  const pairs = Array.from({ length: 8 }, (_, k) => [thirty(`甲${k}`), thirty(`乙${k}`)] as [string, string]);
  const d = await classWithSets(gv, [
    {
      title: 'Bộ lớn nhất',
      content: set([
        match('Nối các cặp', pairs, Array.from({ length: 4 }, (_, k) => thirty(`丙${k}`))),
        order('Sắp xếp', Array.from({ length: 12 }, (_, k) => `四字词${k % 10}`)),
      ]),
    },
  ]);
  const setId = d.sets[0]!;
  let n = 0;
  for (const width of [360, 430]) {
    const { page } = await hvPage(browser, d.students[width === 360 ? 0 : 1]!, { width, height: 844 });
    await page.goto(S05(d.cls, setId));
    await page.getByRole('button', { name: /^(Bắt đầu làm|Tiếp tục làm)$/ }).click();
    await expect(page.getByText('Câu 1/2')).toBeVisible();
    await checkLayout(page, `S05 câu 1 · ${width}`);
    await evidence(page, 'TC-119', ++n);
    await page.getByRole('button', { name: 'Câu sau' }).click();
    await checkLayout(page, `S05 câu 2 · ${width}`);
    await evidence(page, 'TC-119', ++n);
  }
  // S06 (pinyin of the review with tone marks is from the question text; here: Hanzi only).
  const c = await setContent(gv, d.les, setId);
  const { page } = await hvPage(browser, d.students[2]!, { width: 360, height: 844 });
  await doSet(page, d.cls, setId, { [c.questions[1].id]: { tiles: c.questions[1].tiles.map((t: any) => t.id) } });
  for (const width of [360, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(S06(d.cls, setId));
    await expect(page.getByText('Từng câu · đáp án và giải thích')).toBeVisible();
    await checkLayout(page, `S06 · ${width}`);
    await evidence(page, 'TC-119', ++n);
  }
});

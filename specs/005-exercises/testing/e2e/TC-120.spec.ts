import { type Page, expect, test } from '@playwright/test';
import { loginAs } from '../../../../tests/e2e/fixtures';
import { ORIGIN, S05, S06, T09, T14, T21, b6, classWithSets, evidence, setContent } from './helpers';

const AXE = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js';

/** axe-core WCAG 2.x A / AA rules on the current page: the violations (id + count). */
async function axe(page: Page): Promise<string[]> {
  await page.addScriptTag({ url: AXE });
  return page.evaluate(async () => {
    const w = window as unknown as { axe: { run: (c: unknown, o: unknown) => Promise<{ violations: { id: string; nodes: { target: string[] }[] }[] }> } };
    const r = await w.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
    return r.violations.map((v) => `${v.id} ×${v.nodes.length} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);
  });
}
/** Tab until the element is focused (at most `max` presses). */
async function tabTo(page: Page, locator: ReturnType<Page['getByRole']>, max = 60, key = 'Tab') {
  for (let k = 0; k < max; k++) {
    if (await locator.evaluate((el) => el === document.activeElement).catch(() => false)) return;
    await page.keyboard.press(key);
  }
  throw new Error('not reachable with Tab');
}

test('[005:NFR-7] TC-120 keyboard only, and no WCAG A / AA violation', async ({ browser }) => {
  test.setTimeout(180_000);
  // The app's CSP (script-src 'self') would block the axe script: the test contexts bypass it.
  const gvCtx = await browser.newContext({ viewport: { width: 1280, height: 800 }, baseURL: ORIGIN, bypassCSP: true });
  const gv = await gvCtx.newPage();
  await loginAs(gv, 'GV');
  const d = await classWithSets(gv, [{ title: 'Bộ B6', content: b6() }]);
  const setId = d.sets[0]!;
  const hvCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, baseURL: ORIGIN, bypassCSP: true });
  const page = await hvCtx.newPage();
  expect((await page.request.post('/api/dev/session', { data: { role: 'HV', userId: d.students[0] }, headers: { Origin: ORIGIN } })).status()).toBe(201);

  // 1. The whole B6 set with the keyboard on S05.
  await page.goto(S05(d.cls, setId));
  await tabTo(page, page.getByRole('button', { name: 'Bắt đầu làm' }));
  await page.keyboard.press('Enter');
  await expect(page.getByText('Câu 1/7')).toBeVisible();
  const next = async () => {
    await tabTo(page, page.getByRole('button', { name: 'Câu sau' }));
    await page.keyboard.press('Enter');
  };
  // Q1 radio: Tab to the first option, arrow to B.
  await tabTo(page, page.getByRole('radio').first());
  await page.keyboard.press('ArrowDown');
  await next();
  await tabTo(page, page.getByRole('radio').first());
  await page.keyboard.press('Space');
  await next();
  await tabTo(page, page.getByRole('textbox', { name: 'Câu 3 · chỗ trống 1' }));
  await page.keyboard.type('是');
  await page.keyboard.press('Tab');
  await page.keyboard.type('人');
  await next();
  for (const [a, b] of [['你好', 'xin chào'], ['谢谢', 'cảm ơn']]) {
    await tabTo(page, page.getByRole('group', { name: 'Cột A' }).getByRole('button', { name: a }));
    await page.keyboard.press('Enter');
    await tabTo(page, page.getByRole('group', { name: 'Cột B' }).getByRole('button', { name: b }));
    await page.keyboard.press('Enter');
  }
  await next();
  for (const t of ['我', '是', '越南', '人']) {
    await tabTo(page, page.getByRole('group', { name: 'Câu 5 · ngân hàng mảnh' }).getByRole('button', { name: t, exact: true }));
    await page.keyboard.press('Enter');
  }
  await next();
  await tabTo(page, page.getByRole('textbox', { name: 'Câu 6 · chữ Hán' }));
  await page.keyboard.type('你好');
  await next();
  await tabTo(page, page.getByRole('region', { name: 'Câu 7.1', exact: true }).getByRole('radio').first());
  await page.keyboard.press('Space');
  await tabTo(page, page.getByRole('textbox', { name: 'Câu 7.2 · chỗ trống 1' }));
  await page.keyboard.type('明');
  const violations: Record<string, string[]> = {};
  violations['S05'] = await axe(page);
  await tabTo(page, page.getByRole('button', { name: 'Nộp bài', exact: true }));
  await page.keyboard.press('Enter');
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await tabTo(page, page.getByRole('alertdialog').getByRole('button', { name: 'Nộp bài' }), 10);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`${S06(d.cls, setId)}$`));
  await expect(page.getByText('Từng câu · đáp án và giải thích')).toBeVisible();
  await evidence(page, 'TC-120', 1);
  violations['S06'] = await axe(page);

  // T21 with the keyboard: answer question 1.
  await gv.goto(T21(d.cur, d.les));
  await tabTo(gv, gv.getByRole('tab', { name: /^Bài học/ }));
  await gv.keyboard.press('ArrowRight');
  await expect(gv.getByRole('tab', { name: /^Bài tập/ })).toHaveAttribute('aria-selected', 'true');
  await tabTo(gv, gv.getByRole('region', { name: 'Câu 1', exact: true }).getByRole('radio').first(), 80);
  await gv.keyboard.press('ArrowDown');
  await expect(gv.getByRole('region', { name: 'Câu 1', exact: true }).getByRole('radio').nth(1)).toBeChecked();
  // 2. T09 with the keyboard: edit the title, save.
  await gv.goto(T09(d.cur, d.les));
  const title = gv.getByRole('region', { name: 'Bộ bài tập 1', exact: true }).getByLabel('Tiêu đề', { exact: true });
  await tabTo(gv, title, 80);
  await gv.keyboard.press('End');
  await gv.keyboard.type(' (bàn phím)');
  // The block's save button sits above its title: back with Shift+Tab.
  await tabTo(gv, gv.getByRole('region', { name: 'Bộ bài tập 1', exact: true }).getByRole('button', { name: 'Lưu thay đổi' }), 30, 'Shift+Tab');
  await gv.keyboard.press('Enter');
  await expect(gv.getByText(/^Đã lưu lúc/).first()).toBeVisible();
  await evidence(gv, 'TC-120', 2);
  violations['T09'] = await axe(gv);
  await gv.goto(T14(d.cls, d.students[0]!, setId));
  await expect(gv.getByRole('heading', { name: 'Xem bài nộp' })).toBeVisible();
  violations['T14'] = await axe(gv);
  void setContent;
  // 3. axe on S05, S06, T09, T14.
  console.log(`TC-120 axe: ${JSON.stringify(violations)}`);
  expect(violations).toEqual({ S05: [], S06: [], T09: [], T14: [] });
});

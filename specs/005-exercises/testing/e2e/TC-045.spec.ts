import { expect, test } from '@playwright/test';
import { S05, classWithSets, evidence, gvPage, hvPage, match, set } from './helpers';

test('[005:AC-8.5] [005:AC-8.6] TC-045 linking by tap, keyboard and drag', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [
    { title: 'Bộ nối', content: set([match('Nối', [['你好', 'xin chào'], ['谢谢', 'cảm ơn'], ['再见', 'tạm biệt']])]) },
  ]);
  const { page } = await hvPage(browser, d.students[0]!);
  await page.goto(S05(d.cls, d.sets[0]!));
  await page.getByRole('button', { name: 'Bắt đầu làm' }).click();
  const A = (k: number) => page.getByRole('group', { name: 'Cột A' }).getByRole('button').nth(k - 1);
  const B = (k: number) => page.getByRole('group', { name: 'Cột B' }).getByRole('button').nth(k - 1);
  const pairOf = async (el: ReturnType<typeof A>) => (await el.getAttribute('aria-label'))?.match(/cặp (\d+)$/)?.[1] ?? null;

  // 1. A1 then B3: same pair number.
  await A(1).click();
  await B(3).click();
  expect(await pairOf(A(1))).toBe('1');
  expect(await pairOf(B(3))).toBe('1');
  // 2. A2 then B3: B3 moves to pair 2, pair 1 is open again.
  await A(2).click();
  await B(3).click();
  expect(await pairOf(B(3))).toBe('2');
  expect(await pairOf(A(2))).toBe('2');
  expect(await pairOf(A(1))).toBeNull();
  // 3. Tap B3: unlinked.
  await B(3).click();
  expect(await pairOf(B(3))).toBeNull();
  expect(await pairOf(A(2))).toBeNull();
  await evidence(page, 'TC-045', 1);
  // 4. The same with Tab + Enter / Space.
  await A(1).focus();
  await page.keyboard.press('Enter');
  await B(3).focus();
  await page.keyboard.press('Space');
  expect(await pairOf(A(1))).toBe('1');
  expect(await pairOf(B(3))).toBe('1');
  await A(2).focus();
  await page.keyboard.press('Space');
  await B(3).focus();
  await page.keyboard.press('Enter');
  expect(await pairOf(B(3))).toBe('2');
  expect(await pairOf(A(1))).toBeNull();
  await B(3).focus();
  await page.keyboard.press('Enter');
  expect(await pairOf(B(3))).toBeNull();
  // 5. Drag A1 onto B2 (computer).
  await page.setViewportSize({ width: 1280, height: 800 });
  await A(1).dragTo(B(2));
  expect(await pairOf(A(1))).toBe('1');
  expect(await pairOf(B(2))).toBe('1');
  await evidence(page, 'TC-045', 2);
});

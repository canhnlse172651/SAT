import { expect, test } from '@playwright/test';
import { S05, classWithSets, evidence, gvPage, hvPage, mcq, saveAnswers, set, setContent, setDeadline, start, vnToday } from './helpers';

test('[005:AC-23.10] TC-114 setting the deadline again reopens the attempt', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const q = (p: string) => mcq(p, [{ text: 'Đúng', correct: true }, { text: 'Sai' }]);
  const d = await classWithSets(gv, [{ title: 'Bộ Y', content: set([q('Một'), q('Hai'), q('Ba')]) }]);
  const y = d.sets[0]!;
  const qs = (await setContent(gv, d.les, y)).questions;
  const { page } = await hvPage(browser, d.students[0]!);
  await start(page, d.cls, y);
  await saveAnswers(page, d.cls, y, { [qs[0].id]: { optionIds: [qs[0].options[0].id] }, [qs[1].id]: { optionIds: [qs[1].options[1].id] } });
  await setDeadline(gv, d.cls, y, null);
  await page.goto(S05(d.cls, y));
  const chip = page.locator('[data-screen="S05"] .hv-row__chips .chip').first();
  await expect(chip).toHaveText('Chưa mở');

  // 1. The GV sets a deadline. 2. The HV reloads, "Tiếp tục làm".
  await setDeadline(gv, d.cls, y, vnToday(3));
  await page.reload();
  await expect(chip).toHaveText('Đang làm');
  await page.getByRole('button', { name: 'Tiếp tục làm' }).click();
  await expect(page.getByRole('radio', { name: /^A\s*Đúng/ })).toBeChecked();
  await page.getByRole('button', { name: 'Câu sau' }).click();
  await expect(page.getByRole('radio', { name: /^B\s*Sai/ })).toBeChecked();
  await evidence(page, 'TC-114');
});

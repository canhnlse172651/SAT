import { expect, test } from '@playwright/test';
import { S05, classWithSets, doSet, evidence, gvPage, hvPage, mcq, saveAnswers, set, setContent, start, vnToday } from './helpers';

test('[005:AC-17.3] [005:AC-17.5] TC-087 the five states of a set', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const q = () => set([mcq('Câu?', [{ text: 'Đúng', correct: true }, { text: 'Sai' }])]);
  const d = await classWithSets(gv, [
    { title: 'Bộ 1 (đã nộp muộn)', content: q(), deadline: vnToday(-1) },
    { title: 'Bộ 2 (không hạn)', content: q(), deadline: null },
    { title: 'Bộ 3 (quá hạn, làm dở)', content: q(), deadline: vnToday(-1) },
    { title: 'Bộ 4 (làm dở)', content: q(), deadline: vnToday(5) },
    { title: 'Bộ 5 (chưa làm)', content: q(), deadline: vnToday(5) },
  ]);
  const { page: hv } = await hvPage(browser, d.students[0]!);
  const ans = async (setId: string) => {
    const x = (await setContent(gv, d.les, setId)).questions[0];
    return { [x.id]: { optionIds: [x.options[0].id] } };
  };
  await doSet(hv, d.cls, d.sets[0]!, await ans(d.sets[0]!));
  await start(hv, d.cls, d.sets[2]!);
  await saveAnswers(hv, d.cls, d.sets[2]!, await ans(d.sets[2]!));
  await start(hv, d.cls, d.sets[3]!);
  await saveAnswers(hv, d.cls, d.sets[3]!, await ans(d.sets[3]!));

  const main = hv.locator('[data-screen="S05"]');
  const score = main.getByRole('definition').nth(2);
  // 1. S05 of each set.
  await hv.goto(S05(d.cls, d.sets[0]!));
  await expect(main.getByText(/^Đã hoàn thành · 1(,0)? \/ 1(,0)?$/)).toBeVisible();
  await expect(main.getByText('Nộp muộn', { exact: true })).toBeVisible();
  await evidence(hv, 'TC-087', 1);
  const rest: [number, string][] = [
    [1, 'Chưa mở'],
    [2, 'Quá hạn'],
    [3, 'Đang làm'],
    [4, 'Chưa làm'],
  ];
  for (const [k, label] of rest) {
    await hv.goto(S05(d.cls, d.sets[k]!));
    await expect(main.getByRole('heading', { name: new RegExp(`^Bộ ${k + 1} `) })).toBeVisible();
    await expect(main.locator('.hv-row__chips .chip').first()).toHaveText(label);
    await expect(main.getByText('Nộp muộn', { exact: true })).toHaveCount(0);
    await expect(score).toHaveText('—');
    await evidence(hv, 'TC-087', k + 1);
  }
});

import { expect, test } from '@playwright/test';
import { S05, S06, classWithSets, doSet, endClass, evidence, gvPage, hvPage, mcq, saveAnswers, set, setContent, start } from './helpers';

test('[005:AC-21.8] TC-106 an ended class: review yes, new work no', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const q = () => set([mcq('Câu kết thúc?', [{ text: 'Đúng', correct: true }, { text: 'Sai' }], { explanation: 'GIAI THICH' })]);
  const d = await classWithSets(gv, [{ title: 'Bộ X', content: q() }, { title: 'Bộ Y', content: q() }]);
  const [x, y] = d.sets as [string, string];
  const xq = (await setContent(gv, d.les, x)).questions[0];
  const yq = (await setContent(gv, d.les, y)).questions[0];
  const { page } = await hvPage(browser, d.students[0]!);
  await doSet(page, d.cls, x, { [xq.id]: { optionIds: [xq.options[0].id] } });
  await start(page, d.cls, y);
  await saveAnswers(page, d.cls, y, { [yq.id]: { optionIds: [yq.options[1].id] } });
  await endClass(gv, d.cls);

  // 1. X: "Xem lại bài làm" opens S06.
  await page.goto(S05(d.cls, x));
  await page.getByRole('link', { name: 'Xem lại bài làm' }).click();
  await expect(page).toHaveURL(new RegExp(`${S06(d.cls, x)}$`));
  await expect(page.getByText('Từng câu · đáp án và giải thích')).toBeVisible();
  await evidence(page, 'TC-106', 1);
  // 2. Y: no work button, the reason, no key.
  await page.goto(S05(d.cls, y));
  await expect(page.getByRole('heading', { name: 'Bộ Y' })).toBeVisible();
  await expect(page.getByText('Lớp đã kết thúc — không thể làm bài mới')).toBeVisible();
  for (const name of ['Bắt đầu làm', 'Tiếp tục làm', 'Nộp bài']) await expect(page.getByRole('button', { name })).toHaveCount(0);
  await expect(page.getByText(/Đáp án đúng|GIAI THICH/)).toHaveCount(0);
  await evidence(page, 'TC-106', 2);
});

import { expect, test } from '@playwright/test';
import { S06, classWithSets, doSet, evidence, gvPage, hvPage, mcq, set, setContent } from './helpers';

test('[005:AC-16.2] TC-083 percentages round half up', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const q = (points: number) => mcq('Câu?', [{ text: 'Đúng', correct: true }, { text: 'Sai' }], { points });
  const d = await classWithSets(gv, [
    { title: 'Bộ 3 điểm', content: set([q(0.5), q(2.5)]) },
    { title: 'Bộ 8 điểm', content: set([q(5), q(3)]) },
  ]);
  const { page } = await hvPage(browser, d.students[0]!);
  for (const setId of d.sets) {
    const [q1] = (await setContent(gv, d.les, setId)).questions;
    await doSet(page, d.cls, setId, { [q1.id]: { optionIds: [q1.options[0].id] } });
  }
  await page.goto(S06(d.cls, d.sets[0]!));
  await expect(page.getByRole('heading', { name: 'Bộ 3 điểm' })).toBeVisible();
  await evidence(page, 'TC-083', 1);
  await expect(page.locator('.ex-review__score')).toContainText('(17%)');
  await expect.soft(page.getByText('0,5 / 3 điểm (17%)', { exact: true })).toBeVisible();
  await page.goto(S06(d.cls, d.sets[1]!));
  await expect(page.getByRole('heading', { name: 'Bộ 8 điểm' })).toBeVisible();
  await evidence(page, 'TC-083', 2);
  await expect(page.locator('.ex-review__score')).toContainText('(63%)');
  await expect(page.getByText('5 / 8 điểm (63%)', { exact: true })).toBeVisible();
});

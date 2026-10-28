/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { T09, api, classWithSets, doSet, evidence, gvPage, hvPage, itemOf, mcq, set, setBlock, setContent } from './helpers';

test('[005:AC-19.2] [005:AC-19.3] TC-096 a key change that moves scores asks first', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [{ title: 'Bộ chấm lại', content: set([mcq('Chào?', [{ text: 'Một' }, { text: 'Hai', correct: true }, { text: 'Ba' }])]) }]);
  const setId = d.sets[0]!;
  const q = (await setContent(gv, d.les, setId)).questions[0];
  for (const id of d.students) {
    const { page: hv } = await hvPage(browser, id);
    await doSet(hv, d.cls, setId, { [q.id]: { optionIds: [q.options[1].id] } });
  }
  const scores = async () => (await api<any>(gv, 'GET', `/api/exercises/classes/${d.cls}/sets/${setId}/submissions`)).items.map((i: any) => i.score);
  expect(await scores()).toEqual([1, 1, 1]);
  // 1. Key B → C, "Lưu thay đổi".
  await gv.goto(T09(d.cur, d.les));
  const block = setBlock(gv, 1);
  await block.getByRole('region', { name: 'Câu 1', exact: true }).getByRole('radio', { name: 'Đáp án đúng C' }).check();
  await block.getByRole('button', { name: 'Lưu thay đổi' }).click();
  const dialog = gv.getByRole('alertdialog');
  await expect(dialog).toContainText('Thay đổi này làm thay đổi điểm của 3 bài nộp. Chấm lại và lưu?');
  await expect(dialog).toContainText('Điểm của bài nộp và điểm xếp hạng được tính lại ở mọi lớp.');
  await expect(dialog.getByRole('button', { name: 'Chấm lại và lưu' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Hủy' })).toBeVisible();
  await evidence(gv, 'TC-096', 1);
  // 2. "Hủy": nothing saved, the edit stays.
  await dialog.getByRole('button', { name: 'Hủy' }).click();
  await expect(block.getByText('Chưa lưu', { exact: true })).toBeVisible();
  await expect(block.getByRole('region', { name: 'Câu 1', exact: true }).getByRole('radio', { name: 'Đáp án đúng C' })).toBeChecked();
  expect((await itemOf(gv, d.les, setId)).content.questions[0].options.map((o: any) => o.correct)).toEqual([false, true, false]);
  expect(await scores()).toEqual([1, 1, 1]);
  await evidence(gv, 'TC-096', 2);
});

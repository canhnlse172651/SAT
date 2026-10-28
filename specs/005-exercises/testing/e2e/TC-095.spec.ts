import { expect, test } from '@playwright/test';
import { S06, T09, classWithSets, cloze, doSet, evidence, gvPage, hvPage, itemOf, review, saveItem, set, setBlock, setContent } from './helpers';

test('[005:AC-19.1] TC-095 an extra accepted answer nobody typed saves at once', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [{ title: 'Bộ thêm đáp án', content: set([cloze('Điền', '我[[是]]越南人')]) }]);
  const setId = d.sets[0]!;
  const q = (await setContent(gv, d.les, setId)).questions[0];
  for (const id of d.students) {
    const { page: hv } = await hvPage(browser, id);
    await doSet(hv, d.cls, setId, { [q.id]: { blanks: { [q.blanks[0].id]: '是' } } });
  }
  // 1. Add "shì" to blank 1, "Lưu thay đổi".
  await gv.goto(T09(d.cur, d.les));
  const block = setBlock(gv, 1);
  const blank1 = block.getByRole('group', { name: 'Chỗ trống 1' });
  const add = blank1.getByRole('button', { name: 'Thêm đáp án' });
  await evidence(gv, 'TC-095', 1);
  await expect.soft(add, '"Thêm đáp án" of a blank on a set with submissions').toBeEnabled();
  if (await add.isEnabled()) {
    await add.click();
    await block.getByRole('textbox', { name: 'Chỗ trống 1 · đáp án 2' }).fill('shì');
    await block.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(block.getByText(/^Đã lưu lúc/)).toBeVisible();
    await expect(gv.getByRole('alertdialog')).toHaveCount(0);
  } else {
    // The same change through the API, to see what the server does with it.
    const c = await setContent(gv, d.les, setId);
    c.questions[0].blanks[0].answers.push('shì');
    const r = await saveItem(gv, d.les, setId, 'Bộ thêm đáp án', c);
    expect(r.status, JSON.stringify(r.body)).toBe(200);
  }
  expect((await itemOf(gv, d.les, setId)).content.questions[0].blanks[0].answers).toEqual(['是', 'shì']);
  // S06 has no re-grading note.
  const { page: hv } = await hvPage(browser, d.students[0]!);
  expect((await review(hv, d.cls, setId)).body.regrade).toBeNull();
  await hv.goto(S06(d.cls, setId));
  await expect(hv.getByText(/Điểm đã được cập nhật/)).toHaveCount(0);
  await evidence(hv, 'TC-095', 2);
});

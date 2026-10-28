import { expect, test } from '@playwright/test';
import { S06, T09, T14, classWithSets, doSet, evidence, gvPage, hvPage, mcq, review, set, setBlock, setContent } from './helpers';

test('[005:AC-18.3] TC-090 a fixed option text shows in every submission', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [{ title: 'Bộ sửa chữ', content: set([mcq('Chào?', [{ text: '再见' }, { text: '你好', correct: true }])]) }]);
  const setId = d.sets[0]!;
  const q = (await setContent(gv, d.les, setId)).questions[0];
  const { page: hv } = await hvPage(browser, d.students[0]!);
  await doSet(hv, d.cls, setId, { [q.id]: { optionIds: [q.options[1].id] } });
  const before = (await review(hv, d.cls, setId)).body.score;

  // 1. The GV changes option B "你好" → "您好" (same key) and saves.
  await gv.goto(T09(d.cur, d.les));
  const block = setBlock(gv, 1);
  await block.getByRole('region', { name: 'Câu 1', exact: true }).getByRole('textbox', { name: 'Phương án B' }).fill('您好');
  await block.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(block.getByText(/^Đã lưu lúc/)).toBeVisible();
  await expect(gv.getByRole('alertdialog')).toHaveCount(0);
  // 2. HV S06, GV T14.
  await hv.goto(S06(d.cls, setId));
  await expect(hv.getByText('Bạn trả lời: B. 您好')).toBeVisible();
  await evidence(hv, 'TC-090', 1);
  await gv.goto(T14(d.cls, d.students[0]!, setId));
  await expect(gv.getByText('Câu trả lời: B. 您好')).toBeVisible();
  await evidence(gv, 'TC-090', 2);
  expect((await review(hv, d.cls, setId)).body.score).toBe(before);
});

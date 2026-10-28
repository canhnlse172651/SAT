import { expect, test } from '@playwright/test';
import { T14, archiveItem, classWithSets, doSet, evidence, gvPage, hideSection, hvPage, mcq, set, setContent } from './helpers';

test('[005:AC-20.6] TC-101 T14 of a hidden section or an archived set', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const q = () => set([mcq('Câu?', [{ text: 'Đúng', correct: true }, { text: 'Sai' }])]);
  const hiddenCase = await classWithSets(gv, [{ title: 'Bộ ẩn', content: q() }]);
  const archivedCase = await classWithSets(gv, [{ title: 'Bộ lưu trữ', content: q() }]);
  for (const c of [hiddenCase, archivedCase]) {
    const x = (await setContent(gv, c.les, c.sets[0]!)).questions[0];
    const { page: hv } = await hvPage(browser, c.students[0]!);
    await doSet(hv, c.cls, c.sets[0]!, { [x.id]: { optionIds: [x.options[0].id] } });
  }
  await hideSection(gv, hiddenCase.cls, hiddenCase.les, true);
  await archiveItem(gv, archivedCase.les, archivedCase.sets[0]!);

  await gv.goto(T14(hiddenCase.cls, hiddenCase.students[0]!, hiddenCase.sets[0]!));
  await expect(gv.getByRole('heading', { name: 'Xem bài nộp' })).toBeVisible();
  await expect(gv.getByText('Section Bài tập đang ẩn với lớp này')).toBeVisible();
  await evidence(gv, 'TC-101', 1);
  await gv.goto(T14(archivedCase.cls, archivedCase.students[0]!, archivedCase.sets[0]!));
  await expect(gv.getByRole('heading', { name: 'Xem bài nộp' })).toBeVisible();
  await expect(gv.getByText('Bộ bài tập đang lưu trữ')).toBeVisible();
  await evidence(gv, 'TC-101', 2);
});

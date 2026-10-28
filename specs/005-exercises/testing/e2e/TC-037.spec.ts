import { expect, test } from '@playwright/test';
import { T09, cloze, draftSet, evidence, gvPage, newCurriculum, newLesson, set, setBlock } from './helpers';

const RULE = 'Đoạn văn cần từ 1 đến 20 chỗ trống và không quá 3000 ký tự';

test('[005:AC-6.3] TC-037 passage shape of a cloze question', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await draftSet(
    page,
    les.id,
    'Bộ điền',
    set([
      cloze('Không có ô', '我是越南人'),
      cloze('21 ô', Array.from({ length: 21 }, (_, k) => `[[字${k}]]`).join('，')),
      cloze('3001 ký tự', `[[我]]${'是'.repeat(3000)}`),
    ]),
  );
  await page.goto(T09(cur.id, les.id));
  const block = setBlock(page, 1);
  for (const n of [1, 2, 3]) {
    const q = block.getByRole('region', { name: `Câu ${n}`, exact: true });
    await q.getByLabel('Đoạn văn').focus();
    await block.getByLabel('Tiêu đề', { exact: true }).focus();
    await expect(q.getByText(RULE).first(), `câu ${n}`).toBeVisible();
  }
  await evidence(page, 'TC-037');
});

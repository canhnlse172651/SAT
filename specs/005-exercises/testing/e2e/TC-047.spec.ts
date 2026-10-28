import { expect, test } from '@playwright/test';
import { T09, draftSet, evidence, gvPage, mcq, newCurriculum, newLesson, set, setBlock } from './helpers';

const SHAPE = 'Câu sắp xếp cần từ 2 đến 12 mảnh, mỗi mảnh 1–20 ký tự';

test('[005:AC-9.1] [005:AC-9.2] [005:AC-9.3] TC-047 composing an ordering question', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await draftSet(page, les.id, 'Bộ sắp xếp', set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]));
  await page.goto(T09(cur.id, les.id));
  const block = setBlock(page, 1);
  const addOrder = async () => {
    await block.getByRole('button', { name: 'Thêm câu hỏi' }).click();
    await page.getByRole('menuitem', { name: 'Sắp xếp từ thành câu' }).click();
  };
  const tiles = (q: ReturnType<typeof block.getByRole>) => q.getByRole('textbox', { name: /^Mảnh \d+$/ });
  const make = async (q: ReturnType<typeof block.getByRole>, s: string) => {
    await q.getByRole('textbox', { name: 'Câu đúng, các mảnh ngăn cách bởi “/”' }).fill(s);
    await q.getByRole('button', { name: 'Tạo mảnh' }).click();
  };

  // 1. "我/是/越南/人" → 4 tiles.
  await addOrder();
  const q2 = block.getByRole('region', { name: 'Câu 2', exact: true });
  await make(q2, '我/是/越南/人');
  await expect(tiles(q2)).toHaveCount(4);
  expect(await Promise.all((await tiles(q2).all()).map((t) => t.inputValue()))).toEqual(['我', '是', '越南', '人']);
  // 2. Edit, add, delete, reorder tiles; up to 4 other orders.
  await tiles(q2).nth(3).fill('人。');
  await q2.getByRole('button', { name: 'Thêm mảnh' }).click();
  await tiles(q2).nth(4).fill('吗');
  await q2.getByRole('button', { name: 'Xóa mảnh 5' }).click();
  await q2.getByRole('button', { name: 'Xuống dưới mảnh 1' }).click();
  expect(await Promise.all((await tiles(q2).all()).map((t) => t.inputValue()))).toEqual(['是', '我', '越南', '人。']);
  await q2.getByRole('button', { name: 'Lên trên mảnh 2' }).click();
  const addAlt = q2.getByRole('button', { name: 'Thêm thứ tự khác' });
  for (let k = 0; k < 4; k++) await addAlt.click();
  await expect(q2.getByText(/^Thứ tự chấp nhận \d:/)).toHaveCount(4);
  await expect(addAlt).toBeDisabled();
  await evidence(page, 'TC-047', 1);
  // 3. One tile; 13 tiles; a tile of 21 characters.
  await addOrder();
  const q3 = block.getByRole('region', { name: 'Câu 3', exact: true });
  await make(q3, '我');
  await expect(q3).toContainText(SHAPE);
  await addOrder();
  const q4 = block.getByRole('region', { name: 'Câu 4', exact: true });
  await make(q4, Array.from({ length: 13 }, (_, k) => `字${k}`).join('/'));
  await expect(q4).toContainText(SHAPE);
  await addOrder();
  const q5 = block.getByRole('region', { name: 'Câu 5', exact: true });
  await make(q5, `我/${'是'.repeat(21)}`);
  await expect(q5).toContainText(SHAPE);
  // 4. An other order equal to the correct sentence.
  await addOrder();
  const q6 = block.getByRole('region', { name: 'Câu 6', exact: true });
  await make(q6, '你/好');
  await q6.getByRole('button', { name: 'Thêm thứ tự khác' }).click();
  await q6.getByRole('button', { name: 'Xuống dưới mảnh 1 của thứ tự 1' }).click();
  await expect(q6.getByText('Thứ tự chấp nhận 1: 你好')).toBeVisible();
  await expect(q6).toContainText('Thứ tự chấp nhận 1 trùng với câu đúng hoặc một thứ tự khác');
  await evidence(page, 'TC-047', 2);
});

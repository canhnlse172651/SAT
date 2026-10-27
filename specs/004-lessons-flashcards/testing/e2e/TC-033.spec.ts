import { expect, test } from '@playwright/test';
import { T07, addStep, evidence, gvPage, newCurriculum, newLesson, saveStep, text, vocab } from './helpers';

test('[004:AC-4.7] TC-033 a deck cannot be made from an empty, invalid or full step', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const a = await addStep(page, les.id);
  await saveStep(page, les.id, a, 'Trống', { goal: '', blocks: [vocab([])] });
  const b = await addStep(page, les.id);
  await saveStep(page, les.id, b, 'Lỗi', {
    goal: '',
    blocks: [vocab([{ hanzi: '你好', meaning: '' }, { hanzi: '书', meaning: 'x' }, { hanzi: '好', meaning: 'tốt' }])],
  });
  const c = await addStep(page, les.id);
  await saveStep(page, les.id, c, 'Đầy', {
    goal: '',
    blocks: [vocab([{ hanzi: '你', meaning: 'bạn' }]), ...Array.from({ length: 49 }, (_, i) => text(`<p>${i}</p>`, `t${i}`))],
  });
  await page.goto(T07(cur.id, les.id));
  // Word 2 of step 2 becomes invalid in the editor (the API refuses to store an invalid value — AC-2.8).
  await page.getByRole('region', { name: 'Bước học 2' }).getByLabel('Chữ Hán của từ 2').fill('abc');
  const cases: [number, string][] = [
    [1, 'Danh sách cần ít nhất 1 từ.'],
    [2, 'Hãy sửa 2 từ chưa hợp lệ trước khi tạo bộ thẻ.'],
    [3, 'Mỗi bước học có tối đa 50 khối'],
  ];
  for (const [n, msg] of cases) {
    const step = page.getByRole('region', { name: `Bước học ${n}` });
    const before = await step.getByText(/^Khối \d+ · /).count();
    await step.getByRole('button', { name: 'Tạo bộ thẻ từ danh sách này' }).click();
    await expect(step.getByText(msg, { exact: true })).toBeVisible();
    await expect(step.getByText(/^Khối \d+ · /)).toHaveCount(before);
    await expect(step.getByText('Bộ thẻ từ vựng')).toHaveCount(0);
  }
  await evidence(page, 'TC-033');
});

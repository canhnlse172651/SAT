import { expect, test } from '@playwright/test';
import {
  T09, b6, b6Answers, classWithSets, doSet, evidence, gvPage, hvPage, publishedSet, saveItem, setBlock, setContent,
} from './helpers';

test('[005:AC-18.1] [005:AC-18.2] TC-089 a set with submissions has a locked structure', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [{ title: 'Bộ X', content: b6() }]);
  const x = d.sets[0]!;
  await publishedSet(gv, d.les, 'Bộ Y', b6());
  const content = await setContent(gv, d.les, x);
  for (const id of d.students.slice(0, 2)) {
    const { page: hv } = await hvPage(browser, id);
    await doSet(hv, d.cls, x, b6Answers(content));
  }
  await gv.goto(T09(d.cur, d.les));
  const X = setBlock(gv, 1);
  const Y = setBlock(gv, 2);

  await expect(X.getByRole('note')).toHaveText(
    'Đã có 2 bài nộp: không thêm, xóa, sắp xếp câu hoặc đổi điểm. Sửa đáp án sẽ hỏi “Chấm lại và lưu”.',
  );
  // Disabled: add / delete / move questions, mode, options, blanks, pairs, distractors, tiles, sub-questions, points.
  await expect(X.getByRole('button', { name: 'Thêm câu hỏi', exact: true })).toBeDisabled();
  for (const name of ['Xóa câu', 'Lên trên', 'Xuống dưới', 'Thêm phương án', 'Thêm cặp', 'Thêm mục nhiễu', 'Thêm mảnh', 'Đánh dấu chỗ trống', 'Thêm câu hỏi con trắc nghiệm', 'Thêm câu hỏi con điền chỗ trống']) {
    for (const b of await X.getByRole('button', { name, exact: true }).all()) await expect(b, name).toBeDisabled();
  }
  for (const b of await X.getByRole('button', { name: /^Xóa (phương án|cặp|mảnh|mục nhiễu|câu hỏi con)/ }).all()) await expect(b).toBeDisabled();
  for (const b of await X.getByRole('button', { name: /^Bỏ chỗ trống/ }).all()) await expect(b).toBeDisabled();
  await expect(X.getByRole('radio', { name: 'Nhiều đáp án đúng' })).toHaveCount(0);
  for (const t of await X.getByRole('textbox', { name: /^Điểm/ }).all()) await expect(t).toBeDisabled();
  // Still editable: text, image, explanation, title, instructions, linked step, keys.
  await expect(X.getByLabel('Tiêu đề', { exact: true })).toBeEditable();
  await expect(X.getByLabel('Hướng dẫn (tùy chọn)')).toBeEditable();
  await expect(X.getByLabel('Bước học liên kết')).toBeEnabled();
  const q1 = X.getByRole('region', { name: 'Câu 1', exact: true });
  await expect(q1.getByLabel('Đề bài')).toBeEditable();
  await expect(q1.getByLabel('Giải thích (không bắt buộc)')).toBeEditable();
  await expect(q1.getByRole('textbox', { name: 'Phương án A' })).toBeEditable();
  await expect(q1.getByRole('button', { name: 'Thêm ảnh đề câu 1' })).toBeEnabled();
  await expect(q1.getByRole('radio', { name: 'Đáp án đúng C' })).toBeEnabled();
  await expect(X.getByRole('region', { name: 'Câu 3', exact: true }).getByRole('textbox', { name: 'Chỗ trống 1 · đáp án 1' })).toBeEditable();
  await evidence(gv, 'TC-089');
  // Y is not locked.
  await expect(Y.getByRole('note')).toHaveCount(0);
  await expect(Y.getByRole('button', { name: 'Thêm câu hỏi', exact: true })).toBeEnabled();
  await expect(Y.getByRole('region', { name: 'Câu 1', exact: true }).getByRole('textbox', { name: 'Điểm', exact: true })).toBeEnabled();
  // The API refuses a structure change of X.
  const fewer = { ...content, questions: content.questions.slice(1) };
  const r = await saveItem(gv, d.les, x, 'Bộ X', fewer);
  expect(r.status).toBe(409);
  expect(r.body.error.code).toBe('SET_LOCKED');
});

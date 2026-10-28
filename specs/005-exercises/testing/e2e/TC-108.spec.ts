/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import {
  S05, S06, S11, T09, api, doSet, evidence, gvPage, hvPage, itemOf, mcq, newClass, newCurriculum, newLesson, publishLesson,
  publishedSet, saveAnswers, set, setBlock, setContent, setDeadline, start, studentIds, vnToday,
} from './helpers';

test('[005:AC-22.3] [005:AC-22.4] [005:AC-22.5] [005:AC-22.6] TC-108 archive and restore a set with learning data', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const cur = await newCurriculum(gv);
  const les = await newLesson(gv, cur.id);
  const q = () => set([mcq('Câu?', [{ text: 'Đúng', correct: true }, { text: 'Sai' }])]);
  await publishedSet(gv, les.id, 'Bộ A', q());
  const b = await publishedSet(gv, les.id, 'Bộ B', q());
  await publishedSet(gv, les.id, 'Bộ C', q());
  await publishLesson(gv, les.id);
  const [hv1, hv2] = await studentIds(gv);
  const cls = await newClass(gv, cur.id, [hv1!, hv2!]);
  await setDeadline(gv, cls.id, b, vnToday(5));
  const bq = (await setContent(gv, les.id, b)).questions[0];
  const p1 = (await hvPage(browser, hv1!)).page;
  await doSet(p1, cls.id, b, { [bq.id]: { optionIds: [bq.options[0].id] } });
  const p2 = (await hvPage(browser, hv2!)).page;
  await start(p2, cls.id, b);
  await saveAnswers(p2, cls.id, b, { [bq.id]: { optionIds: [bq.options[1].id] } });
  await gv.goto(T09(cur.id, les.id));
  let asked = false;
  gv.on('dialog', () => (asked = true));

  // 1. "Lưu trữ" B: at once, no question, B keeps its place.
  await setBlock(gv, 2).getByRole('button', { name: 'Lưu trữ' }).click();
  await expect(gv.getByText('Đã lưu trữ · Đã lưu')).toBeVisible();
  await expect(gv.getByRole('alertdialog')).toHaveCount(0);
  expect(asked).toBe(false);
  // 2. HV: no B on S11, S06 → A05; the score is kept.
  await p1.goto(`${S11(cls.id, les.id)}?tab=bai-tap`);
  await expect(p1.getByText('Bộ A')).toBeVisible();
  await evidence(p1, 'TC-108', 1);
  await expect(p1.getByText('Bộ B', { exact: true }), 'archived set B on S11').toHaveCount(0);
  await p1.goto(S06(cls.id, b));
  await expect(p1.getByText('Không tìm thấy nội dung')).toBeVisible();
  await evidence(p1, 'TC-108', 2);
  expect((await api<any>(gv, 'GET', `/api/exercises/classes/${cls.id}/sets/${b}/submissions`)).items.map((i: any) => i.score)).toEqual([1]);
  // 3. GV: "Hiện mục lưu trữ", edit B, "Lưu thay đổi": still archived.
  await gv.getByRole('switch', { name: /^Hiện mục lưu trữ/ }).click();
  const B = setBlock(gv, 2);
  await expect(B).toHaveClass(/cur-item--archived/);
  await expect(B.locator('.cur-item__bar').first().getByText('Lưu trữ', { exact: true })).toBeVisible();
  await B.getByLabel('Hướng dẫn (tùy chọn)').fill('Sửa khi lưu trữ');
  await B.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(B.getByText(/^Đã lưu lúc/)).toBeVisible();
  const saved = await itemOf(gv, les.id, b);
  expect([saved.status, saved.content.instructions]).toEqual(['archived', 'Sửa khi lưu trữ']);
  await evidence(gv, 'TC-108', 3);
  // 4. "Khôi phục".
  await B.getByRole('button', { name: 'Khôi phục' }).click();
  await expect(gv.getByText('Đã khôi phục · Đã lưu')).toBeVisible();
  await expect(setBlock(gv, 2).locator('.cur-item__bar').first().getByText('Đã xuất bản', { exact: true })).toBeVisible();
  await expect(setBlock(gv, 2).getByLabel('Tiêu đề', { exact: true })).toHaveValue('Bộ B');
  // HV sees the submission, S06 and the attempt in progress again.
  await p1.goto(S06(cls.id, b));
  await expect(p1.getByText('Từng câu · đáp án và giải thích')).toBeVisible();
  await p2.goto(S05(cls.id, b));
  await p2.getByRole('button', { name: 'Tiếp tục làm' }).click();
  await expect(p2.getByRole('radio', { name: /^B\s*Sai/ })).toBeChecked();
  await evidence(p2, 'TC-108', 4);
});

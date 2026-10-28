import { expect, test } from '@playwright/test';
import {
  S11, T09, draftSet, evidence, gvPage, hvPage, itemOf, mcq, newClass, newCurriculum, newLesson, publishLesson,
  publishedSet, set, setBlock, setDeadline, studentIds, vnToday,
} from './helpers';

test('[005:AC-12.3] [005:AC-12.4] [005:AC-12.8] TC-056 publishing a draft set', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const cur = await newCurriculum(gv);
  const les = await newLesson(gv, cur.id);
  const q = () => set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]);
  const shown = await publishedSet(gv, les.id, 'Bộ đã có', q());
  await publishLesson(gv, les.id);
  const x = await draftSet(gv, les.id, 'Bộ mới', q());
  const [hvId] = await studentIds(gv);
  const cls = await newClass(gv, cur.id, [hvId!]);
  await setDeadline(gv, cls.id, shown, vnToday(5));

  // 1. The HV does not see the draft set.
  const { page: hv } = await hvPage(browser, hvId!);
  await hv.goto(S11(cls.id, les.id));
  await expect(hv.getByText('Bộ đã có')).toBeVisible();
  await expect(hv.getByText('Bộ mới')).toHaveCount(0);
  await evidence(hv, 'TC-056', 1);
  // 2. "Xuất bản" on the set's block saves the content and publishes it, no way back to Nháp.
  await gv.goto(T09(cur.id, les.id));
  const block = setBlock(gv, 2);
  await block.getByLabel('Tiêu đề', { exact: true }).fill('Bộ mới xuất bản');
  await block.getByRole('button', { name: 'Xuất bản', exact: true }).click();
  await expect(gv.getByText(/^Đã xuất bản · Đã lưu lúc \d\d:\d\d$/).first()).toBeVisible();
  await expect(block.getByText('Đã xuất bản', { exact: true })).toBeVisible();
  await expect(block.getByRole('button', { name: 'Lưu nháp' })).toHaveCount(0);
  await expect(block.getByRole('button', { name: 'Xuất bản', exact: true })).toHaveCount(0);
  await expect(block.getByRole('button', { name: /Nháp|Hủy xuất bản|Chuyển về/ })).toHaveCount(0);
  const saved = await itemOf(gv, les.id, x);
  expect([saved.status, saved.title]).toEqual(['published', 'Bộ mới xuất bản']);
  await evidence(gv, 'TC-056', 2);
  // 3. The HV reloads S11 and sees it (a deadline can only be set on a published set).
  await setDeadline(gv, cls.id, x, vnToday(5));
  await hv.reload();
  await expect(hv.getByText('Bộ mới xuất bản')).toBeVisible();
  await evidence(hv, 'TC-056', 3);
});

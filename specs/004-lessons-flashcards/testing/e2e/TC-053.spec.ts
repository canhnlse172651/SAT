import { expect, test } from '@playwright/test';
import {
  S03,
  T21,
  addSet,
  addStep,
  deck,
  evidence,
  gvPage,
  hvPage,
  linkPractice,
  newClass,
  newCurriculum,
  newLesson,
  publishLesson,
  publishSet,
  publishedStep,
  saveStep,
} from './helpers';

test('[004:AC-7.6] TC-053 T21 shows the Bài học section as the HV sees it, nothing recorded', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const first = await publishedStep(
    page,
    les.id,
    'Hội thoại',
    [
      { id: 'd', type: 'dialogue', kind: 'dialogue', title: '', lines: [{ speaker: 'A', hanzi: '你好', pinyin: 'nǐ hǎo', translation: 'Xin chào' }] },
      deck([{ id: 'c1', front: '你', pinyin: 'nǐ', meaning: 'bạn' }]),
    ],
    'Chào hỏi',
  );
  const draft = await addStep(page, les.id);
  await saveStep(page, les.id, draft, 'Bản nháp', { goal: '', blocks: [{ id: 't', type: 'text', html: '<p>Nháp</p>' }] });
  const set = await addSet(page, les.id);
  await publishSet(page, les.id, set, 'Luyện từ mới');
  await linkPractice(page, set, first);
  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  const cls = await newClass(page, cur.id, [hv.who.user.id]);

  await page.goto(T21(cur.id, les.id));
  await page.getByRole('switch', { name: 'Gồm cả mục Nháp' }).click();
  const steps = page.locator('.sv-preview-step');
  await expect(steps).toHaveCount(2);
  await expect(steps.nth(0).getByText('Bước 1/2')).toBeVisible();
  await expect(steps.nth(0).getByRole('heading', { name: 'Hội thoại', level: 2 })).toBeVisible();
  await expect(steps.nth(0).getByText('Mục tiêu: Chào hỏi')).toBeVisible();
  await expect(steps.nth(1).getByText('Nháp — học viên chưa thấy')).toBeVisible();
  await expect(steps.nth(0).getByText('Nháp — học viên chưa thấy')).toHaveCount(0);
  await expect(page.getByText('AI tạo')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^(Lưu nháp|Lưu thay đổi|Xuất bản)$/ })).toHaveCount(0);
  await expect(steps.nth(0).getByText('nǐ hǎo')).toBeVisible();
  await steps.nth(0).getByRole('switch', { name: 'Pinyin' }).click();
  await expect(steps.nth(0).getByText('nǐ hǎo')).toHaveCount(0);
  await expect(steps.nth(0).getByRole('button', { name: 'Luyện tập: Luyện từ mới' })).toBeDisabled();
  await expect(steps.nth(0).getByRole('button', { name: '‹ Trước' })).toBeDisabled();
  await expect(steps.nth(0).getByRole('button', { name: 'Tiếp ›' })).toBeDisabled();
  await evidence(page, 'TC-053', 1);
  await steps.nth(0).getByRole('button', { name: 'Học flashcard' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Thẻ 1/1')).toBeVisible();
  await dialog.getByRole('button', { name: 'Đã thuộc' }).click();
  await expect(dialog.getByText('Tổng kết bộ thẻ')).toBeVisible();
  await evidence(page, 'TC-053', 2);

  // Nothing was recorded: the HV still has no mark.
  await hv.page.goto(S03(cls.id, first));
  await expect(hv.page.getByText('1 thẻ · Đã thuộc 0/1')).toBeVisible();
});

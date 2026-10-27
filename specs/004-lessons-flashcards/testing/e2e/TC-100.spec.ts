import { expect, test } from '@playwright/test';
import {
  S03,
  S04,
  T07,
  addStep,
  archiveStep,
  deck,
  evidence,
  gvPage,
  hvPage,
  newClass,
  newCurriculum,
  newLesson,
  publishLesson,
  publishedStep,
  saveStep,
  text,
} from './helpers';

test('[004:NFR-7] TC-100 keyboard use of S04 and T07, labelled controls and switch states', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const cards = ['一', '二', '三'].map((front, i) => ({ id: `c${i}`, front, meaning: `số ${i + 1}` }));
  const step = await publishedStep(page, les.id, 'Thẻ', [
    deck(cards),
    { id: 'd', type: 'dialogue', kind: 'dialogue', title: '', lines: [{ hanzi: '你好', pinyin: 'nǐ hǎo' }] },
  ]);
  const old = await publishedStep(page, les.id, 'Cũ', [text('<p>旧</p>')]);
  await archiveStep(page, les.id, old);
  const draft = await addStep(page, les.id);
  await saveStep(page, les.id, draft, 'Nháp', { goal: '', blocks: [text('<p>一</p>', 'a'), text('<p>二</p>', 'b')] });
  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  await hv.page.setViewportSize({ width: 1280, height: 800 });
  const cls = await newClass(page, cur.id, [hv.who.user.id]);

  // S04 by keyboard: Space flips, → / ← move, 1 = Chưa thuộc, 2 = Đã thuộc.
  const p = hv.page;
  await p.goto(S04(cls.id, step, 'k'));
  await expect(p.getByText('Thẻ 1/3')).toBeVisible();
  await p.keyboard.press('Space');
  await expect(p.getByRole('button', { name: /^Mặt sau/ })).toBeVisible();
  await p.keyboard.press('ArrowRight');
  await expect(p.getByText('Thẻ 2/3')).toBeVisible();
  await p.keyboard.press('ArrowLeft');
  await expect(p.getByText('Thẻ 1/3')).toBeVisible();
  await p.keyboard.press('2');
  await expect(p.getByText('Thẻ 2/3')).toBeVisible();
  await p.keyboard.press('1');
  await expect(p.getByText('Thẻ 3/3')).toBeVisible();
  await p.keyboard.press('ArrowLeft');
  await expect(p.locator('.fc-head')).toContainText('Chưa thuộc');
  await p.keyboard.press('ArrowLeft');
  await expect(p.locator('.fc-head')).toContainText('Đã thuộc');
  await evidence(p, 'TC-100', 1);

  // Switches have names and an on / off state for screen readers.
  await p.goto(S03(cls.id, step));
  for (const name of ['Pinyin', 'Bản dịch']) {
    const sw = p.getByRole('switch', { name });
    await expect(sw).toHaveAttribute('aria-checked', 'true');
  }

  // T07: everything reachable and usable from the keyboard.
  await page.goto(T07(cur.id, les.id));
  const toggle = page.getByRole('switch', { name: 'Hiện mục lưu trữ (1)' });
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  const s3 = page.getByRole('region', { name: 'Bước học 3' });
  await s3.getByLabel('Tên bước học').fill('Nháp (sửa)');
  await expect(s3.getByText('Chưa lưu', { exact: true })).toBeVisible();
  // Order blocks by keyboard.
  await s3.getByRole('button', { name: 'Xuống (khối 1)' }).focus();
  await page.keyboard.press('Enter');
  await expect(s3.getByRole('textbox', { name: 'Nội dung khối 1' })).toHaveText('二');
  await s3.getByRole('button', { name: 'Lưu nháp' }).focus();
  await page.keyboard.press('Enter');
  await expect(s3.getByText('Chưa lưu', { exact: true })).toHaveCount(0);
  await page.getByRole('region', { name: 'Bước học 2' }).getByRole('button', { name: 'Khôi phục' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Đã khôi phục · Đã lưu').first()).toBeVisible();
  const s1 = page.getByRole('region', { name: 'Bước học 1' });
  await s1.getByRole('button', { name: 'Soạn bộ thẻ' }).focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Lên (thẻ 2)' }).focus();
  await page.keyboard.press('Enter');
  await expect(dialog.getByLabel('Mặt trước (chữ Hán) *').first()).toHaveValue('二');
  await dialog.getByRole('button', { name: 'Xong' }).focus();
  await page.keyboard.press('Enter');
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'Thêm bước học' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Đã thêm bước học mới (Nháp) · Đã lưu').first()).toBeVisible();
  await evidence(page, 'TC-100', 2);
});

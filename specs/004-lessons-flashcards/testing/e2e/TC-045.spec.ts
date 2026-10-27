import { expect, test } from '@playwright/test';
import {
  MB,
  T07,
  addStep,
  chooseFile,
  slowUploads,
  evidence,
  fileBlock,
  gvPage,
  newCurriculum,
  newLesson,
  padded,
  saveStep,
} from './helpers';

test('[004:AC-6.5] TC-045 "Đang xử lý…" after 100 %: draft save allowed, publish not', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Tài liệu', { goal: '', blocks: [fileBlock('document', null)] });
  await page.goto(T07(cur.id, les.id));
  await slowUploads(page, 5 * MB);
  const step = page.getByRole('region', { name: 'Bước học 1' });
  const block = step.locator('.st-block').nth(0);
  await page.evaluate(() => {
    const w = window as unknown as { __processing: unknown[] };
    w.__processing = [];
    new MutationObserver(() => {
      const s = document.querySelector('[aria-label="Bước học 1"]');
      if (!s?.textContent?.includes('Đang xử lý…')) return;
      const btn = (name: string) =>
        [...s.querySelectorAll('button')].find((b) => b.textContent?.trim() === name) as HTMLButtonElement | undefined;
      w.__processing.push({ publishDisabled: !!btn('Xuất bản')?.disabled, saveDisabled: !!btn('Lưu nháp')?.disabled });
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true });
  });
  await chooseFile(page, block.getByRole('button', { name: 'Chọn tệp' }), {
    name: 'bai.pdf',
    mimeType: 'application/pdf',
    buffer: padded('pdf', 20 * MB),
  });
  // The processing window is short: record the buttons the moment "Đang xử lý…" is on screen.
  await expect(block.getByRole('button', { name: 'Thay tệp' })).toBeVisible({ timeout: 30_000 });
  const seen = await page.evaluate(() => (window as unknown as { __processing: unknown[] }).__processing);
  expect(seen.length, '"Đang xử lý…" was shown').toBeGreaterThan(0);
  expect(seen[0]).toEqual({ publishDisabled: true, saveDisabled: false });
  await evidence(page, 'TC-045', 2);
});

import { expect, test } from '@playwright/test';
import {
  T07,
  addStep,
  aiApprove,
  api,
  chooseFile,
  deck,
  evidence,
  gvPage,
  newCurriculum,
  newLesson,
  saveStep,
  text,
  vocab,
  xlsx,
} from './helpers';

test('[004:NFR-3] TC-099 T07 with 30 steps / 300 blocks, Excel 200 rows, approving 15 over 30', async ({ browser }) => {
  test.setTimeout(300_000);
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  // 29 steps of 8 blocks (one deck each) + 1 step of 50 blocks (100 words, 100 lines) = 282 + … ≈ 300 blocks.
  const ids: string[] = [];
  for (let s = 0; s < 30; s++) ids.push(await addStep(page, les.id));
  for (const [s, id] of ids.entries()) {
    const blocks =
      s === 0
        ? [
            vocab(Array.from({ length: 100 }, (_, i) => ({ hanzi: `字${i}`, pinyin: 'zì', meaning: `nghĩa ${i}` }))),
            { id: 'd', type: 'dialogue', lines: Array.from({ length: 100 }, (_, i) => ({ hanzi: `你好${i}` })) },
            ...Array.from({ length: 48 }, (_, i) => text(`<p>${i}</p>`, `t${i}`)),
          ]
        : [
            deck([{ id: 'c1', front: '你', meaning: 'bạn' }]),
            ...Array.from({ length: 8 }, (_, i) => text(`<p>${s}-${i}</p>`, `t${i}`)),
          ];
    await saveStep(page, les.id, id, `Bước ${s + 1}`, { goal: '', blocks });
  }
  const total = (await api(page, 'GET', `/api/lessons/${les.id}`)).items.reduce(
    (n: number, i: { content: { blocks: unknown[] } }) => n + i.content.blocks.length,
    0,
  );
  expect(total).toBeGreaterThanOrEqual(300);

  const t0 = Date.now();
  await page.goto(T07(cur.id, les.id));
  await expect(page.getByRole('region', { name: 'Bước học 30', exact: true }).getByLabel('Tên bước học')).toBeEditable();
  const openMs = Date.now() - t0;

  await page.getByRole('tab', { name: /Bài tập/ }).click();
  const t1 = Date.now();
  await page.getByRole('tab', { name: /Bài học/ }).click();
  await expect(page.getByRole('region', { name: 'Bước học 30', exact: true })).toBeVisible();
  const tabMs = Date.now() - t1;

  const typing = await page.getByRole('region', { name: 'Bước học 2', exact: true }).getByLabel('Tên bước học').evaluate(async (el: HTMLInputElement) => {
    el.focus();
    const t = performance.now();
    document.execCommand('insertText', false, 'x');
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    return performance.now() - t;
  });

  const rows = [['Chữ Hán', 'Pinyin', 'Loại từ', 'Nghĩa tiếng Việt', 'Ví dụ'], ...Array.from({ length: 200 }, (_, i) => [`汉${i}`, 'hàn', '', `nghĩa ${i}`, ''])];
  await page.getByRole('region', { name: 'Bước học 2', exact: true }).getByRole('button', { name: 'Soạn bộ thẻ' }).click();
  const t2 = Date.now();
  await chooseFile(page, page.getByRole('dialog').getByRole('button', { name: 'Nhập từ Excel' }), {
    name: 'tu.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: xlsx(rows),
  });
  await expect(page.getByText('200 dòng hợp lệ · 0 dòng lỗi · 0 dòng trùng')).toBeVisible();
  const excelMs = Date.now() - t2;
  await page.getByRole('dialog').getByRole('button', { name: 'Xong' }).click();

  const t3 = Date.now();
  await aiApprove(
    page,
    les.id,
    Array.from({ length: 15 }, (_, i) => ({ title: `AI ${i + 1}`, content: { goal: '', blocks: [text('<p>AI</p>')] } })),
  );
  const approveMs = Date.now() - t3;
  const report = { openMs, tabMs, typing, excelMs, approveMs };
  console.log('NFR-3 (ms)', JSON.stringify(report));
  test.info().annotations.push({ type: 'measurements', description: JSON.stringify(report) });
  await evidence(page, 'TC-099');
  expect.soft(openMs, 'T07 with 30 steps').toBeLessThanOrEqual(2000);
  expect.soft(tabMs, 'Bài tập → Bài học').toBeLessThanOrEqual(1000);
  expect.soft(typing, 'typing').toBeLessThanOrEqual(100);
  expect.soft(excelMs, 'Excel preview 200 rows').toBeLessThanOrEqual(5000);
  expect.soft(approveMs, 'approve 15 over 30').toBeLessThanOrEqual(5000);
});

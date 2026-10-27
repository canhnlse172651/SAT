import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { strFromU8, unzipSync } from 'fflate';
import { T07, addStep, deck, evidence, gvPage, newCurriculum, newLesson, saveStep, vocab } from './helpers';

/** Sheet names and the rows (texts) of each sheet of an .xlsx written with inline strings. */
function readXlsx(bytes: Uint8Array) {
  const files = unzipSync(bytes);
  const wb = strFromU8(files['xl/workbook.xml']!);
  const names = [...wb.matchAll(/<sheet [^>]*name="([^"]+)"/g)].map((m) => m[1]);
  const rows = (n: number) =>
    [...strFromU8(files[`xl/worksheets/sheet${n}.xml`]!).matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((r) =>
      [...r[1]!.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]),
    );
  return { names, first: rows(1), second: rows(2) };
}

test('[004:AC-12.1] TC-072 the Excel template from T08 and from a vocabulary block', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Bước', {
    goal: '',
    blocks: [vocab([{ hanzi: '你', meaning: 'bạn' }]), deck([{ id: 'c1', front: '你', meaning: 'bạn' }])],
  });
  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 1' });
  const fromVocab = page.waitForEvent('download');
  await step.locator('.st-block').nth(0).getByRole('link', { name: 'Tải file mẫu' }).click();
  await step.getByRole('button', { name: 'Soạn bộ thẻ' }).click();
  const fromDeck = page.waitForEvent('download');
  await page.getByRole('dialog').getByRole('link', { name: 'Tải file mẫu' }).click();
  for (const dl of [await fromVocab, await fromDeck]) {
    expect(dl.suggestedFilename()).toBe('mau-tu-vung.xlsx');
    const x = readXlsx(readFileSync((await dl.path())!));
    expect(x.names).toEqual(['Từ vựng', 'Hướng dẫn']);
    expect(x.first).toEqual([['Chữ Hán', 'Pinyin', 'Loại từ', 'Nghĩa tiếng Việt', 'Ví dụ']]);
    const guide = x.second.map((r) => r.join(' | ')).join('\n');
    for (const col of ['Chữ Hán', 'Pinyin', 'Loại từ', 'Nghĩa tiếng Việt', 'Ví dụ']) expect(guide).toContain(col);
    expect(guide).toContain('Động từ năng nguyện');
    expect(guide).toContain('你好');
  }
  await evidence(page, 'TC-072');
});

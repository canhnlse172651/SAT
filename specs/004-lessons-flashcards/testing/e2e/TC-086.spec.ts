import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import {
  S03,
  docx,
  evidence,
  fileBlock,
  gvPage,
  hvPage,
  newClass,
  newCurriculum,
  newLesson,
  pdf,
  pptx,
  publishLesson,
  publishedStep,
  upload,
} from './helpers';

test('[004:AC-14.5] TC-086 PDF, DOCX and PPTX read inside S03; download the original', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const files = {
    pdf: pdf(['Page one', 'Page two', 'Page three']),
    docx: docx(['Trang một của Word', 'Trang hai của Word']),
    pptx: pptx(['Slide 1', 'Slide 2', 'Slide 3', 'Slide 4']),
  };
  const refs = {
    pdf: (await upload(page, 'document', 'bai.pdf', files.pdf)).body,
    docx: (await upload(page, 'document', 'bai.docx', files.docx)).body,
    pptx: (await upload(page, 'document', 'bai.pptx', files.pptx)).body,
  };
  const step = await publishedStep(page, les.id, 'Tài liệu', [
    fileBlock('document', refs.pdf, 'PDF', 'd1'),
    fileBlock('document', refs.docx, 'Word', 'd2'),
    fileBlock('document', refs.pptx, 'PowerPoint', 'd3'),
  ]);
  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  const cls = await newClass(page, cur.id, [hv.who.user.id]);
  await hv.page.goto(S03(cls.id, step));
  const startUrl = hv.page.url();

  const cases: [number, number, string, keyof typeof files][] = [
    [0, 3, 'bai.pdf', 'pdf'],
    [1, 2, 'bai.docx', 'docx'],
    [2, 4, 'bai.pptx', 'pptx'],
  ];
  for (const [n, pages, name, key] of cases) {
    const doc = hv.page.locator('.st-doc').nth(n);
    await expect(doc.getByText(`Trang 1/${pages}`)).toBeVisible({ timeout: 15_000 });
    await expect(doc.getByRole('button', { name: 'Trang trước' })).toBeDisabled();
    await doc.getByRole('button', { name: 'Trang sau' }).click();
    await expect(doc.getByText(`Trang 2/${pages}`)).toBeVisible();
    await doc.getByRole('button', { name: 'Trang trước' }).click();
    await expect(doc.getByText(`Trang 1/${pages}`)).toBeVisible();
    await doc.getByRole('button', { name: 'Phóng to' }).click();
    await expect(doc.getByRole('button', { name: 'Thu nhỏ' })).toBeEnabled();
    if (key === 'docx') await expect(doc.getByText('Trang một của Word')).toBeVisible();
    if (key === 'pptx') await expect(doc.getByText('Slide 1')).toBeVisible();
    if (key === 'pdf') await expect(doc.locator('canvas')).toBeVisible();
    const dl = hv.page.waitForEvent('download');
    await doc.getByRole('link', { name: 'Tải về' }).click();
    const file = await dl;
    expect(file.suggestedFilename()).toBe(name);
    expect(readFileSync((await file.path())!).equals(files[key])).toBe(true);
  }
  expect(hv.page.url()).toBe(startUrl);
  await evidence(hv.page, 'TC-086');
});

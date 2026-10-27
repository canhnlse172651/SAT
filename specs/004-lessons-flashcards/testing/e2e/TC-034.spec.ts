import { expect, test } from '@playwright/test';
import {
  T07,
  addStep,
  chooseFile,
  evidence,
  fileBlock,
  gvPage,
  newCurriculum,
  newLesson,
  pdf,
  png,
  saveStep,
  wav,
  webm,
} from './helpers';

test('[004:AC-5.1] [004:AC-5.2] TC-034 formats accepted per block, others refused before upload', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Tệp', {
    goal: '',
    blocks: [fileBlock('video', null), fileBlock('document', null), fileBlock('image', null), fileBlock('audio', null)],
  });
  await page.goto(T07(cur.id, les.id));
  const uploads: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/api/steps/files')) uploads.push(r.url());
  });
  const block = (n: number) => page.locator('.st-block').nth(n);
  const wrong: [number, string, string][] = [
    [0, 'bai.avi', 'Định dạng không được hỗ trợ. Khối Video chỉ nhận: MP4, MOV, WebM.'],
    [1, 'bai.doc', 'Định dạng không được hỗ trợ. Khối Tài liệu chỉ nhận: PDF, DOCX, PPTX.'],
    [2, 'anh.heic', 'Định dạng không được hỗ trợ. Khối Hình ảnh chỉ nhận: JPG/JPEG, PNG, WebP, GIF.'],
    [3, 'am.ogg', 'Định dạng không được hỗ trợ. Khối Âm thanh chỉ nhận: MP3, M4A, WAV.'],
  ];
  for (const [n, name, msg] of wrong) {
    await chooseFile(page, block(n).getByRole('button', { name: 'Chọn tệp' }), {
      name,
      mimeType: 'application/octet-stream',
      buffer: Buffer.from('x'),
    });
    await expect(block(n).getByText(msg)).toBeVisible();
  }
  expect(uploads).toEqual([]);
  await evidence(page, 'TC-034', 1);

  const right = [
    { name: 'bai.webm', mimeType: 'video/webm', buffer: await webm(page) },
    { name: 'bai.pdf', mimeType: 'application/pdf', buffer: pdf(['Một']) },
    { name: 'anh.png', mimeType: 'image/png', buffer: png() },
    { name: 'am.wav', mimeType: 'audio/wav', buffer: wav() },
  ];
  for (const [n, file] of right.entries()) {
    await chooseFile(page, block(n).getByRole('button', { name: /Chọn tệp/ }).first(), file);
    await expect(block(n).getByText(new RegExp(`${file.name.replace('.', '\\.')} · `))).toBeVisible();
    await expect(block(n).getByRole('button', { name: 'Thay tệp' })).toBeVisible();
  }
  await evidence(page, 'TC-034', 2);
});

import { expect, test } from '@playwright/test';
import {
  S03,
  T07,
  addStep,
  api,
  evidence,
  fileBlock,
  freshGvPage,
  hvPage,
  newClass,
  newCurriculum,
  newLesson,
  publishLesson,
  publishedStep,
  saveStep,
  text,
} from './helpers';

const OK_ID = 'dQw4w9WgXcQ';
const GONE_ID = 'aaaaaaaaaaa'; // well-formed id of no video

test('[004:AC-18.1] [004:AC-18.2] [004:AC-18.3] TC-092 a YouTube video instead of a file', async ({ browser }) => {
  const { page } = await freshGvPage(browser);
  const hvAccount = await api(page, 'POST', '/api/students', { displayName: 'HV QA', email: `hvqa+${Date.now()}@sat.dev` });
  await api(page, 'POST', `/api/students/${hvAccount.id}/activate`);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Video YouTube', { goal: '', blocks: [fileBlock('video', null)] });
  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 1' });
  const used = async () => (await api<{ usedBytes: number }>(page, 'GET', '/api/steps/storage')).usedBytes;
  const before = await used();

  await step.getByRole('button', { name: 'Dán liên kết YouTube' }).click();
  await step.getByLabel('Liên kết YouTube').fill('https://vimeo.com/1');
  await step.getByRole('button', { name: 'Dùng liên kết' }).click();
  await expect(step.getByText('Chỉ hỗ trợ liên kết video YouTube (youtube.com hoặc youtu.be).')).toBeVisible();
  for (const link of [`https://www.youtube.com/watch?v=${OK_ID}`, `https://youtube.com/shorts/${OK_ID}`, `https://youtu.be/${OK_ID}`]) {
    if (await step.getByRole('button', { name: 'Bỏ liên kết YouTube' }).count()) {
      await step.getByRole('button', { name: 'Bỏ liên kết YouTube' }).click();
    }
    if (!(await step.getByLabel('Liên kết YouTube').count())) {
      await step.getByRole('button', { name: 'Dán liên kết YouTube' }).click();
    }
    await step.getByLabel('Liên kết YouTube').fill(link);
    await step.getByRole('button', { name: 'Dùng liên kết' }).click();
    await expect(step.locator(`iframe[src*="/embed/${OK_ID}"]`)).toBeVisible();
  }
  await expect(step.getByText('Video YouTube · không tính vào dung lượng lưu trữ')).toBeVisible();
  await step.getByRole('button', { name: 'Xuất bản' }).click();
  await expect(step.getByText('Đã xuất bản', { exact: true })).toBeVisible();
  expect(await used()).toBe(before);
  await evidence(page, 'TC-092', 1);

  const gone = await publishedStep(page, les.id, 'Video đã gỡ', [
    { id: 'v', type: 'video', file: null, youtube: GONE_ID, caption: '' },
    text('<p>Khối khác vẫn hiện</p>'),
  ]);
  await publishLesson(page, les.id);
  const cls = await newClass(page, cur.id, [hvAccount.id]);
  const hv = await hvPage(browser, hvAccount.id);
  await hv.page.goto(S03(cls.id, id));
  const player = hv.page.frameLocator(`iframe[src*="/embed/${OK_ID}"]`);
  await expect(player.locator('video, .ytp-large-play-button').first()).toBeAttached({ timeout: 30_000 });
  await evidence(hv.page, 'TC-092', 2);
  await hv.page.goto(S03(cls.id, gone));
  await expect(hv.page.getByText('Video không còn khả dụng. Hãy báo giáo viên.')).toBeVisible({ timeout: 30_000 });
  await expect(hv.page.getByText('Khối khác vẫn hiện')).toBeVisible();
  await evidence(hv.page, 'TC-092', 3);
});

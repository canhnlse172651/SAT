import { expect, test } from '@playwright/test';
import { answerE3, evidence, freshStudents, gvPage, hvPage, newClass, scheduledExam, startOnScreen, timerSeconds, uid } from './helpers';

const OFFLINE =
  'Mất kết nối — đồng hồ vẫn chạy. Câu trả lời chưa lưu sẽ không được tính nếu không kết nối lại trước khi hết giờ.';

test('[006:AC-10.1] TC-070 offline: warning with the unsaved count, questions still usable, clock running', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-070 ${uid()}`;
  await scheduledExam(page, { name, classIds: [A.id] });
  const hv = await hvPage(browser, h!);
  const p = hv.page;
  await startOnScreen(p, name);
  await hv.ctx.setOffline(true);
  await answerE3(p, { q1: 'Xin chào', q3: '你好' });
  const banner = p.getByRole('alert').filter({ hasText: 'Mất kết nối' });
  await expect(banner).toContainText(OFFLINE, { timeout: 5000 });
  await expect(banner).toContainText('2 câu chưa lưu');
  const t1 = await timerSeconds(p);
  await p.getByRole('navigation', { name: 'Bảng số câu' }).getByRole('button', { name: /^Câu 2 · / }).click();
  await expect(p.getByText('Câu 2/3')).toBeVisible();
  await p.waitForTimeout(1500);
  expect(await timerSeconds(p)).toBeLessThan(t1);
  await evidence(p, 'TC-070');
  await hv.ctx.setOffline(false);
});

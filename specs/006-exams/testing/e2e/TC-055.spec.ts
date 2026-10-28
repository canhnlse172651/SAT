import { expect, test } from '@playwright/test';
import { S07, card, e3, evidence, freshStudents, gvPage, hvPage, newClass, scheduledExam, uid, vnTimeDate } from './helpers';

test('[006:AC-8.1] TC-055 the lobby: facts, rules, buttons and no question', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-055 ${uid()}`;
  const ex = await scheduledExam(page, { name, classIds: [A.id], content: e3('Không dùng từ điển'), dur: 45, closeAfter: 60 });
  const hv = await hvPage(browser, h!);
  const bodies: string[] = [];
  hv.page.on('response', async (r) => {
    if (r.url().includes('/api/learn/exams')) bodies.push(await r.text().catch(() => ''));
  });
  await hv.page.goto(S07);
  await card(hv.page, name).getByRole('button', { name: 'Vào thi' }).click();
  const p = hv.page;
  await expect(p.getByRole('heading', { name })).toBeVisible();
  await expect(p.getByText('Không dùng từ điển')).toBeVisible();
  await expect(p.getByText('Số câu hỏi')).toBeVisible();
  await expect(p.locator('dl')).toContainText('3');
  await expect(p.locator('dl')).toContainText('45 phút');
  await expect(p.locator('dl')).toContainText(vnTimeDate(ex.closesAtDate));
  await expect(p.getByText('Bạn chỉ được làm bài thi này một lần.')).toBeVisible();
  await expect(p.getByText('Đồng hồ chạy liên tục kể cả khi bạn thoát ra hoặc mất kết nối.')).toBeVisible();
  await expect(p.getByRole('button', { name: 'Bắt đầu làm bài' })).toBeVisible();
  await expect(p.getByRole('button', { name: 'Quay lại' })).toBeVisible();
  await expect(p.getByText('你好?')).toHaveCount(0);
  expect(bodies.join('\n')).not.toContain('你好?');
  expect(bodies.join('\n')).not.toContain('Nối từ với nghĩa');
  await evidence(p, 'TC-055');
});

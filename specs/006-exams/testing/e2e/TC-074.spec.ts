/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { ORIGIN, S08, answerE3, api, evidence, gvPage, hvPage, newClass, scheduledExam, startOnScreen, uid } from './helpers';

test('[006:AC-10.3] TC-074 signing in again after the session ended continues the attempt', async ({ browser }) => {
  test.setTimeout(60_000);
  const { page } = await gvPage(browser);
  // The seeded hv1 (its password is known: test-cases.md, shared data).
  const hv1 = (await api<any>(page, 'GET', '/api/students?q=hv1%40sat.dev')).items.find((s: any) => s.email === 'hv1@sat.dev');
  const A = await newClass(page, [hv1.id]);
  const name = `TC-074 ${uid()}`;
  const ex = await scheduledExam(page, { name, classIds: [A.id] });
  const hv = await hvPage(browser, hv1.id);
  const p = hv.page;
  await startOnScreen(p, name);
  await answerE3(p, { q1: 'Xin chào' });
  await expect(p.getByText(/^Đã lưu lúc/)).toBeVisible({ timeout: 5000 });
  await p.request.post('/api/auth/logout', { headers: { Origin: ORIGIN } });
  await p.goto(S08(ex.id));
  await expect(p).toHaveURL(/\/dang-nhap\?returnTo=/);
  await p.getByLabel('Email').fill('hv1@sat.dev');
  await p.getByLabel('Mật khẩu').fill('HocVien2026');
  await p.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(p).toHaveURL(new RegExp(`${S08(ex.id)}$`));
  await expect(p.getByRole('timer', { name: 'Thời gian còn lại' })).toBeVisible();
  await expect(p.getByRole('navigation', { name: 'Bảng số câu' }).getByRole('button', { name: 'Câu 1 · đã hoàn thành' })).toBeVisible();
  await evidence(p, 'TC-074');
});

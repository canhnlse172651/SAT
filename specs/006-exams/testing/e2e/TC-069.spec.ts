import { expect, test } from '@playwright/test';
import { evidence, freshStudents, gvPage, hvPage, match, mcq, newClass, order, scheduledExam, startOnScreen, uid, write } from './helpers';

test('[006:AC-9.5] TC-069 authored question order for everyone; per-attempt order of items kept on resume', async ({ browser }) => {
  test.setTimeout(90_000);
  const { page } = await gvPage(browser);
  const [h1, h2] = await freshStudents(page, 2);
  const A = await newClass(page, [h1!, h2!]);
  const name = `TC-069 ${uid()}`;
  const content = {
    instructions: '',
    stepId: null,
    questions: [
      mcq('你好?', [{ text: 'Xin chào', correct: true }, { text: 'Tạm biệt' }]),
      match('Nối từ với nghĩa', [['你好', 'xin chào'], ['谢谢', 'cảm ơn'], ['再见', 'tạm biệt'], ['老师', 'giáo viên']]),
      order('Sắp xếp thành câu', ['我', '是', '越南', '人']),
      write('Viết chữ Hán', 'nǐ hǎo', ['你好']),
    ],
  };
  await scheduledExam(page, { name, classIds: [A.id], content });
  const orderB = async (p: typeof page) => {
    await p.getByRole('navigation', { name: 'Bảng số câu' }).getByRole('button', { name: /^Câu 2 · / }).click();
    return p.getByRole('group', { name: 'Cột B' }).getByRole('button').allInnerTexts();
  };
  const prompts = async (p: typeof page) => {
    const out: string[] = [];
    for (const n of [1, 2, 3, 4]) {
      await p.getByRole('navigation', { name: 'Bảng số câu' }).getByRole('button', { name: new RegExp(`^Câu ${n} · `) }).click();
      out.push(await p.locator('.xm-question').innerText());
    }
    return out.map((s) => s.replace(/\s+/g, ' ').slice(0, 40));
  };
  const hv1 = await hvPage(browser, h1!);
  await startOnScreen(hv1.page, name);
  const p1 = await prompts(hv1.page);
  const b1 = await orderB(hv1.page);
  await hv1.page.reload();
  await expect(hv1.page.getByRole('timer')).toBeVisible();
  expect(await orderB(hv1.page)).toEqual(b1);
  const hv2 = await hvPage(browser, h2!);
  await startOnScreen(hv2.page, name);
  expect(await prompts(hv2.page)).toEqual(p1);
  expect(p1.join('|')).toMatch(/你好\?.*Nối từ.*Sắp xếp.*Viết chữ Hán/);
  await evidence(hv1.page, 'TC-069');
});

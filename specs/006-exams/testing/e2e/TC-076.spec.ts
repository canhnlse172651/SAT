import { expect, test } from '@playwright/test';
import { answerE3, evidence, freshStudents, gvPage, hvPage, newClass, scheduledExam, startOnScreen, uid } from './helpers';

test('[006:AC-10.5] TC-076 leaving with unsaved answers warns first', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-076 ${uid()}`;
  await scheduledExam(page, { name, classIds: [A.id] });
  const hv = await hvPage(browser, h!);
  const p = hv.page;
  await startOnScreen(p, name);
  await hv.ctx.setOffline(true);
  await answerE3(p, { q1: 'Xin chào' });
  await p.getByRole('link', { name: 'Bài thi' }).click();
  const dialog = p.getByRole('alertdialog');
  await expect(dialog).toContainText('Một số câu trả lời chưa được lưu. Rời trang có thể làm mất chúng.');
  await evidence(p, 'TC-076');
  await dialog.getByRole('button', { name: 'Ở lại' }).click();
  await expect(p.getByRole('timer')).toBeVisible();
  let kind = '';
  p.once('dialog', (d) => {
    kind = d.type();
    void d.dismiss();
  });
  await p.reload({ timeout: 3000 }).catch(() => undefined);
  expect(kind).toBe('beforeunload');
  await hv.ctx.setOffline(false);
});

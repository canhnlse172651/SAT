import { expect, test } from '@playwright/test';
import { addToClass, evidence, freshStudents, gvPage, hvPage, newClass, scheduledExam, startOnScreen, uid } from './helpers';

test('[006:AC-7.8] TC-054 an HV added to an assigned class during the exam can take it', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h1, h4] = await freshStudents(page, 2);
  const A = await newClass(page, [h1!]);
  const name = `TC-054 ${uid()}`;
  await scheduledExam(page, { name, classIds: [A.id] });
  await addToClass(page, A.id, [h4!]);
  const hv = await hvPage(browser, h4!);
  await startOnScreen(hv.page, name);
  await expect(hv.page.getByText('Câu 1/3')).toBeVisible();
  await evidence(hv.page, 'TC-054');
});

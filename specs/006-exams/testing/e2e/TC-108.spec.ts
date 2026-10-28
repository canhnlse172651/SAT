/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { S07, api, card, evidence, freshStudents, gvPage, hvPage, newClass, scheduledExam, startOnScreen, uid } from './helpers';

test('[006:AC-16.5] TC-108 per-class hiding of sections (003) does not apply to exams', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const cls = await api<any>(page, 'GET', `/api/classes/${A.id}`);
  const curriculumId = cls.curriculum?.id ?? cls.curriculumId;
  const les = await api<any>(page, 'POST', `/api/curricula/${curriculumId}/lessons`, { name: `Bài ${uid()}` });
  for (const section of ['lesson', 'exercise'])
    await api(page, 'PUT', `/api/classes/${A.id}/visibility`, { hidden: true, scope: { kind: 'section', lessonId: les.id, section } });
  const name = `TC-108 ${uid()}`;
  await scheduledExam(page, { name, classIds: [A.id] });
  const hv = await hvPage(browser, h!);
  await hv.page.goto(S07);
  await expect(card(hv.page, name)).toBeVisible();
  await startOnScreen(hv.page, name);
  await expect(hv.page.getByText('Câu 1/3')).toBeVisible();
  await evidence(hv.page, 'TC-108');
});

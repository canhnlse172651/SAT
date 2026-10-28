import { expect, test } from '@playwright/test';
import { T22, draftExam, endClass, evidence, freshStudents, gvPage, newClass } from './helpers';

test('[006:AC-3.1] TC-016 the class picker lists Sắp bắt đầu and Đang học classes with size, never Đã kết thúc', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h1, h2] = await freshStudents(page, 2);
  const A = await newClass(page, [h1!, h2!]);
  const B = await newClass(page, [h1!]);
  const C = await newClass(page, [h2!], { startOffset: 3 });
  const D = await newClass(page, [h1!]);
  await endClass(page, D.id);
  const d = await draftExam(page);

  await page.goto(T22(d.id));
  await page.getByRole('button', { name: 'Chọn lớp…' }).click();
  const pop = page.getByRole('group', { name: 'Chọn lớp được giao' });
  await expect(pop.getByText(`${A.name} · Đang học · 2 học viên`)).toBeVisible();
  await expect(pop.getByText(`${B.name} · Đang học · 1 học viên`)).toBeVisible();
  await expect(pop.getByText(`${C.name} · Sắp bắt đầu · 1 học viên`)).toBeVisible();
  await expect(pop.getByText(D.name)).toHaveCount(0);
  await pop.getByText(A.name).click();
  await pop.getByText(C.name).click();
  await expect(page.getByRole('button', { name: `Bỏ lớp ${A.name}` })).toBeVisible();
  await expect(page.getByRole('button', { name: `Bỏ lớp ${C.name}` })).toBeVisible();
  await evidence(page, 'TC-016');
});

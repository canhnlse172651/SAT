import { expect, test } from '@playwright/test';
import {
  T07,
  endClass,
  evidence,
  gvPage,
  hideSection,
  newClass,
  newCurriculum,
  newLesson,
  publishLesson,
  publishedStep,
  studentIds,
  text,
} from './helpers';

test('[004:AC-7.4] TC-052 notice with the number of classes seeing the published steps', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await publishedStep(page, les.id, 'Bước', [text('<p>你好</p>')]);
  await publishLesson(page, les.id);
  const [hv] = await studentIds(page);
  const active = await newClass(page, cur.id, [hv!]);
  const ended = await newClass(page, cur.id, [hv!]);
  await endClass(page, ended.id);
  const hiding = await newClass(page, cur.id, [hv!]);
  await hideSection(page, hiding.id, les.id, 'lesson');

  await page.goto(T07(cur.id, les.id));
  await expect(
    page.getByText('Các bước đã xuất bản đang hiển thị với học viên của 1 lớp. Thay đổi có hiệu lực ngay khi lưu.'),
  ).toBeVisible();
  await evidence(page, 'TC-052', 1);
  await endClass(page, active.id);
  await page.reload();
  await expect(page.getByRole('region', { name: 'Bước học 1' })).toBeVisible();
  await expect(page.getByText(/Các bước đã xuất bản đang hiển thị với học viên/)).toHaveCount(0);
  await evidence(page, 'TC-052', 2);
});

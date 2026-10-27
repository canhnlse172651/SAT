import { expect, test } from '@playwright/test';
import {
  ORIGIN,
  S03,
  addSet,
  evidence,
  gvPage,
  hideSection,
  hvPage,
  linkPractice,
  newClass,
  newCurriculum,
  newLesson,
  publishLesson,
  publishSet,
  publishedStep,
  setDeadline,
  text,
  vnToday,
} from './helpers';

test('[004:AC-10.3] TC-066 practice buttons on S03 follow the set state in the class', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const step = await publishedStep(page, les.id, 'Từ mới', [text('<p>新</p>')]);
  const sets: Record<string, string> = {};
  for (const name of ['A', 'B', 'C']) {
    sets[name] = await addSet(page, les.id);
    await publishSet(page, les.id, sets[name]!, `Bộ ${name}`);
  }
  sets['D'] = await addSet(page, les.id); // draft
  for (const id of Object.values(sets)) await linkPractice(page, id, step);
  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  const cls = await newClass(page, cur.id, [hv.who.user.id]);
  await setDeadline(page, cls.id, sets['A']!, vnToday(7));
  await setDeadline(page, cls.id, sets['B']!, vnToday(7));
  const submitted = await hv.page.request.post(`/api/dev/classes/${cls.id}/sets/${sets['B']}/submit`, {
    headers: { Origin: ORIGIN },
    data: {},
  });
  expect(submitted.ok(), await submitted.text()).toBeTruthy();

  await hv.page.goto(S03(cls.id, step));
  const a = hv.page.getByRole('link', { name: 'Luyện tập: Bộ A' });
  const b = hv.page.getByRole('link', { name: 'Luyện tập: Bộ B' });
  const c = hv.page.getByRole('button', { name: 'Luyện tập: Bộ C' });
  await expect(a).toHaveAttribute('href', `/hv/lop/${cls.id}/bai-tap/${sets['A']}`);
  await expect(b).toHaveAttribute('href', `/hv/lop/${cls.id}/bai-tap/${sets['B']}/ket-qua`);
  await expect(c).toBeDisabled();
  await expect(hv.page.getByText('Chưa mở', { exact: true })).toBeVisible();
  await expect(hv.page.getByText('Luyện tập: Bộ D')).toHaveCount(0);
  const order = await hv.page.locator('.sv-practice').innerText();
  expect(order.indexOf('Bộ A')).toBeLessThan(order.indexOf('Bộ B'));
  expect(order.indexOf('Bộ B')).toBeLessThan(order.indexOf('Bộ C'));
  await evidence(hv.page, 'TC-066', 1);
  await a.click();
  await expect(hv.page).toHaveURL(new RegExp(`/bai-tap/${sets['A']}$`));

  await hideSection(page, cls.id, les.id, 'exercise');
  await hv.page.goto(S03(cls.id, step));
  await expect(hv.page.getByRole('heading', { name: 'Từ mới' })).toBeVisible();
  await expect(hv.page.getByText(/^Luyện tập:/)).toHaveCount(0);
  await evidence(hv.page, 'TC-066', 2);
});

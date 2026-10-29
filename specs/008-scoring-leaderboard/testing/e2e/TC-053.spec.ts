import { expect, test } from '@playwright/test';
import { LESSONS, S06, deadline, evidence, gvPage, hvPage, myScore, newClass, openS09, people, r1, realSubmit, setRow, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-11.4] TC-053 a set row with a submission opens its S06 review', async ({ browser }) => {
  test.setTimeout(90_000);
  const { page: gv } = await gvPage(browser);
  const { An } = await people(gv, ['An']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An]);
  await deadline(gv, A.id, r.sets.S1a);
  const { page: hv } = await hvPage(browser, An);
  await realSubmit(hv, A.id, r.sets.S1a, r.content.S1a, [0]);

  await openS09(hv);
  await myScore(hv);
  await setRow(hv, LESSONS[0], 'Luyện từ mới').click();
  await expect(hv).toHaveURL(new RegExp(`${S06(A.id, r.sets.S1a).replace(/[?]/g, '\\?')}$`));
  await expect(hv.getByText('Không tìm thấy nội dung')).toHaveCount(0);
  // That submission's review: the set's title and its score.
  await expect(hv.getByRole('heading', { name: 'Luyện từ mới' })).toBeVisible();
  await expect(hv.getByText('1 / 1 điểm (100%)')).toBeVisible();
  await evidence(hv, 'TC-053', 1);
});

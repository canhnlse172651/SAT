import { expect, test } from '@playwright/test';
import { S09_OF, api, evidence, gvPage, hvPage, newClass, otherGvPage, people, r1, settle, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-9.2] TC-044 a class that is not mine answers "Không tìm thấy lớp." without telling whether it exists', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const { An, Bình } = await people(gv, ['An', 'Bình']);
  const r = await r1(gv);
  await newClass(gv, r.cur, [An]);
  const B = await newClass(gv, r.cur, [Bình]);
  // Class C of another GV.
  const other = await otherGvPage(browser);
  const cur = await api<{ id: string }>(other.page, 'POST', '/api/curricula', { name: 'GT GV B', hsk: 1 });
  const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  const C = await api<{ id: string }>(other.page, 'POST', '/api/classes', {
    name: 'Lớp GV B',
    startDate: today,
    curriculumId: cur.id,
    studentIds: [],
    createKey: crypto.randomUUID(),
  });

  const { page: hv } = await hvPage(browser, An);
  for (const [k, id] of [B.id, C.id, 'abc'].entries()) {
    await hv.goto(S09_OF(id));
    await settle(hv);
    await expect(hv.getByText('Không tìm thấy lớp.')).toBeVisible();
    await expect(hv.locator('.rk-pod, .rk-lrow, .rk-pin, .rk-mine')).toHaveCount(0);
    await evidence(hv, 'TC-044', k + 1);
  }
});

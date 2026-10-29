import { expect, test } from '@playwright/test';
import { call, deadline, gvPage, hvPage, newClass, people, r1, submitScore, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-9.3] TC-045 an HV cannot read the GV endpoints or another student\'s breakdown', async ({ browser }) => {
  test.setTimeout(90_000);
  const { page: gv } = await gvPage(browser);
  const { An, Bình } = await people(gv, ['An', 'Bình']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An, Bình]);
  await deadline(gv, A.id, r.sets.S1a);
  await submitScore((await hvPage(browser, Bình)).page, A.id, r.sets.S1a, 9, 10);
  const { page: an } = await hvPage(browser, An);

  // 1. GV endpoints: 404, no data.
  for (const path of [`/api/classes/${A.id}/ranking/${Bình}`, `/api/classes/${A.id}/ranking`]) {
    const res = await call(an, 'GET', path);
    expect(res.status, path).toBe(404);
    expect(JSON.stringify(res.body)).not.toContain(Bình);
    expect(res.body).not.toHaveProperty('rows');
  }
  // 2. ?studentId= is ignored: only An's own score.
  const res = await call(an, 'GET', `/api/learn/ranking/${A.id}?studentId=${Bình}`);
  expect(res.status).toBe(200);
  expect(res.body.mine.score).toBe(0);
  expect(res.body.mine.sets[0].status).toBe('todo');
  expect(res.body.me).toEqual({ rank: null, score: 0 });
  expect(res.body.top.find((t: { me: boolean }) => t.me)).toBeUndefined();
});

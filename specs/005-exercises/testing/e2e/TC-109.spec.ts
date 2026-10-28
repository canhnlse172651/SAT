import { expect, test } from '@playwright/test';
import {
  S06, advanceClock, classWithSets, clockTo, evidence, gvPage, hvPage, mcq, resetClock, review, saveAnswers, set, setContent,
  start, submit, vnToday,
} from './helpers';

test('[005:AC-23.1] [005:AC-23.2] TC-109 23:59:59 is on time, 00:00:00 is late', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const due = vnToday(2);
  const d = await classWithSets(gv, [{ title: 'Bộ hạn', content: set([mcq('Câu?', [{ text: 'Đúng', correct: true }, { text: 'Sai' }])]), deadline: due }]);
  const setId = d.sets[0]!;
  const q = (await setContent(gv, d.les, setId)).questions[0];
  const answers = { [q.id]: { optionIds: [q.options[0].id] } };
  const p1 = (await hvPage(browser, d.students[0]!)).page;
  const p2 = (await hvPage(browser, d.students[1]!)).page;
  for (const p of [p1, p2]) {
    await start(p, d.cls, setId);
    await saveAnswers(p, d.cls, setId, answers);
  }
  try {
    // 1. 23:59:59 VN of the deadline day: HV1 submits.
    await clockTo(p1, `${due}T23:59:59.000+07:00`);
    expect((await submit(p1, d.cls, setId, answers)).status).toBeLessThan(300);
    // 2. 00:00:00 the next day: HV2 submits.
    await advanceClock(p1, 1000);
    expect((await submit(p2, d.cls, setId, answers)).status).toBeLessThan(300);
    const r1 = (await review(p1, d.cls, setId)).body;
    const r2 = (await review(p2, d.cls, setId)).body;
    expect([r1.late, r1.score, r1.maxScore]).toEqual([false, 1, 1]);
    expect([r2.late, r2.score, r2.maxScore]).toEqual([true, 1, 1]);
    const [y, m, dd] = due.split('-');
    await p2.goto(S06(d.cls, setId));
    await expect(p2.getByText(`Nộp muộn sau hạn 23:59 ${dd}/${m}/${y} · vẫn được tính điểm đầy đủ`)).toBeVisible();
    await evidence(p2, 'TC-109', 1);
    await p1.goto(S06(d.cls, setId));
    await expect(p1.getByText('Nộp muộn')).toHaveCount(0);
    const v = (await p2.request.get(`/api/learn/classes/${d.cls}/sets/${setId}`)).json();
    expect((await v).set.status).toBe('done');
  } finally {
    await resetClock(p1);
  }
});

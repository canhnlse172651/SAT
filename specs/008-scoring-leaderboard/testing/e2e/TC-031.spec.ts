import { expect, test } from '@playwright/test';
import { boardRows, deadline, evidence, gvPage, hvPage, newClass, openRankingTab, openS09, people, pin, r1, submitScore, tableRows, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-6.3] [008:AC-7.3] TC-031 0,0 is unranked: pinned message for the HV, "—" after the ranked for the GV', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const { An, Bình, Chi } = await people(gv, ['An', 'Bình', 'Chi']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An, Bình, Chi]);
  await deadline(gv, A.id, r.sets.S1a);
  await submitScore((await hvPage(browser, An)).page, A.id, r.sets.S1a, 9, 10);

  // 1. Chi opens S09 "Xếp hạng".
  const { page: chi } = await hvPage(browser, Chi);
  await openS09(chi);
  await expect(pin(chi)).toContainText('Bạn chưa có hạng. Hoàn thành bài tập để nhận điểm xếp hạng.');
  expect((await boardRows(chi)).map((x) => x.name)).toEqual(['Nguyễn Văn An']);
  await evidence(chi, 'TC-031', 1);

  // 2. GV tab.
  await openRankingTab(gv, A.id);
  expect((await tableRows(gv)).map((x) => [x.name, x.rank])).toEqual([
    ['Nguyễn Văn An', '1'],
    ['Trần Thị Bình', '—'],
    ['Phạm Thu Chi', '—'],
  ]);
  await evidence(gv, 'TC-031', 2);
});

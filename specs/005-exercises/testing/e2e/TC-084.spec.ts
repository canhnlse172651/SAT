/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import {
  S06, call, classWithSets, cloze, evidence, gvPage, hvPage, match, mcq, order, set, setContent, start, view, write,
} from './helpers';

test('[005:AC-16.5] [005:NFR-9] TC-084 no key or explanation before submitting', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const why = { explanation: 'GIAI THICH BI MAT' };
  const d = await classWithSets(gv, [
    {
      title: 'Bộ bí mật',
      content: set([
        mcq('Chọn', [{ text: 'Một' }, { text: 'Hai', correct: true }], why),
        cloze('Điền', '我[[秘密甲]]人', [['MATKHAU']], why),
        match('Nối', [['你好', 'xin chào'], ['谢谢', 'cảm ơn']], [], why),
        order('Xếp', ['我', '是', '越南', '人'], why),
        write('Viết', 'mì mì', ['秘密乙'], '', why),
      ]),
    },
  ]);
  const setId = d.sets[0]!;
  const content = await setContent(gv, d.les, setId);
  const { page: hv } = await hvPage(browser, d.students[0]!);
  await start(hv, d.cls, setId);

  // 1. Every response the HV gets while working.
  const bodies = [
    (await view(hv, d.cls, setId)).body,
    (await start(hv, d.cls, setId)).body,
    (await call(hv, 'GET', `/api/my-classes/${d.cls}/items/${setId}`)).body,
    (await call(hv, 'GET', `/api/my-classes/${d.cls}/lessons/${d.les}`)).body,
    (await call(hv, 'GET', `/api/learn/lessons/${d.les}`)).body,
    (await call(hv, 'GET', `/api/learn/items/${setId}`)).body,
  ];
  const match_ = content.questions[2];
  for (const b of bodies) {
    const s = JSON.stringify(b);
    expect(s).not.toContain('"correct"');
    expect(s).not.toContain('"accepted"');
    expect(s).not.toContain('"alternatives"');
    expect(s).not.toContain('GIAI THICH BI MAT');
    expect(s).not.toContain('秘密甲');
    expect(s).not.toContain('MATKHAU');
    expect(s).not.toContain('秘密乙');
    // The right Cột B item of a pair is never sent with its pair.
    expect(s).not.toContain('"bId"');
    expect(s).not.toContain(`"${match_.pairs[0].id}":"${match_.pairs[0].bId}"`);
  }
  // The tiles do not come in the order of the correct sentence.
  const tiles = bodies[0].attempt.questions[3].tiles.map((t: any) => t.text);
  expect(tiles).not.toEqual(['我', '是', '越南', '人']);
  // 2. S06 of X by its link.
  await hv.goto(S06(d.cls, setId));
  await expect(hv.getByText('Bạn chưa nộp bài này.')).toBeVisible();
  await expect(hv.getByText('Đáp án đúng')).toHaveCount(0);
  await expect(hv.getByText('GIAI THICH BI MAT')).toHaveCount(0);
  await evidence(hv, 'TC-084');
});

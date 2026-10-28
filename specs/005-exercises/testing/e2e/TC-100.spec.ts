import { expect, test } from '@playwright/test';
import { ORIGIN, T14, classWithSets, doSet, evidence, gvPage, hvPage, mcq, otherGvPage, set, setContent } from './helpers';

test('[005:AC-20.5] [005:NFR-9] TC-100 T14 only for the owner GV', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [{ title: 'Bộ riêng tư', content: set([mcq('Câu bí mật?', [{ text: 'Đúng', correct: true }, { text: 'Sai' }])]) }]);
  const setId = d.sets[0]!;
  const q = (await setContent(gv, d.les, setId)).questions[0];
  const { page: hv } = await hvPage(browser, d.students[0]!);
  await doSet(hv, d.cls, setId, { [q.id]: { optionIds: [q.options[0].id] } });
  const link = T14(d.cls, d.students[0]!, setId);
  const hidden = async (p: typeof gv) => {
    await expect(p.getByText('Câu bí mật?')).toHaveCount(0);
    await expect(p.getByText('Bộ riêng tư')).toHaveCount(0);
  };

  // 1. A second GV.
  const { page: other } = await otherGvPage(browser);
  await other.goto(link);
  await expect(other.getByText('Không tìm thấy nội dung')).toBeVisible();
  await hidden(other);
  await evidence(other, 'TC-100', 1);
  // 3. A student id without a submission.
  await gv.goto(T14(d.cls, d.students[1]!, setId));
  await expect(gv.getByText('Không tìm thấy nội dung')).toBeVisible();
  await hidden(gv);
  // 4. Not signed in → A01.
  const anon = await browser.newContext({ baseURL: ORIGIN });
  const a = await anon.newPage();
  await a.goto(link);
  await expect(a).toHaveURL(/\/dang-nhap\?returnTo=/);
  await hidden(a);
  // 2. HV A opens the link.
  await hv.goto(link);
  await hv.waitForLoadState('networkidle');
  await evidence(hv, 'TC-100', 2);
  await hidden(hv);
  await expect(hv.getByText('Không tìm thấy nội dung')).toBeVisible();
});

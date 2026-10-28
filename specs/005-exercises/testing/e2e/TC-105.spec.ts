import { expect, test } from '@playwright/test';
import {
  S05, archiveItem, classWithSets, endClass, evidence, gvPage, hideSection, hvPage, mcq, restoreItem, set,
  view,
} from './helpers';

const UNAVAILABLE = 'Bài tập này hiện không khả dụng. Câu trả lời đã lưu của bạn được giữ lại.';

test('[005:AC-21.6] TC-105 the set becomes unavailable during an attempt', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const q = (p: string) => mcq(p, [{ text: 'Đúng', correct: true }, { text: 'Sai' }]);
  const cases: [string, (d: Awaited<ReturnType<typeof classWithSets>>) => Promise<unknown>, ((d: Awaited<ReturnType<typeof classWithSets>>) => Promise<unknown>) | null][] = [
    ['ẩn phần', (d) => hideSection(gv, d.cls, d.les, true), (d) => hideSection(gv, d.cls, d.les, false)],
    ['lưu trữ', (d) => archiveItem(gv, d.les, d.sets[0]!), (d) => restoreItem(gv, d.les, d.sets[0]!)],
    ['kết thúc lớp', (d) => endClass(gv, d.cls), null],
  ];
  let n = 0;
  for (const [name, act, undo] of cases) {
    const d = await classWithSets(gv, [{ title: `Bộ ${name}`, content: set([q('Một'), q('Hai')]) }], {
      students: [(await (await gv.request.get('/api/students')).json()).items[0].id],
    });
    const { page } = await hvPage(browser, d.students[0]!);
    await page.goto(S05(d.cls, d.sets[0]!));
    await page.getByRole('button', { name: 'Bắt đầu làm' }).click();
    await page.getByRole('radio', { name: /^A\s*Đúng/ }).click();
    await expect(page.getByRole('status').filter({ hasText: /^Đã lưu$/ })).toBeVisible();
    // 1. The GV's action.
    await act(d);
    // 2. The HV answers question 2.
    await page.getByRole('button', { name: 'Câu sau' }).click();
    await page.getByRole('radio', { name: /^A\s*Đúng/ }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await evidence(page, 'TC-105', ++n);
    await expect(page.getByRole('alert').filter({ hasText: UNAVAILABLE }), name).toBeVisible();
    if (undo) {
      await undo(d);
      const v = (await view(page, d.cls, d.sets[0]!)).body;
      expect(Object.keys(v.attempt?.answers ?? {}), name).toHaveLength(1);
    }
  }
});

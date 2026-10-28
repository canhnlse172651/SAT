import { expect, test } from '@playwright/test';
import { evidence, freshStudents, goTo, gvPage, hvPage, match, mcq, newClass, order, reading, scheduledExam, startOnScreen, uid } from './helpers';

test('[006:NFR-8] TC-113 360 px: no sideways scroll, timer always visible, touch targets ≥ 44 px, Hanzi ≥ 18 px', async ({ browser }) => {
  test.setTimeout(90_000);
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-113 ${uid()}`;
  const long = '我叫小明。我是学生。'.repeat(60);
  const content = {
    instructions: '',
    stepId: null,
    questions: [
      reading('Đọc đoạn văn và trả lời', long, [mcq('小明 là ai?', [{ text: 'Giáo viên' }, { text: 'Học sinh', correct: true }])]),
      match('Nối từ với nghĩa', [['你好', 'xin chào'], ['谢谢', 'cảm ơn']]),
      order('Sắp xếp thành câu', ['我', '是', '越南', '人']),
    ],
  };
  await scheduledExam(page, { name, classIds: [A.id], content });
  const hv = await hvPage(browser, h!, { viewport: { width: 360, height: 740 } });
  const p = hv.page;
  await startOnScreen(p, name);
  await p.mouse.wheel(0, 3000);
  await p.waitForTimeout(300);
  await expect(p.getByRole('timer')).toBeInViewport();
  expect(await p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await evidence(p, 'TC-113', 1);

  const small: string[] = [];
  const measure = async (what: string, loc: ReturnType<typeof p.locator>) => {
    for (const b of await loc.all()) {
      const box = await b.boundingBox();
      if (box && (box.width < 44 || box.height < 44)) small.push(`${what} ${Math.round(box.width)}×${Math.round(box.height)}`);
    }
  };
  await measure('board', p.getByRole('navigation', { name: 'Bảng số câu' }).getByRole('button'));
  await measure('nav', p.getByRole('button', { name: /Câu trước|Câu sau|Nộp bài/ }));
  await goTo(p, 2);
  await measure('match', p.locator('.qv-item'));
  await goTo(p, 3);
  await measure('tile', p.locator('.qv-match button, .qv-order button, [class*="tile"]'));
  const hanzi = await p.locator('[lang="zh-Hans"]').evaluateAll((els) =>
    els.filter((e) => (e as HTMLElement).offsetParent).map((e) => parseFloat(getComputedStyle(e).fontSize)),
  );
  await evidence(p, 'TC-113', 2);
  expect(small, 'touch targets under 44 × 44 px').toEqual([]);
  expect(Math.min(...hanzi), 'smallest Hanzi font size').toBeGreaterThanOrEqual(18);
});

/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import {
  aiApprove, aiPreview, archiveItem, draftSet, doSet, getLesson, gvPage, hvPage, mcq, newClass, newCurriculum, newLesson,
  publishLesson, publishedSet, set, setContent, setDeadline, studentIds, vnToday,
} from './helpers';

test('[005:AC-13.9] [005:AC-13.11] TC-066 the "Duyệt và thay thế" confirmation of the Bài tập section', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const cur = await newCurriculum(gv);
  const les = await newLesson(gv, cur.id);
  const q = (p = 'Câu?') => mcq(p, [{ text: 'A', correct: true }, { text: 'B' }]);
  await draftSet(gv, les.id, 'A', set([q()]));
  await publishedSet(gv, les.id, 'B', set([q()]));
  const c = await publishedSet(gv, les.id, 'C', set([q()]));
  const dd = await publishedSet(gv, les.id, 'D', set([q()]));
  const e = await publishedSet(gv, les.id, 'E', set([q()]));
  await publishLesson(gv, les.id);
  const students = await studentIds(gv);
  const cls = await newClass(gv, cur.id, students);
  await setDeadline(gv, cls.id, c, vnToday(5));
  await setDeadline(gv, cls.id, dd, vnToday(5));
  const answer = async (setId: string, who: string[]) => {
    const x = (await setContent(gv, les.id, setId)).questions[0];
    for (const id of who) {
      const { page: hv } = await hvPage(browser, id);
      await doSet(hv, cls.id, setId, { [x.id]: { optionIds: [x.options[0].id] } });
    }
  };
  await answer(c, students);
  await answer(dd, [students[0]!]);
  await archiveItem(gv, les.id, dd);
  await archiveItem(gv, les.id, e);

  // 1. Preview 2 new sets (5 questions).
  const items = [
    { title: 'AI 1', content: set([q(), q(), q()]) },
    { title: 'AI 2', content: set([q(), q()]) },
  ];
  const p = await aiPreview(gv, les.id, items);
  expect(p.status).toBe(200);
  expect(p.body.sets).toEqual({
    newSets: 2,
    newQuestions: 5,
    published: 'Nội dung mới được lưu ở trạng thái Đã xuất bản.',
    deleted: ['A', 'B', 'E'],
    archived: [{ title: 'C', submissions: 3 }],
    keptArchived: ['D'],
    empty: null,
    kept: 'Bài làm và điểm của học viên được giữ lại.',
  });
  // 2. Approve: A, B and E are deleted.
  expect((await aiApprove(gv, les.id, items, p.body.token)).status).toBe(200);
  const sets = (await getLesson(gv, les.id)).items.filter((i: any) => i.section === 'exercise');
  expect(sets.map((i: any) => [i.title, i.status])).toEqual([
    ['AI 1', 'published'],
    ['AI 2', 'published'],
    ['C', 'archived'],
    ['D', 'archived'],
  ]);
  // 3. An empty Bài.
  const empty = await newLesson(gv, cur.id, 'Bài trống');
  const pe = await aiPreview(gv, empty.id, items);
  expect(pe.body.sets.empty).toBe('Phần Bài tập của Bài đang trống — không có nội dung nào bị thay thế.');
});

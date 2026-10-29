import { test, expect } from '@playwright/test';
import {
  READY_SET,
  READY_STEP,
  addItem,
  addLesson,
  asGv,
  createCurriculum,
  devClass,
  otherPage,
  publishLesson,
  uid,
} from './helpers';

test('[002:AC-10.1] [002:AC-10.3] TC-037 HV chỉ thấy Bài và mục Đã xuất bản, không thấy phần/Bài rỗng', async ({
  page,
  browser,
}) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-037 ${uid()}`, 1);
  const b1 = await addLesson(page, c.id, 'Bài 1');
  const s = await addItem(page, b1.id, 'lesson', { title: 'S xuất bản', content: READY_STEP });
  await addItem(page, b1.id, 'lesson', { title: 'D nháp', content: READY_STEP });
  await addItem(page, b1.id, 'exercise', { title: 'A lưu trữ', content: READY_SET, archive: true });
  await publishLesson(page, b1.id, [s]);
  const b2 = await addLesson(page, c.id, 'Bài 2');
  await addItem(page, b2.id, 'lesson', { title: 'Mục xuất bản của Bài nháp', content: READY_STEP, publish: true });
  const b3 = await addLesson(page, c.id, 'Bài 3');
  const e = await addItem(page, b3.id, 'exercise', { title: 'Bộ của Bài 3', content: READY_SET });
  await publishLesson(page, b3.id, [e]);
  await devClass(page, c.id, 'Lớp TC-037', { studentEmails: ['hv1@sat.dev'] });

  const hv = await otherPage(browser, 'HV');
  const seen = await hv.request.get(`/api/learn/curricula/${c.id}`).then((r) => r.json());
  const shape = seen.lessons.map((l: { name: string; sections: Record<string, { title: string }[]> }) => ({
    name: l.name,
    lesson: l.sections.lesson!.map((i) => i.title),
    exercise: l.sections.exercise!.map((i) => i.title),
  }));
  expect(shape).toEqual([
    { name: 'Bài 1', lesson: ['S xuất bản'], exercise: [] },
    { name: 'Bài 3', lesson: [], exercise: ['Bộ của Bài 3'] },
  ]);
  await hv.context().close();
});

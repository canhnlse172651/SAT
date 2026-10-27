import { expect, test } from '@playwright/test';
import {
  addSet,
  addStep,
  api,
  archiveStep,
  deck,
  getLesson,
  gvPage,
  linkPractice,
  newClass,
  newCurriculum,
  newLesson,
  publishLesson,
  publishSet,
  publishedStep,
  saveStep,
  studentIds,
  text,
} from './helpers';

test('[004:AC-19.1] [004:AC-19.3] TC-093 confirmation of replacing a published Bài học section', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id, 'Bài 7');
  const a = await publishedStep(page, les.id, 'Cũ A', [deck([{ id: 'c1', front: '你', meaning: 'bạn' }], 'B1', 'k1')]);
  await publishedStep(page, les.id, 'Cũ B', [deck([{ id: 'c2', front: '好', meaning: 'tốt' }], 'B2', 'k2')]);
  const d = await addStep(page, les.id);
  await saveStep(page, les.id, d, 'Cũ C', { goal: '', blocks: [text('<p>C</p>')] });
  const archived = await publishedStep(page, les.id, 'Cũ D', [text('<p>D</p>')]);
  await archiveStep(page, les.id, archived);
  const set = await addSet(page, les.id);
  await publishSet(page, les.id, set, 'Bộ liên kết');
  await linkPractice(page, set, a);
  await publishLesson(page, les.id);
  const ids = await studentIds(page);
  await newClass(page, cur.id, ids);
  await newClass(page, cur.id, ids);
  const before = (await getLesson(page, les.id)).items.map((i: { id: string }) => i.id).join();

  const preview = await api(page, 'POST', '/api/dev/curriculum/ai-approve/preview', {
    lessonId: les.id,
    section: 'lesson',
    items: ['Mới 1', 'Mới 2', 'Mới 3'].map((title) => ({ title, content: { goal: '', blocks: [text('<p>新</p>')] } })),
  });
  expect(preview.confirm.title).toBe(
    'Thay toàn bộ 4 bước học hiện có của phần Bài học (2 Đã xuất bản · 1 Nháp · 1 Lưu trữ) bằng 3 bước mới? Các bước cũ sẽ bị xóa vĩnh viễn, không hoàn tác.',
  );
  expect(preview.confirm.lines).toEqual([
    'Cũ A',
    'Cũ B',
    'Cũ C',
    'Cũ D',
    'Các bước cũ đang hiển thị với học viên của 2 lớp.',
    'Đánh dấu Đã thuộc/Chưa thuộc của học viên với 2 bộ thẻ của các bước cũ cũng sẽ bị xóa.',
    '1 bộ bài tập đang liên kết với các bước cũ sẽ không còn liên kết với bước nào.',
    'Các bước mới được xuất bản ngay: học viên thấy các bước này khi Bài đã xuất bản và phần Bài học không bị ẩn trong lớp.',
  ]);
  expect((await getLesson(page, les.id)).items.map((i: { id: string }) => i.id).join()).toBe(before);
});

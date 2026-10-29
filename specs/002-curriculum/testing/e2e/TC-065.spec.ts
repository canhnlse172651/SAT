import { test, expect } from '@playwright/test';
import { addItem, addLesson, asGv, createCurriculum, getLesson, publishLesson, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-16.3] [002:AC-16.4] [002:AC-16.5] TC-065 nội dung đầy đủ, chọn thử đáp án, không nộp, không ghi nhận', async ({
  page,
}) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-065 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  const s = await addItem(page, l.id, 'lesson', { title: 'Chào hỏi', content: { blocks: [{ type: 'text', text: '你好 nǐ hǎo' }] } });
  const e = await addItem(page, l.id, 'exercise', {
    title: 'Bộ 2 câu',
    content: {
      questions: [
        { type: 'mcq', prompt: '你好 nghĩa là gì?', options: ['Xin chào', 'Tạm biệt'], answer: 0 },
        { type: 'mcq', prompt: '谢谢 nghĩa là gì?', options: ['Xin lỗi', 'Cảm ơn'], answer: 1 },
      ],
    },
  });
  await publishLesson(page, l.id, [s, e]);

  await page.goto(`/gv/giao-trinh/${c.id}/bai/${l.id}/xem-truoc`);
  await expect(page.getByText('你好 nǐ hǎo', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: /Bài tập/ }).click();
  await expect(page.getByRole('group', { name: /Câu 1\. 你好 nghĩa là gì\?/ })).toBeVisible();
  await expect(page.getByRole('group', { name: /Câu 2\. 谢谢 nghĩa là gì\?/ })).toBeVisible();
  await page.getByRole('radio', { name: 'Tạm biệt' }).check();
  await expect(page.getByRole('radio', { name: 'Tạm biệt' })).toBeChecked();
  await expect(page.getByRole('button', { name: /Nộp/ })).toHaveCount(0);
  await expect(page.locator('.pv-frame').getByText(/Đáp án đúng|Đúng rồi|Sai rồi|điểm/i)).toHaveCount(0);
  await shot(page, 'TC-065', 1);

  await page.getByRole('button', { name: 'Thoát xem trước' }).click();
  await expect(page).toHaveURL(new RegExp(`/gv/giao-trinh/${c.id}$`));
  await page.goBack();
  await expect(page).toHaveURL(/\/xem-truoc$/);
  await page.getByRole('tab', { name: /Bài tập/ }).click();
  await expect(page.getByRole('radio', { name: 'Tạm biệt' })).not.toBeChecked();

  // Nothing was recorded: the set still has no learning data.
  expect((await getLesson(page, l.id)).items.find((i: { id: string }) => i.id === e).hasLearningData).toBe(false);
});

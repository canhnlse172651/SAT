import { expect, test } from '@playwright/test';
import { T07, addStep, evidence, gvPage, newCurriculum, newLesson, saveStep, text } from './helpers';

test('[004:AC-3.2] TC-021 reorder blocks with "Xuống" and drag-and-drop', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Bước', {
    goal: '',
    blocks: [text('<p>một</p>', 'a'), text('<p>hai</p>', 'b'), text('<p>ba</p>', 'c')],
  });
  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 1' });
  const content = (n: number) => step.getByRole('textbox', { name: `Nội dung khối ${n}` });
  await step.getByRole('button', { name: 'Xuống (khối 1)' }).click();
  await expect(content(1)).toHaveText('hai');
  await expect(content(2)).toHaveText('một');
  await expect(content(3)).toHaveText('ba');
  // A real mouse drag of block 3's grip onto block 1 (HTML5 drag-and-drop).
  await page.setViewportSize({ width: 1280, height: 1400 }); // the three blocks on screen
  await step.locator('.st-block').nth(0).scrollIntoViewIfNeeded();
  const grip = await step.locator('.st-grip').nth(2).boundingBox();
  const dest = await step.locator('.st-block__head').nth(0).boundingBox();
  await page.mouse.move(grip!.x + grip!.width / 2, grip!.y + grip!.height / 2);
  await page.mouse.down();
  await page.mouse.move(grip!.x + 5, grip!.y - 20, { steps: 5 });
  await page.mouse.move(dest!.x + dest!.width / 2, dest!.y + dest!.height / 2, { steps: 20 });
  await page.mouse.up();
  await expect(content(1)).toHaveText('ba');
  await expect(content(2)).toHaveText('hai');
  await expect(content(3)).toHaveText('một');
  await expect(step.getByText('Khối 1 · Văn bản')).toBeVisible();
  await expect(step.getByText('Khối 3 · Văn bản')).toBeVisible();
  await evidence(page, 'TC-021');
});

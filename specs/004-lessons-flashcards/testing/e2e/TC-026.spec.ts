import { expect, test } from '@playwright/test';
import {
  S03,
  T07,
  addStep,
  evidence,
  getLesson,
  gvPage,
  hvPage,
  newClass,
  newCurriculum,
  newLesson,
  publishLesson,
  saveStep,
  text,
} from './helpers';

const DIRTY =
  '<table><tr><td>ô bảng</td></tr></table><img src=x onerror="alert(1)"><script>alert(2)</script>' +
  '<p style="font-family:Comic Sans" onclick="alert(3)"><b>đậm</b> chữ thường</p><iframe src="https://evil.example"></iframe>';

test('[004:AC-3.7] [004:NFR-6] TC-026 pasted content keeps only allowed formats; no script runs', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const alerts: string[] = [];
  page.on('dialog', (d) => {
    alerts.push(d.message());
    void d.dismiss();
  });
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Dán', {
    goal: '',
    blocks: [text('<p></p>'), { id: 'g', type: 'grammar', name: 'Mẫu', structure: '', explanation: '', examples: [{ sentence: '吗', pinyin: 'ma', meaning: 'không' }] }],
  });
  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 1' });
  const paste = async (name: string) => {
    const box = step.getByRole('textbox', { name });
    await box.click();
    await box.evaluate((el, html) => {
      const dt = new DataTransfer();
      dt.setData('text/html', html);
      dt.setData('text/plain', 'ô bảng đậm chữ thường');
      el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    }, DIRTY);
    await expect(box.locator('b')).toHaveText('đậm');
    await expect(box.locator('table, img, script, iframe')).toHaveCount(0);
  };
  await paste('Nội dung khối 1');
  await paste('Giải thích');
  await step.getByRole('button', { name: 'Xuất bản' }).click();
  await expect(step.getByText('Đã xuất bản', { exact: true })).toBeVisible();
  const blocks = (await getLesson(page, les.id)).items[0].content.blocks;
  for (const html of [blocks[0].html, blocks[1].explanation]) {
    expect(html).toContain('<b>đậm</b>');
    expect(html).not.toMatch(/<(table|img|script|iframe)|onerror|onclick|font-family/);
  }
  await evidence(page, 'TC-026', 1);

  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  hv.page.on('dialog', (d) => {
    alerts.push(d.message());
    void d.dismiss();
  });
  const cls = await newClass(page, cur.id, [hv.who.user.id]);
  await hv.page.goto(S03(cls.id, id));
  await expect(hv.page.getByText('chữ thường').first()).toBeVisible();
  await expect(hv.page.locator('main img[src="x"], main script, main iframe[src*="evil"]')).toHaveCount(0);
  expect(alerts).toEqual([]);
  await evidence(hv.page, 'TC-026', 2);
});

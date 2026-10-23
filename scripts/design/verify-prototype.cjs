// Click-through regression test for specs/screen-flow-design.html (the role-based prototype).
// Usage: node scripts/design/verify-prototype.cjs [path-to-html]   Needs: npx playwright install chromium
// Screenshots go to the OS temp folder. Exit code 1 when any check fails.
const path = require("node:path");
const os = require("node:os");
const ROOT = path.resolve(__dirname, "..", "..");
function fs_mkd(p) { require('node:fs').mkdirSync(p, { recursive: true }); return p; }
const { createRequire } = require('node:module');
const req = createRequire(path.join(ROOT, 'package.json'));
const { chromium } = req('playwright');
const SP = fs_mkd(path.join(os.tmpdir(), 'sat-prototype-shots'));
const FILE = path.resolve(process.argv[2] || path.join(ROOT, 'specs', 'screen-flow-design.html'));
const URL = 'file:///' + FILE.replace(/\\/g, '/').replace(/^\/+/, '');
const results = []; let fails = 0;
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra && !cond ? ' — ' + extra : ''}`); if (!cond) fails++; };
const STEP = async (name, fn) => { try { await fn(); } catch (e) { const m = String(e.message).split('\n'); ok(name + ' (threw)', false, m[0] + ' ' + (m.find((l) => /waiting for|resolved to/.test(l)) || '')); } };
const norm = (s) => s.replace(/\s+/g, ' ').trim();
/* ════════ v14 012 tự học (S13–S15) — from proto-w3/012/verify-steps.cjs ════════ */
/* ---------- v14 · 012 Từ vựng thông minh: S13 Tự học · S14 Từ vựng · S15 Ôn tập ----------
   Call from scripts/design/verify-prototype.cjs before the “zero console / page errors” check:
     await STEP('v14 012 tự học', () => verify012({ browser, URL, ok, norm, watch, SP }));
   Each sub-flow uses a fresh page (mock data resets on load). */
async function verify012({ browser, URL, ok, norm, watch, SP }) {
  const newPage = async (hash) => { const p = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); watch(p); p.setDefaultTimeout(6000); await p.goto(URL + (hash || ''), { waitUntil: 'load' }); await p.waitForTimeout(300); return p; };
  const T = async (l) => norm(await l.innerText());

  /* 1. navigation + S13 hub (HV phone; V15: none for the GV) */
  let p = await newPage('#S13');
  let h = p.locator('[data-frame="hv"]'); let g = p.locator('[data-frame="gv"]');
  const open = (id, fid, params, ui) => p.evaluate(([a, b, c, d]) => { enterRole(b, a); openInProto(a, b, null, c, d); }, [id, fid, params || {}, ui || null]);
  const toast = async (fid) => norm(await p.locator(`[data-toasts="${fid}"]`).innerText());
  ok('012 deep link #S13 opens the HV role at S13', (await h.getAttribute('data-screen')) === 'S13' && (await p.locator('#view-hv').isVisible()));
  ok('012 HV tab bar: “Tự học” between “Bài thi” and “Xếp hạng”, current on S13 (AC-1.1)', (await h.locator('.hv-tabbar button').allInnerTexts()).map(norm).join('|') === 'Lớp của tôi|Bài thi|Tự học|Xếp hạng|Tài khoản' && (await T(h.locator('.hv-tabbar [aria-current="page"]'))) === 'Tự học');
  let s13 = await T(h.locator('.hv-body'));
  ok('012 S13: “Học theo nhịp của bạn — không tính vào điểm lớp.” + 4 cards in order (AC-2.1)', s13.includes('Học theo nhịp của bạn — không tính vào điểm lớp.') && (await h.locator('.th-card-name').allInnerTexts()).map(norm).join('|') === 'Từ vựng|Luyện viết|Luyện nghe & nói|Thi thử HSK');
  ok('012 S13 Từ vựng: “Ôn hôm nay: 6 từ”, “Từ mới hôm nay: 4/10”, “Từ mới từ: HSK 1”, “Ôn tập ngay” (AC-2.2)', s13.includes('Ôn hôm nay: 6 từ') && s13.includes('Từ mới hôm nay: 4/10') && s13.includes('Từ mới từ: HSK 1') && (await h.getByRole('button', { name: 'Ôn tập ngay' }).count()) === 1, s13);
  ok('012 S13: no streak / points / badges / ranking (AC-2.9)', !/chuỗi ngày|huy hiệu|xếp hạng|điểm thưởng/i.test(s13));
  const ctaLinks = await h.locator('.th-card .th-card-link').evaluateAll((els) => els.map((e) => e.dataset.go));
  ok('012 S13: cards link to S14 · S16 · S17 · S19 (AC-2.3, AC-2.4)', ctaLinks.join(',') === 'S14,S16,S17,S19', ctaLinks.join(','));
  await p.locator('#view-hv .scaler').screenshot({ path: SP + '/v14-012-S13-hv.png' });
  const box = await h.locator('.th-card-voc .th-line').first().boundingBox();
  await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  ok('012 tapping the Từ vựng card outside “Ôn tập ngay” → S14 (AC-2.3)', (await h.getAttribute('data-screen')) === 'S14');
  await open('T01', 'gv');
  ok('012 V15: GV sidebar has no “Tự học” — Tự học is for HV only', (await g.locator('.gv-nav').getByRole('button', { name: 'Tự học', exact: true }).count()) === 0 && (await g.locator('.gv-nav').getByRole('button', { name: 'Kho tự học' }).count()) === 1);
  await open('S13', 'gv');
  ok('012 V15: GV opening S13 → A05 “Không tìm thấy nội dung bạn yêu cầu.” in the GV shell', (await g.getAttribute('data-screen')) === 'A05' && (await g.locator('.gv-side').count()) === 1 && (await T(g.locator('.gv-content'))).includes('Không tìm thấy nội dung bạn yêu cầu.'));
  await p.locator('#view-gv .scaler').screenshot({ path: SP + '/v15-012-S13-gv-A05.png' });

  /* 2. S14 library, search, detail (HV) */
  await open('S14', 'hv');
  ok('012 S14: search placeholder, “Cài đặt ôn tập”, tabs “Kho từ · Bộ từ của tôi · Từ khó (3)” (AC-3.1)', (await h.getByPlaceholder('Tìm chữ Hán, pinyin hoặc nghĩa').count()) === 1 && (await h.getByRole('button', { name: 'Cài đặt ôn tập' }).count()) === 1 && (await h.getByRole('tab').allInnerTexts()).map(norm).join('|') === 'Kho từ|Bộ từ của tôi|Từ khó (3)');
  const lv = await T(h.locator('.hv-body'));
  ok('012 Kho từ: “HSK 1 · 27 từ · Đã học 18/27”, “HSK 2 · 15 từ · Đã học 0/15” (unpublished word excluded; 行 xíng comes from the GV’s Kho tự học) (AC-3.2, AC-19.3)', lv.includes('HSK 1 27 từ · Đã học 18/27') && lv.includes('HSK 2 15 từ · Đã học 0/15'), lv);
  await h.locator('.th-lvrow', { hasText: 'HSK 1' }).click();
  ok('012 HSK 1: “Tất cả chủ đề”, “Chọn nhiều”, “Học HSK 1”, rows with status + star (AC-3.3, AC-3.5)', (await h.locator('[data-bind="tp"]').inputValue()) === '' && (await h.getByRole('button', { name: 'Chọn nhiều' }).count()) === 1 && (await h.getByRole('button', { name: 'Học HSK 1' }).count()) === 1
    && (await T(h.locator('.th-row[data-word="w1"]'))).includes('Đã thuộc') && (await T(h.locator('.th-row[data-word="w3"]'))).includes('Đang học') && (await T(h.locator('.th-row[data-word="w20"]'))).includes('Chưa học') && (await h.locator('.th-row[data-word="w5"] .th-starmark').count()) === 1);
  await h.locator('[data-bind="tp"]').selectOption('Chào hỏi');
  ok('012 topic filter: “Học HSK 1 · Chào hỏi” + filtered count (AC-3.4)', (await h.getByRole('button', { name: 'Học HSK 1 · Chào hỏi' }).count()) === 1 && /\d+ từ · Đã học \d+\/\d+/.test(await T(h.locator('.th-lvcount'))) && (await h.locator('.th-row[data-word="w10"]').count()) === 0);
  const srch = async (q) => { await h.locator('[data-bind="q"]').fill(q); return h.locator('.th-row').evaluateAll((els) => els.map((e) => e.dataset.word)); };
  ok('012 search “nihao”, “ni hao”, “ni3hao3”, “xin chao” → 你好 first (AC-4.3, AC-4.4)', (await srch('nihao'))[0] === 'w2' && (await srch('ni hao'))[0] === 'w2' && (await srch('ni3hao3')).join() === 'w2' && (await srch('xin chao')).join() === 'w2');
  ok('012 search “你” → 你, 你好, 你们 (exact first) (AC-4.2, AC-4.5)', (await srch('你')).join() === 'w1,w2,w3');
  const ma = await srch('ma'); const ma1 = await srch('ma1');
  ok('012 search “ma” matches every tone (妈妈, 吗); “ma1” only mā (AC-4.3)', ma.includes('w11') && ma.includes('w27') && ma1.join() === 'w11', ma.join() + ' / ' + ma1.join());
  ok('012 search “lv” → 旅游 lǚ yóu; “kanjia” → own word with “Từ của tôi” (AC-4.1, AC-4.3)', (await srch('lv')).join() === 'w41' && (await srch('kanjia')).join() === 'c1' && (await T(h.locator('.th-row[data-word="c1"]'))).includes('Từ của tôi'));
  await srch('chảo');
  ok('012 search without results: “Không tìm thấy từ phù hợp với “chảo”. …” + “Thêm từ của tôi” (“chào” ≠ “chảo”) (AC-4.6, AC-4.4)', (await T(h.locator('.th-nores'))).startsWith('Không tìm thấy từ phù hợp với “chảo”. Thử tìm bằng chữ Hán, pinyin hoặc nghĩa tiếng Việt.') && (await h.getByRole('button', { name: 'Thêm từ của tôi' }).count()) === 1);
  await h.locator('[data-bind="q"]').fill('');
  ok('012 clearing the search returns to HSK 1 · Chào hỏi (AC-4.7)', (await h.getByRole('button', { name: 'Học HSK 1 · Chào hỏi' }).count()) === 1);
  await h.locator('.th-row[data-word="w2"] .th-row-main').click();
  const det = await T(h.locator('.th-det'));
  const hs = await h.locator('.th-det-h').evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  ok('012 detail (phone, own screen “Chi tiết từ”): Hanzi ≥ 48 px, pinyin, audio, meanings, HSK 1, topic, status, “Ví dụ”, “Cách dùng”, “Tiến độ ôn tập” (AC-5.1–AC-5.4)', (await T(h.locator('.hv-head h1'))) === 'Chi tiết từ' && hs >= 48 && det.includes('nǐ hǎo') && det.includes('xin chào') && det.includes('HSK 1') && det.includes('Chào hỏi') && det.toLowerCase().includes('ví dụ') && det.toLowerCase().includes('cách dùng') && det.toLowerCase().includes('tiến độ ôn tập') && det.includes('Lần ôn tới:') && det.includes('Khoảng ôn: 30 ngày') && det.includes('Số lần quên: 0') && (await h.getByRole('button', { name: 'Đặt lại tiến độ' }).count()) === 1, det);
  ok('012 example: the word is highlighted; sentence without audio has no audio button (AC-5.2, AC-6.3)', (await h.locator('.th-ex').first().locator('.th-hl').count()) === 1 && (await h.locator('.th-ex').nth(1).locator('.th-audio').count()) === 0 && (await h.locator('.th-ex').first().locator('.th-audio').count()) === 1);
  await h.getByRole('button', { name: 'Phát âm 你好', exact: true }).click();
  ok('012 audio button plays (pressed state) (AC-6.1)', (await h.getByRole('button', { name: 'Phát âm 你好', exact: true }).getAttribute('aria-pressed')) === 'true');
  await p.locator('#view-hv .scaler').screenshot({ path: SP + '/v14-012-S14-detail-hv.png' });
  await h.getByRole('button', { name: 'Đánh dấu từ khó' }).first().click();
  ok('012 “Đánh dấu từ khó” → “Bỏ đánh dấu từ khó” (AC-7.1)', (await h.locator('.th-hardbtn').innerText()).includes('Bỏ đánh dấu từ khó'));
  await h.getByRole('button', { name: 'Thêm vào bộ từ' }).click();
  const sh = h.locator('.sheet');
  ok('012 “Thêm vào bộ từ”: decks with ticks (Từ bài 3 ticked) + “Tạo bộ từ mới” (AC-9.1)', (await sh.getByRole('checkbox').count()) === 2 && (await sh.getByRole('checkbox', { name: /Từ bài 3/ }).getAttribute('aria-checked')) === 'true' && (await sh.getByRole('button', { name: 'Tạo bộ từ mới' }).count()) === 1);
  await sh.getByRole('checkbox', { name: /Từ đi chợ/ }).click();
  ok('012 ticking saves at once: “Đã thêm vào “Từ đi chợ”.” (AC-9.1)', (await toast('hv')).includes('Đã thêm vào “Từ đi chợ”.'));
  await sh.getByRole('button', { name: 'Xong' }).click();
  await h.getByRole('button', { name: 'Quay lại' }).click();
  ok('012 “Quay lại” → list with the topic filter kept; tab “Từ khó (4)” (AC-5.5, AC-7.1)', (await h.getByRole('button', { name: 'Học HSK 1 · Chào hỏi' }).count()) === 1 && (await h.getByRole('tab', { name: 'Từ khó (4)' }).count()) === 1 && (await h.locator('.th-row[data-word="w2"] .th-starmark').count()) === 1);
  await h.getByRole('tab', { name: 'Từ khó (4)' }).click();
  ok('012 tab Từ khó: most recent first, “Không còn trong kho” kept, “Ôn từ khó” (AC-7.3, AC-19.4)', (await h.locator('.th-row').evaluateAll((els) => els.map((e) => e.dataset.word))).join() === 'w2,w5,w9,w40' && (await T(h.locator('.th-row[data-word="w40"]'))).includes('Không còn trong kho') && (await h.getByRole('button', { name: 'Ôn từ khó' }).count()) === 1);

  /* 3. personal decks */
  await h.getByRole('tab', { name: 'Bộ từ của tôi' }).click();
  ok('012 Bộ từ của tôi: newest first, “{m} từ · Đến hạn: {d}”, “Học”, “Tạo bộ từ” (AC-8.1)', (await h.locator('.th-dkrow').evaluateAll((els) => els.map((e) => e.dataset.deck))).join() === 'd2,d1' && (await T(h.locator('.th-dkrow[data-deck="d2"]'))).includes('7 từ · Đến hạn: 0') && (await h.getByRole('button', { name: 'Tạo bộ từ' }).count()) === 1);
  await h.getByRole('button', { name: 'Tạo bộ từ' }).click();
  await h.locator('.sheet').getByRole('button', { name: 'Tạo', exact: true }).click();
  ok('012 empty name → “Tên bộ từ cần từ 1 đến 60 ký tự.” (AC-8.3)', (await T(h.locator('.sheet .err-msg'))) === 'Tên bộ từ cần từ 1 đến 60 ký tự.');
  await h.locator('.sheet input').fill('  từ ĐI chợ '); await h.locator('.sheet').getByRole('button', { name: 'Tạo', exact: true }).click();
  ok('012 duplicate name (case-insensitive) → “Bạn đã có bộ từ tên này.” (AC-8.4)', (await T(h.locator('.sheet .err-msg'))) === 'Bạn đã có bộ từ tên này.');
  await h.locator('.sheet input').fill('Từ HSK2 <b>'); await h.locator('.sheet').getByRole('button', { name: 'Tạo', exact: true }).click();
  ok('012 “Tạo” → “Đã tạo bộ từ “Từ HSK2 <b>”.”, shown first, as plain text (AC-8.2, AC-10.8)', (await toast('hv')).includes('Đã tạo bộ từ “Từ HSK2 <b>”.') && (await T(h.locator('.th-dkrow').first())).startsWith('Từ HSK2 <b>'));
  await h.locator('.th-dkrow').first().locator('.th-row-main').click();
  ok('012 empty deck: “Bộ từ chưa có từ nào. Tìm hoặc duyệt kho từ để thêm.” + “Học” disabled; Đổi tên · Xóa bộ · Thêm từ của tôi (AC-9.3, AC-9.6)', (await T(h.locator('.hv-body'))).includes('Bộ từ chưa có từ nào. Tìm hoặc duyệt kho từ để thêm.') && (await h.getByRole('button', { name: 'Học', exact: true }).isDisabled()) && (await h.getByRole('button', { name: 'Đổi tên' }).count()) === 1 && (await h.getByRole('button', { name: 'Thêm từ của tôi' }).count()) === 1);
  await h.getByRole('button', { name: 'Đổi tên' }).click(); await h.locator('.sheet input').fill('Từ ôn thi HSK 2'); await h.locator('.sheet').getByRole('button', { name: 'Lưu' }).click();
  ok('012 “Đổi tên” → “Đã đổi tên bộ từ.” (AC-8.6)', (await toast('hv')).includes('Đã đổi tên bộ từ.') && (await T(h.locator('.th-lvtitle h3'))) === 'Từ ôn thi HSK 2');
  await h.getByRole('button', { name: 'Xóa bộ' }).click();
  ok('012 “Xóa bộ” asks “Xóa bộ “…”? Các từ vẫn giữ tiến độ ôn tập và dấu từ khó.” (AC-8.7)', (await T(h.locator('.confirm .q'))) === 'Xóa bộ “Từ ôn thi HSK 2”? Các từ vẫn giữ tiến độ ôn tập và dấu từ khó.');
  await h.locator('.confirm').getByRole('button', { name: 'Xóa bộ' }).click();
  ok('012 deleted → “Đã xóa bộ từ.”, back to the list (AC-8.7)', (await toast('hv')).includes('Đã xóa bộ từ.') && (await h.locator('.th-dkrow').count()) === 2);
  await h.getByRole('tab', { name: 'Kho từ' }).click(); await h.locator('.th-lvhead .link').click(); await h.locator('.th-lvrow', { hasText: 'HSK 2' }).click();
  await h.getByRole('button', { name: 'Chọn nhiều' }).click();
  for (const w of ['w32', '鸡蛋', '西瓜']) await h.getByRole('checkbox', { name: new RegExp(w === 'w32' ? '便宜' : w) }).click();
  await h.locator('.hv-foot').getByRole('button', { name: 'Thêm vào bộ từ' }).click(); await h.locator('.sheet .lrow', { hasText: 'Từ đi chợ' }).click();
  ok('012 “Chọn nhiều” → “Đã thêm 2 từ vào “Từ đi chợ”. (1 từ đã có sẵn)” (AC-9.2)', (await toast('hv')).includes('Đã thêm 2 từ vào “Từ đi chợ”. (1 từ đã có sẵn)'), await toast('hv'));
  await h.getByRole('tab', { name: 'Bộ từ của tôi' }).click(); await h.locator('.th-dkrow[data-deck="d2"] .th-row-main').click();
  const order0 = await h.locator('.th-row').evaluateAll((els) => els.map((e) => e.dataset.word));
  await h.locator('.th-row[data-word="w33"]').getByRole('button', { name: /Bỏ khỏi bộ/ }).click();
  ok('012 “Bỏ khỏi bộ” → “Đã bỏ khỏi bộ.” + “Hoàn tác” (AC-9.4)', (await T(h.locator('.th-undo'))).includes('Đã bỏ khỏi bộ.') && (await h.locator('.th-row[data-word="w33"]').count()) === 0);
  await h.locator('.th-undo').getByRole('button', { name: 'Hoàn tác' }).click();
  ok('012 “Hoàn tác” restores the word at the same position', (await h.locator('.th-row').evaluateAll((els) => els.map((e) => e.dataset.word))).join() === order0.join());
  await h.getByRole('button', { name: 'Thêm từ của tôi' }).click();
  const fsd = h.locator('.fsd');
  ok('012 “Từ của tôi” form: 8 fields + “Lưu” / “Hủy” (AC-10.1)', (await fsd.locator('.lbl').allInnerTexts()).map((t) => norm(t).replace(/\s*\*$/, '')).join('|') === 'Chữ Hán|Pinyin|Nghĩa tiếng Việt|Từ loại|Câu ví dụ|Pinyin câu ví dụ|Nghĩa câu ví dụ|Ghi chú' && (await fsd.getByRole('button', { name: 'Lưu' }).count()) === 1);
  await fsd.getByRole('button', { name: 'Lưu' }).click();
  ok('012 invalid form → messages under the fields (AC-10.2)', (await T(fsd)).includes('Chữ Hán cần 1–20 chữ Hán, không có chữ cái, số hay ký hiệu.') && (await T(fsd)).includes('Nghĩa tiếng Việt cần từ 1 đến 200 ký tự.'));
  await fsd.locator('[data-bind="fsd.v.h"]').fill('鸡蛋'); await fsd.locator('[data-bind="fsd.v.p"]').fill('jī dàn'); await fsd.locator('[data-bind="fsd.v.m"]').fill('trứng'); await fsd.getByRole('button', { name: 'Lưu' }).click();
  ok('012 same Hanzi as the library → “Kho đã có từ này: 鸡蛋 – jī dàn – trứng gà.” + 2 choices (AC-10.3)', (await T(fsd)).includes('Kho đã có từ này: 鸡蛋 – jī dàn – trứng gà.') && (await fsd.getByRole('button', { name: 'Vẫn tạo từ riêng' }).count()) === 1);
  await fsd.getByRole('button', { name: 'Vẫn tạo từ riêng' }).click();
  ok('012 saved → “Đã thêm từ “鸡蛋”.” and added to the open deck with “Từ của tôi” (AC-10.4)', (await toast('hv')).includes('Đã thêm từ “鸡蛋”.') && (await h.locator('.th-row', { hasText: 'Từ của tôi' }).count()) === 2);
  await p.locator('#view-hv .scaler').screenshot({ path: SP + '/v14-012-S14-deck-hv.png' });
  await p.close();

  /* 4. S15 review session (HV) */
  p = await newPage('#S13'); h = p.locator('[data-frame="hv"]'); g = p.locator('[data-frame="gv"]');
  const open2 = (id, fid, params, ui) => p.evaluate(([a, b, c, d]) => { enterRole(b, a); openInProto(a, b, null, c, d); }, [id, fid, params || {}, ui || null]);
  const srs = await p.evaluate(() => { const run = (gs, p0) => { let pp = p0 || null; const iv = []; gs.forEach((x) => { pp = thSrs(pp, x); iv.push(pp.I); }); return { iv: iv.join(','), E: pp.E, L: pp.L }; };
    return { a: run([3, 3, 3, 2, 1, 3, 3, 3]), b: run([4, 4, 4]), c: run([3], { n: 5, I: 300, E: 2.5, L: 0 }), f: run([1, 1], { n: 3, I: 10, E: 1.4, L: 0 }) }; });
  ok('012 REQ-13 example A: Nhớ ×3, Khó, Quên, Nhớ ×3 → 1,3,8,10,0,1,3,6 · E 2,15 · L 1 (AC-13.5)', srs.a.iv === '1,3,8,10,0,1,3,6' && srs.a.E === 2.15 && srs.a.L === 1, JSON.stringify(srs.a));
  ok('012 REQ-13 example B: Dễ ×3 → 3,5,18 · E 2,95; n 5 · I 300 · Nhớ → 365 (AC-13.6, AC-13.2)', srs.b.iv === '3,5,18' && srs.b.E === 2.95 && srs.c.iv === '365', JSON.stringify([srs.b, srs.c]));
  ok('012 Quên twice: E floors at 1,30, only the first lapse counts (AC-13.2, edge cases)', srs.f.E === 1.3 && srs.f.L === 1, JSON.stringify(srs.f));
  await h.getByRole('button', { name: 'Ôn tập ngay' }).click();
  ok('012 “Ôn tập ngay” → S15 “Ôn hôm nay”, “Còn 12” (6 due + 6 new), “Cài đặt ôn tập”, “Kết thúc” (AC-2.5, AC-11.1, AC-12.1)', (await h.getAttribute('data-screen')) === 'S15' && (await T(h.locator('.hv-head h1'))) === 'Ôn hôm nay' && (await T(h.locator('.th-left'))) === 'Còn 12' && (await h.getByRole('button', { name: 'Kết thúc' }).count()) === 1 && (await h.getByRole('button', { name: 'Cài đặt ôn tập' }).count()) === 1);
  const q0 = await p.evaluate(() => D.tuhoc012.users.hv.ses.q.slice());
  ok('012 queue: due words oldest first (w6 3 days overdue, then w5), then new words of HSK 1 (AC-11.1, AC-14.3)', q0[0] === 'w6' && q0[1] === 'w5' && q0.slice(6).join() === 'w19,w20,w21,w22,w23,w24', q0.join());
  ok('012 front = Hanzi only, no grade buttons before the flip (AC-12.2, AC-12.4)', (await h.locator('.th-grades').count()) === 0 && (await h.getByRole('button', { name: 'Hiện đáp án' }).count()) === 1 && (await T(h.locator('.face.front'))).startsWith('不客气'));
  await p.locator('#view-hv .scaler').screenshot({ path: SP + '/v14-012-S15-front-hv.png' });
  await h.getByRole('button', { name: 'Hiện đáp án' }).click();
  const back = await h.locator('.face.back').innerText();
  ok('012 back: Hanzi, pinyin, part of speech, meanings, first example; 4 grades with intervals “Hôm nay · 4 · 8 · 10 ngày” (n 2 · I 3 · E 2,5) (AC-12.3, AC-12.6)', norm(back).includes('bú kè qi') && norm(back).includes('đừng khách sáo') && norm(back).includes('A：谢谢！B：不客气！')
    && (await h.locator('.th-g').allInnerTexts()).map(norm).join('|') === 'Quên Hôm nay|Khó 4 ngày|Nhớ 8 ngày|Dễ 10 ngày', (await h.locator('.th-g').allInnerTexts()).map(norm).join('|'));
  ok('012 grade buttons are named with level + interval (“Nhớ, ôn lại sau 8 ngày”) (NFR-6)', (await h.getByRole('button', { name: 'Nhớ, ôn lại sau 8 ngày' }).count()) === 1);
  const fb = await h.locator('.th-grades').boundingBox(); const pb = await p.locator('#view-hv .phone').boundingBox();
  ok('012 the 4 grade buttons sit in the bottom 40 % of the phone (NFR-7)', fb.y >= pb.y + pb.height * 0.6, JSON.stringify([fb.y, pb.y, pb.height]));
  await p.locator('#view-hv .scaler').screenshot({ path: SP + '/v14-012-S15-back-hv.png' });
  await h.locator('.th-flash').click();
  ok('012 after the first flip the card flips back and forth, grades stay (AC-12.5)', (await h.locator('.th-flash').getAttribute('aria-pressed')) === 'false' && (await h.locator('.th-grades').count()) === 1);
  await h.getByRole('button', { name: /^Quên/ }).click();
  const afterQ = await p.evaluate(() => { const u = D.tuhoc012.users.hv; return { q: u.ses.q.slice(), p: u.prog.w6 }; });
  ok('012 “Quên”: card goes back after 3 cards, “Còn 12”, I 0, due today, E −0,20, L +1, “Hoàn tác” shown (AC-13.1, AC-13.3, AC-12.7)', afterQ.q[3] === 'w6' && afterQ.q.length === 12 && afterQ.p.I === 0 && afterQ.p.due === '2026-10-20' && afterQ.p.E === 2.3 && afterQ.p.L === 1 && (await h.getByRole('button', { name: 'Hoàn tác' }).count()) === 1, JSON.stringify(afterQ));
  await h.getByRole('button', { name: 'Hoàn tác' }).click();
  const afterU = await p.evaluate(() => { const u = D.tuhoc012.users.hv; return { q: u.ses.q.slice(), p: u.prog.w6, f: u.day.forgot.length }; });
  ok('012 “Hoàn tác” restores progress, queue and day counters, shows the card front, hides “Hoàn tác” (AC-17.1, AC-17.2)', afterU.q.join() === q0.join() && afterU.p.I === 3 && afterU.p.due === '2026-10-17' && afterU.f === 0 && (await h.getByRole('button', { name: 'Hoàn tác' }).count()) === 0 && (await h.getByRole('button', { name: 'Hiện đáp án' }).count()) === 1);
  await h.getByRole('button', { name: 'Hiện đáp án' }).click(); await h.getByRole('button', { name: /^Nhớ/ }).click();
  const w6 = await p.evaluate(() => D.tuhoc012.users.hv.prog.w6);
  ok('012 “Nhớ” at n 2 · I 3 → I 8, due 28/10/2026; “Còn 11” (AC-13.1, AC-13.4: 3 days late = same result)', w6.I === 8 && w6.due === '2026-10-28' && w6.n === 3 && (await T(h.locator('.th-left'))) === 'Còn 11');
  await h.getByRole('button', { name: 'Kết thúc' }).click();
  const sum = await T(h.locator('.hv-body'));
  ok('012 “Kết thúc” → “Kết quả phiên ôn”: 1 từ đã ôn, 0 từ mới, Nhớ 1, “Tỷ lệ nhớ: 100%”, “0 phút … giây” (AC-16.1, AC-16.2)', sum.includes('Kết quả phiên ôn') && sum.includes('Tỷ lệ nhớ: 100%') && sum.includes('1 từ đã ôn') && sum.includes('0 từ mới') && /0 phút \d+ giây/.test(sum), sum);
  ok('012 summary actions: “Ôn tiếp (5)”, “Về Từ vựng”, “Về Tự học” (AC-16.4)', (await h.getByRole('button', { name: 'Ôn tiếp (5)' }).count()) === 1 && (await h.getByRole('button', { name: 'Về Từ vựng' }).count()) === 1 && (await h.getByRole('button', { name: 'Về Tự học' }).count()) === 1);
  await h.getByRole('button', { name: 'Về Tự học' }).click();
  ok('012 S13 after reviewing one word: “Ôn hôm nay: 5 từ” (AC-14.4)', (await T(h.locator('.hv-body'))).includes('Ôn hôm nay: 5 từ'));
  /* source sessions: nothing to review → AC-11.7 → Luyện thêm */
  await open2('S14', 'hv', {}, { tab: 'decks' }); await h.locator('.th-dkrow[data-deck="d1"]').getByRole('button', { name: 'Học' }).click();
  ok('012 deck with nothing due / new → “Không có từ nào cần ôn trong Từ bài 3 hôm nay.” + “Luyện thêm” + “Quay lại” (AC-11.7)', (await T(h.locator('.sheet'))).includes('Không có từ nào cần ôn trong Từ bài 3 hôm nay.') && (await h.locator('.sheet').getByRole('button', { name: 'Luyện thêm' }).count()) === 1 && (await h.locator('.sheet').getByRole('button', { name: 'Quay lại' }).count()) === 1);
  await h.locator('.sheet').getByRole('button', { name: 'Luyện thêm' }).click();
  const before = await p.evaluate(() => JSON.stringify(D.tuhoc012.users.hv.prog));
  ok('012 “Luyện thêm”: label “Luyện thêm — không thay đổi lịch ôn”, 6 cards (AC-11.8)', (await h.getAttribute('data-screen')) === 'S15' && (await T(h.locator('.th-sbar'))).includes('Luyện thêm — không thay đổi lịch ôn') && (await T(h.locator('.th-left'))) === 'Còn 6');
  await h.getByRole('button', { name: 'Hiện đáp án' }).click();
  ok('012 Luyện thêm: no intervals under the grades', (await h.locator('.th-g small').count()) === 0);
  await h.getByRole('button', { name: 'Dễ' }).click();
  ok('012 Luyện thêm does not change any progress (AC-11.8)', (await p.evaluate(() => JSON.stringify(D.tuhoc012.users.hv.prog))) === before);
  /* settings + daily limit → AC-11.5 */
  await h.getByRole('button', { name: 'Cài đặt ôn tập' }).click();
  const st = h.locator('.sheet');
  ok('012 “Cài đặt ôn tập”: Từ mới mỗi ngày 10 · Lượt ôn tối đa mỗi ngày 200 · Mặt trước thẻ · Tự phát âm khi lật thẻ (AC-15.1)', (await st.locator('[data-bind="sheet.v.np"]').inputValue()) === '10' && (await st.locator('[data-bind="sheet.v.rm"]').inputValue()) === '200' && (await st.getByRole('radio', { name: 'Chữ Hán' }).getAttribute('aria-checked')) === 'true' && (await st.getByRole('switch', { name: 'Tự phát âm khi lật thẻ' }).getAttribute('aria-checked')) === 'false');
  await st.locator('[data-bind="sheet.v.np"]').fill('99'); await st.locator('[data-bind="sheet.v.rm"]').fill('10'); await st.getByRole('button', { name: 'Lưu' }).click();
  ok('012 invalid limits → “Nhập số nguyên từ 0 đến 50.” / “Nhập số nguyên từ 20 đến 500.” (AC-15.2)', (await T(st)).includes('Nhập số nguyên từ 0 đến 50.') && (await T(st)).includes('Nhập số nguyên từ 20 đến 500.'));
  await st.locator('[data-bind="sheet.v.np"]').fill('4'); await st.locator('[data-bind="sheet.v.rm"]').fill('200'); await st.getByRole('radio', { name: 'Nghĩa tiếng Việt' }).click(); await st.getByRole('button', { name: 'Lưu' }).click();
  ok('012 saved → “Đã lưu cài đặt.” (AC-15.3)', (await norm(await p.locator('[data-toasts="hv"]').innerText())).includes('Đã lưu cài đặt.'));
  ok('012 the current card keeps its front; the next card uses “Nghĩa tiếng Việt” (AC-15.3)', (await h.locator('.face.front .f-han').count()) === 1);
  await h.getByRole('button', { name: 'Hiện đáp án' }).click(); await h.getByRole('button', { name: 'Nhớ' }).click();
  ok('012 next card front = part of speech + meanings only', (await h.locator('.face.front .f-han').count()) === 0 && (await h.locator('.face.front .f-mean').count()) === 1);
  await open2('S14', 'hv', {}, { tab: 'decks' }); await h.locator('.th-dkrow[data-deck="d2"]').getByRole('button', { name: 'Học' }).click();
  ok('012 daily new-word limit reached → “Bạn đã học đủ 4 từ mới hôm nay.” + “Học thêm 5 từ mới” + “Để mai” (AC-11.5)', (await T(h.locator('.sheet'))).includes('Bạn đã học đủ 4 từ mới hôm nay.') && (await h.locator('.sheet').getByRole('button', { name: 'Để mai' }).count()) === 1);
  await h.locator('.sheet').getByRole('button', { name: 'Học thêm 5 từ mới' }).click();
  ok('012 “Học thêm 5 từ mới” → S15 “Từ đi chợ” with 5 new cards marked “Mới” (AC-11.5, AC-11.2)', (await h.getAttribute('data-screen')) === 'S15' && (await T(h.locator('.hv-head h1'))) === 'Từ đi chợ' && (await T(h.locator('.th-left'))) === 'Còn 5' && (await h.locator('.th-newchip').count()) === 1);
  await open2('S13', 'hv');
  ok('012 S13 shows the new source: “Từ mới từ: Từ đi chợ” (AC-11.3)', (await T(h.locator('.hv-body'))).includes('Từ mới từ: Từ đi chợ'));

  /* 5. V15: no GV variant — the GV frame gets A05 on S14 / S15, the GV has no self-study data */
  await open2('S14', 'gv');
  ok('012 V15: GV opening S14 → A05, no GV self-study store', (await g.getAttribute('data-screen')) === 'A05' && (await p.evaluate(() => !D.tuhoc012.users.gv)));
  await open2('S15', 'gv');
  ok('012 V15: GV opening S15 → A05', (await g.getAttribute('data-screen')) === 'A05');
  await p.close();

  /* 6. Kịch bản: ôn xong · chưa có nguồn · lỗi số liệu · ngày mới · mất mạng */
  p = await newPage('#S13'); h = p.locator('[data-frame="hv"]');
  const scn = async (label) => { await p.getByRole('button', { name: 'Hướng dẫn' }).click(); await p.locator('#guide [data-scn]', { hasText: label }).click(); await p.waitForTimeout(100); };
  await scn('Tự học: đã ôn xong hôm nay');
  let s = await T(h.locator('.hv-body'));
  ok('012 all done: “Bạn đã ôn xong hôm nay.” + “Ngày mai: k từ đến hạn”, no “Ôn tập ngay” (AC-2.6)', s.includes('Bạn đã ôn xong hôm nay.') && /Ngày mai: \d+ từ đến hạn/.test(s) && (await h.getByRole('button', { name: 'Ôn tập ngay' }).count()) === 0, s);
  await scn('Tự học: sang ngày hôm sau');
  s = await T(h.locator('.hv-body'));
  ok('012 next day (00:00 giờ Việt Nam): counters reset — “Từ mới hôm nay: 0/10”, words due again (AC-14.7)', s.includes('Từ mới hôm nay: 0/10') && !s.includes('Ôn hôm nay: 0 từ') && (await h.getByRole('button', { name: 'Ôn tập ngay' }).count()) === 1, s);
  await scn('Tự học: lỗi tải số liệu');
  s = await T(h.locator('.hv-body'));
  ok('012 load error: “Không tải được số liệu ôn tập.” + “Thử lại”, no zero shown, other cards still open (AC-2.8)', s.includes('Không tải được số liệu ôn tập.') && !s.includes('Ôn hôm nay:') && (await h.locator('.th-card-link').count()) === 4);
  await h.getByRole('button', { name: 'Thử lại' }).click();
  ok('012 “Thử lại” shows the numbers again', (await T(h.locator('.hv-body'))).includes('Ôn hôm nay:'));
  await scn('Tự học: chưa chọn nguồn từ mới');
  s = await T(h.locator('.hv-body'));
  ok('012 no new-word source: “Chọn cấp HSK, chủ đề hoặc bộ từ để bắt đầu học từ mới.” + “Chọn từ để học” (AC-2.7)', s.includes('Chọn cấp HSK, chủ đề hoặc bộ từ để bắt đầu học từ mới.') && (await h.getByRole('button', { name: 'Chọn từ để học' }).count()) === 1, s);
  await p.close();
  p = await newPage('#S13'); h = p.locator('[data-frame="hv"]');
  await scn('Tự học: bật / tắt mất mạng khi ôn');
  ok('012 offline: S15 keeps going with “Đang ngoại tuyến — kết quả sẽ được lưu khi có mạng.” (AC-18.2)', (await h.getAttribute('data-screen')) === 'S15' && (await T(h.locator('.th-off'))).includes('Đang ngoại tuyến — kết quả sẽ được lưu khi có mạng.'));
  await h.getByRole('button', { name: 'Hiện đáp án' }).click(); await h.getByRole('button', { name: /^Dễ/ }).click();
  ok('012 offline rating shows the next card at once and counts 1 unsaved result (AC-18.1)', (await T(h.locator('.th-left'))) === 'Còn 11' && (await T(h.locator('.th-off b'))) === '1');
  await p.close();
}

/* ════════ v14 013 luyện viết (S16) — from proto-w3/013/verify-steps.cjs ════════ */
// verify013 — click-through checks for S16 “Luyện viết chữ Hán” (module 013). Style of scripts/design/verify-prototype.cjs:
// paste the function into that file and call `await STEP('013 hanzi writing', () => verify013({ browser, URL, watch, ok, norm }));`
async function verify013({ browser, URL, watch, ok, norm, SP }) {
  const p = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); watch(p); p.setDefaultTimeout(6000);
  await p.goto(URL + '#S16', { waitUntil: 'load' }); await p.waitForTimeout(300);
  const h = p.locator('[data-frame="hv"]'); const g = p.locator('[data-frame="gv"]');
  const T = async (l) => norm(await l.innerText());
  const scr = (fid) => p.locator(`[data-frame="${fid}"]`).getAttribute('data-screen');
  const open = (fid, params) => p.evaluate(([b, c]) => { delete HW.anim[b]; enterRole(b, 'S16', c); }, [fid, params || {}]);
  const fb = async (fr) => T(fr.locator('.hw-fb'));
  /* draw a stroke given in 0–100 box coordinates on the frame's writing pad (mouse = finger/pen) */
  const draw = async (fr, pts) => {
    const b = await fr.locator('[data-hw-pad]').boundingBox(); const X = (q) => b.x + q[0] / 100 * b.width; const Y = (q) => b.y + q[1] / 100 * b.height;
    await p.mouse.move(X(pts[0]), Y(pts[0])); await p.mouse.down();
    for (let i = 1; pts.length > i; i++) await p.mouse.move(X(pts[i]), Y(pts[i]), { steps: 5 });
    await p.mouse.up(); await p.waitForTimeout(60);
  };
  const strokes = (c) => p.evaluate((x) => D.tuhoc013.CH[x].S.map((s) => s.p), c);
  const writeAll = async (fr, c, from = 0) => { const S = await strokes(c); for (let i = from; S.length > i; i++) await draw(fr, S[i]); };

  /* home (AC-1.1, 2.1, 2.2, 2.4) */
  ok('013 #S16 opens the HV role at S16', (await scr('hv')) === 'S16' && (await p.locator('#view-hv').isVisible()));
  ok('013 S16 home: “Tìm chữ Hán, pinyin hoặc nghĩa” + 4 tabs, “Theo cấp HSK” selected', (await h.getByPlaceholder('Tìm chữ Hán, pinyin hoặc nghĩa').count()) === 1
    && (await h.locator('.hw-tab').count()) === 4 && (await T(h.locator('.hw-tab[aria-selected="true"]'))) === 'Theo cấp HSK' && /Chữ cần luyện \(2\)/.test(await T(h.locator('.hw-tabs'))));
  ok('013 7 level buttons “HSK 1”…“HSK 6”, “HSK 7–9”, HSK 1 pre-selected, “9 chữ” with pinyin + status labels', (await h.locator('.hw-lv').count()) === 7 && (await T(h.locator('.hw-lv').last())) === 'HSK 7–9' && (await T(h.locator('.hw-lv[aria-pressed="true"]'))) === 'HSK 1'
    && (await T(h.locator('.hw-tabbody'))).includes('9 chữ') && (await h.locator('.hw-tile').count()) === 9 && (await T(h.locator('.hw-tile', { hasText: '口' }))).includes('Tốt') && (await T(h.locator('.hw-tile', { hasText: '大' }))).includes('Cần luyện'));
  await h.locator('.hw-lv', { hasText: 'HSK 2' }).click();
  ok('013 empty level: “Cấp này chưa có chữ nào để luyện viết.”', (await T(h.locator('.hw-tabbody'))).includes('Cấp này chưa có chữ nào để luyện viết.'));
  await h.locator('.hw-lv', { hasText: 'HSK 1' }).click();

  /* search (AC-3.1–3.5, 16.1) */
  const q = h.getByPlaceholder('Tìm chữ Hán, pinyin hoặc nghĩa');
  await q.fill('hao3'); await p.waitForTimeout(80);
  ok('013 search “hao3” finds 好 (tone number)', (await h.locator('.hw-row', { hasText: '好' }).count()) === 1);
  await q.fill('nuoc'); await p.waitForTimeout(80);
  ok('013 search “nuoc” (no diacritics) finds 水 labelled “Chưa có dữ liệu nét”', (await T(h.locator('.hw-row', { hasText: '水' }).first())).includes('Chưa có dữ liệu nét'));
  await q.fill('你好'); await p.waitForTimeout(80);
  ok('013 search “你好”: 你 then 好 first + “Luyện cả 2 chữ”', (await h.getByRole('button', { name: 'Luyện cả 2 chữ' }).count()) === 1 && (await T(h.locator('.hw-row').nth(0))).startsWith('你') && (await T(h.locator('.hw-row').nth(1))).startsWith('好'));
  await q.fill('zzzz'); await p.waitForTimeout(80);
  ok('013 search no match message', (await T(h.locator('.hw-tabbody'))).includes('Không tìm thấy chữ phù hợp. Hãy thử chữ Hán giản thể, pinyin hoặc nghĩa tiếng Việt.'));
  await q.fill('a'); await p.waitForTimeout(80);
  ok('013 search: 1 Latin character does not search yet', (await h.locator('.hw-lv').count()) === 7);
  await q.fill(''); await p.waitForTimeout(80);

  /* practice: info + stroke-order animation (AC-2.3, 5.1, 6.1, 7.x, 15.3) */
  await h.locator('.hw-tile', { hasText: '你' }).click();
  const info = await T(h.locator('.hw-info'));
  ok('013 你: “Chữ 1/9”, info nǐ · bạn · HSK 1 · 7 nét · “Bộ thủ: 亻 (Nhân – người)”', (await T(h.locator('.hw-kn'))) === 'Chữ 1/9' && info.includes('nǐ') && info.includes('bạn') && info.includes('HSK 1') && info.includes('7 nét') && info.includes('Bộ thủ: 亻 (Nhân – người)'));
  ok('013 mode selector with “Xem thứ tự nét” pre-selected (first time), “Cài đặt”, “Quay lại”, ‹ ›', (await T(h.locator('.hw-modes [aria-pressed="true"]'))) === 'Xem thứ tự nét' && (await h.getByRole('button', { name: 'Cài đặt' }).count()) === 1
    && (await h.getByRole('button', { name: 'Quay lại' }).count()) === 1 && (await h.getByRole('button', { name: 'Chữ trước' }).isDisabled()));
  await p.waitForTimeout(300);
  const mid = await p.evaluate(() => { const a = HW.anim.hv; return a ? [a.i, a.play] : null; });
  ok('013 animation autoplays stroke by stroke', !!mid && mid[1] === true);
  await h.locator('.hw-wctl .seg button', { hasText: '2×' }).click();
  await p.waitForFunction(() => HW.anim.hv && HW.anim.hv.done, null, { timeout: 8000 });
  ok('013 animation done → whole character + numbers + “Tô theo mẫu”', (await h.locator('[data-hw-next]').count()) === 1 && (await h.locator('.hw-num').count()) === 7);
  await h.getByRole('button', { name: 'Từng nét' }).click();
  await h.getByRole('button', { name: 'Nét sau' }).click(); await h.getByRole('button', { name: 'Nét sau' }).click();
  ok('013 “Từng nét” → “Nét 3/7: Phẩy”, “Nét trước” / “Nét sau”', (await T(h.locator('.hw-stepline'))).startsWith('Nét 3/7: Phẩy') && (await h.locator('.hw-ink-s.is-cur').count()) === 1);
  await h.getByRole('button', { name: /Danh sách nét/ }).click();
  ok('013 “Danh sách nét”: “Nét 1: Phẩy, từ trên phải xuống dưới trái”', (await T(h.locator('.hw-slist li').first())) === 'Nét 1: Phẩy, từ trên phải xuống dưới trái' && (await h.locator('.hw-slist li').count()) === 7);
  await h.locator('.hw-cau-btn', { hasText: 'Cấu tạo chữ' }).click();
  ok('013 “Cấu tạo chữ”: Trái – phải, components 亻 尔, “Mẹo nhớ”', /Trái – phải/.test(await T(h.locator('.hw-cau'))) && (await h.locator('.hw-comp').count()) === 2 && (await T(h.locator('.hw-cau'))).includes('Mẹo nhớ'));

  /* trace mode: order + direction mistakes, result (AC-9.x, 10.1, 11.x) */
  await h.locator('.hw-modes button', { hasText: 'Tô theo mẫu' }).click();
  const S = await strokes('你');
  ok('013 Tô theo mẫu: light outline of the whole character, labelled writing frame', (await h.locator('.hw-ol-e').count()) === 7 && (await h.locator('[aria-label^="Khung viết: vẽ bằng ngón tay, chuột hoặc bút."]').count()) === 1);
  ok('013 “Hoàn tác” disabled before any accepted stroke', await h.getByRole('button', { name: 'Hoàn tác' }).isDisabled());
  await draw(h, S[1]);
  ok('013 stroke 2 before stroke 1 → “Sai thứ tự nét — nét này chưa đến lượt.” + red ink', (await fb(h)).includes('Sai thứ tự nét — nét này chưa đến lượt.') && (await h.locator('.hw-flash').count()) === 1);
  await p.waitForTimeout(900);
  ok('013 red ink disappears after 0,8 s', (await h.locator('.hw-flash').count()) === 0);
  await draw(h, S[0].slice().reverse());
  ok('013 reversed stroke → “Sai hướng nét — viết lại nét này theo đúng hướng.”', (await fb(h)).includes('Sai hướng nét — viết lại nét này theo đúng hướng.'));
  await draw(h, [[60, 60], [60.8, 60.5], [61, 60.9]]);
  ok('013 tiny tap (under 2%) is ignored', (await fb(h)).includes('Sai hướng nét'));
  await draw(h, S[0]);
  ok('013 correct stroke → “Đúng nét 1”, model stroke in ink, “Hoàn tác” enabled', (await fb(h)).includes('Đúng nét 1') && (await h.locator('.hw-ink-s').count()) === 1 && !(await h.getByRole('button', { name: 'Hoàn tác' }).isDisabled()));
  await h.getByRole('button', { name: 'Hoàn tác' }).click();
  ok('013 “Hoàn tác” removes the stroke (back to Nét 1/7)', (await h.locator('.hw-ink-s').count()) === 0 && (await T(h.locator('.hw-fb-n'))) === 'Nét 1/7');
  await writeAll(h, '你');
  const res = await T(h.locator('.hw-res'));
  ok('013 result: “Tốt” · “Số lỗi: 2” · “Gợi ý: 0” + Viết lại / Viết từ trí nhớ / Chữ tiếp theo', res.includes('Tốt') && res.includes('Số lỗi: 2') && res.includes('Gợi ý: 0') && res.includes('Viết lại') && res.includes('Viết từ trí nhớ') && res.includes('Chữ tiếp theo'));
  ok('013 result marks the stroke with mistakes in red with its number', (await h.locator('.hw-ink-s.is-err').count()) === 1 && (await h.locator('.hw-num.is-err').textContent()) === '1');

  /* memory mode: prompt without the character, auto hint after 3 mistakes, “Cần luyện thêm” (AC-10.2, 10.3, 11.2, 13.3) */
  await h.getByRole('button', { name: 'Chữ tiếp theo' }).click();
  ok('013 “Chữ tiếp theo” → “Chữ 2/9” in the same mode', (await T(h.locator('.hw-kn'))) === 'Chữ 2/9' && (await T(h.locator('.hw-modes [aria-pressed="true"]'))) === 'Tô theo mẫu');
  await h.locator('.hw-modes button', { hasText: 'Viết từ trí nhớ' }).click();
  const body = await T(h.locator('.hw-phone'));
  ok('013 Viết từ trí nhớ: prompt “hǎo · hào”, “tốt, hay”, “6 nét” and no 好 / outline anywhere', body.includes('hǎo · hào') && body.includes('tốt, hay') && body.includes('6 nét') && !body.includes('好') && (await h.locator('.hw-ol-e').count()) === 0);
  for (let i = 0; 3 > i; i++) await draw(h, [[80, 80], [90, 92]]);
  ok('013 3rd consecutive mistake → hint outline + direction of that stroke', (await h.locator('.hw-hint').count()) === 1 && (await h.locator('.hw-dir').count()) === 1 && (await fb(h)).includes('Nét chưa đúng vị trí hoặc hình dạng.'));
  await writeAll(h, '好');
  const res2 = await T(h.locator('.hw-res'));
  ok('013 memory result “Cần luyện thêm · Số lỗi: 3 · Gợi ý: 1”, info card now shows 好', res2.includes('Cần luyện thêm') && res2.includes('Số lỗi: 3') && res2.includes('Gợi ý: 1') && (await h.locator('.hw-info').count()) === 1);

  /* settings (AC-6.4, 15.1) */
  await h.getByRole('button', { name: 'Viết lại' }).first().click();
  await h.getByRole('button', { name: 'Cài đặt' }).click();
  await h.locator('.sheet').getByRole('button', { name: '米字格' }).click();
  await h.locator('.sheet').getByRole('switch', { name: 'Thuận tay trái' }).click();
  await h.locator('.sheet .sheet-foot').getByRole('button', { name: 'Đóng' }).click();
  ok('013 Cài đặt: 米字格 adds the diagonals, “Thuận tay trái” moves the toolbar left', (await h.locator('.hw-grid line').count()) === 4 && (await h.locator('.hw-padwrap.is-left').count()) === 1);
  await p.evaluate(() => { const s = D.tuhoc013.acc[ME].set; s.grid = 'tian'; s.left = false; });
  /* Xem chữ counts a hint (AC-10.5) */
  await h.getByRole('button', { name: 'Xem chữ' }).click();
  ok('013 “Xem chữ” shows the character outline for 2 s', (await h.locator('.hw-ol-e').count()) === 6);
  await p.waitForTimeout(2150);
  ok('013 … then hides it again', (await h.locator('.hw-ol-e').count()) === 0);

  /* back to home: review list, history (AC-13.2, 13.5, 13.6, 13.7, 16.3) */
  await h.getByRole('button', { name: 'Quay lại' }).click();
  ok('013 “Quay lại” → S16 home', (await h.locator('.hw-levels').count()) === 1);
  ok('013 tab “Chữ cần luyện (3)” after a “Cần luyện thêm” attempt', /Chữ cần luyện \(3\)/.test(await T(h.locator('.hw-tabs'))));
  await h.locator('.hw-tab', { hasText: 'Chữ cần luyện' }).click();
  ok('013 Chữ cần luyện: oldest first, “Bỏ khỏi danh sách”, “Luyện tất cả”, removed char “Không còn dữ liệu luyện”', (await T(h.locator('.hw-row').first())).includes('Không còn dữ liệu luyện')
    && (await h.getByRole('button', { name: 'Bỏ khỏi danh sách' }).count()) === 3 && (await h.getByRole('button', { name: 'Luyện tất cả' }).count()) === 1);
  await h.locator('.hw-tab', { hasText: 'Lịch sử' }).click();
  ok('013 Lịch sử: latest first, “Đã luyện 1 lần”, dd/mm/yyyy', (await T(h.locator('.hw-row').first())).includes('Đã luyện 1 lần · 20/10/2026') && (await T(h.locator('.hw-row', { hasText: '口' }))).includes('Đã luyện 2 lần'));
  await h.locator('.hw-tab', { hasText: 'Chữ cần luyện' }).click();
  await h.getByRole('button', { name: 'Luyện tất cả' }).click();
  ok('013 “Luyện tất cả” → Viết từ trí nhớ, “Chữ 1/2” (大, 好)', (await T(h.locator('.hw-modes [aria-pressed="true"]'))) === 'Viết từ trí nhớ' && (await T(h.locator('.hw-kn'))) === 'Chữ 1/2');
  await h.getByRole('button', { name: 'Chữ sau' }).click(); await writeAll(h, '好');
  ok('013 memory “Tốt” → 好 leaves Chữ cần luyện; last char → “Xong”', (await T(h.locator('.hw-res'))).includes('Tốt') && (await h.getByRole('button', { name: 'Xong' }).count()) === 1 && !(await p.evaluate(() => D.tuhoc013.acc[ME].rev.some((r) => r.ch === '好'))));
  await h.getByRole('button', { name: 'Xong' }).click();
  ok('013 “Xong” → “Đã luyện 1/2 chữ · Tốt: 1 · Cần luyện thêm: 0” + “Về trang chính”', (await T(h.locator('.hw-sum'))).includes('Đã luyện 1/2 chữ · Tốt: 1 · Cần luyện thêm: 0') && (await h.getByRole('button', { name: 'Về trang chính' }).count()) === 1);
  await h.getByRole('button', { name: 'Về trang chính' }).click();
  ok('013 “Về trang chính” → S16 home', (await h.locator('.hw-tabs').count()) === 1);

  /* radicals (AC-12.1–12.6, 5.4) */
  await h.locator('.hw-tab', { hasText: 'Bộ thủ' }).click();
  ok('013 Bộ thủ: groups “1 nét” … “4 nét”, “人 · 亻”, “{n} chữ”', /1 nét.*2 nét.*3 nét.*4 nét/.test(await T(h.locator('.hw-tabbody'))) && (await T(h.locator('.hw-rrow', { hasText: 'Nhân' }))).includes('人 · 亻') && (await T(h.locator('.hw-rrow', { hasText: 'Nhân' }))).includes('2 chữ'));
  await h.getByPlaceholder('Lọc bộ thủ').fill('nuoc'); await p.waitForTimeout(80);
  ok('013 “Lọc bộ thủ” “nuoc” keeps only 水 · 氵', (await h.locator('.hw-rrow').count()) === 1 && (await T(h.locator('.hw-rrow'))).includes('水 · 氵'));
  await h.locator('.hw-rrow').click();
  ok('013 bộ 水: “Chưa có chữ nào thuộc bộ này để luyện viết.”', (await T(h.locator('.hw-phone'))).includes('Chưa có chữ nào thuộc bộ này để luyện viết.') && (await h.getByRole('button', { name: 'Luyện viết bộ này' }).count()) === 0);
  await h.getByRole('button', { name: 'Quay lại' }).click();
  await h.getByPlaceholder('Lọc bộ thủ').fill('xyz'); await p.waitForTimeout(80);
  ok('013 filter without match: “Không có bộ thủ phù hợp.”', (await T(h.locator('.hw-tabbody'))).includes('Không có bộ thủ phù hợp.'));
  await h.getByPlaceholder('Lọc bộ thủ').fill('女'); await p.waitForTimeout(80);
  await h.locator('.hw-rrow').click();
  ok('013 bộ 女: “Luyện viết bộ này” + chars grouped “HSK 1” (好 妈 女)', (await h.getByRole('button', { name: 'Luyện viết bộ này' }).count()) === 1 && (await h.locator('.hw-tile').count()) === 3 && (await T(h.locator('.hw-phone'))).includes('HSK 1'));
  await h.getByRole('button', { name: 'Luyện viết bộ này' }).click();
  ok('013 “Luyện viết bộ này” opens the radical form 女 (list of 1, no counter)', (await h.locator('.hw-kn').count()) === 0 && (await T(h.locator('.hw-info, .hw-prompt'))).length > 0);

  /* component → practice → Quay lại returns to the first character (AC-5.5), info-only char (AC-16.1) */
  await open('hv', { view: 'practice', k: 0, list: ['你'], src: 'one', mode: 'trace' });
  await h.locator('.hw-cau-btn', { hasText: 'Cấu tạo chữ' }).click();
  await h.locator('.hw-comp', { hasText: '尔' }).click();
  ok('013 component 尔 without stroke data: info + “Chữ này chưa có dữ liệu nét để luyện viết.”, modes disabled', (await T(h.locator('.hw-phone'))).includes('Chữ này chưa có dữ liệu nét để luyện viết.') && (await h.locator('.hw-modes button:disabled').count()) === 3);
  await h.getByRole('button', { name: 'Quay lại' }).click();
  ok('013 “Quay lại” → back to 你 in Tô theo mẫu', (await T(h.locator('.hw-modes [aria-pressed="true"]'))) === 'Tô theo mẫu' && (await T(h.locator('.hw-info'))).includes('nǐ'));

  /* 012 entry (AC-4.1, 4.4, 4.5) */
  await p.evaluate(() => { enterRole('hv', 'S16'); ACTIONS.v013Words(FRAMES.hv, JSON.stringify([['你好吗', 'nǐ hǎo ma', 'bạn có khỏe không']])); });
  ok('013 from 012 word 你好吗: skips 吗 (“Bỏ qua 1 chữ chưa có dữ liệu nét: 吗”), word header, “Chữ 1/2”', (await T(h.locator('.hw-phone'))).includes('Bỏ qua 1 chữ chưa có dữ liệu nét: 吗') && /(你|□)好吗 nǐ hǎo ma/.test(await T(h.locator('.hw-word'))) && (await T(h.locator('.hw-kn'))) === 'Chữ 1/2');
  await p.evaluate(() => { ACTIONS.v013Words(FRAMES.hv, JSON.stringify([['OK 3D']])); render(FRAMES.hv); });
  ok('013 from 012 without Hanzi: “Chưa có chữ nào trong mục này để luyện viết.”', (await T(h.locator('.hw-phone'))).includes('Chưa có chữ nào trong mục này để luyện viết.'));

  /* reduced motion (AC-7.6), offline save (AC-16.5), load error (AC-16.6), other account (AC-14.4) */
  await p.evaluate(() => { D.tuhoc013.reduce = true; }); await open('hv', { view: 'practice', k: 0, list: ['你'], src: 'one', mode: 'watch' });
  ok('013 reduced motion: no autoplay, “Từng nét” at “Nét 1/7”', (await T(h.locator('.hw-stepline'))).startsWith('Nét 1/7') && !(await p.evaluate(() => HW.anim.hv.play)));
  await p.evaluate(() => { D.tuhoc013.reduce = false; D.tuhoc013.offline = true; }); await open('hv', { view: 'practice', k: 0, list: ['口'], src: 'one', mode: 'trace' });
  await writeAll(h, '口');
  ok('013 offline: result still shown + “Chưa lưu được kết quả vào lịch sử. Hệ thống sẽ tự thử lại khi có mạng.”', (await T(h.locator('.hw-res'))).includes('Chưa lưu được kết quả vào lịch sử. Hệ thống sẽ tự thử lại khi có mạng.'));
  await h.getByRole('button', { name: 'Mô phỏng: có mạng trở lại' }).click();
  ok('013 reconnect → “Đã lưu kết quả.”', (await T(h.locator('.hw-res'))).includes('Đã lưu kết quả.'));
  await p.evaluate(() => { D.tuhoc013.fail = true; }); await open('hv', {});
  ok('013 load error: “Không tải được dữ liệu. Vui lòng thử lại.” + “Thử lại”', (await T(h.locator('.hw-tabbody'))).includes('Không tải được dữ liệu. Vui lòng thử lại.'));
  await h.getByRole('button', { name: 'Thử lại' }).click();
  ok('013 “Thử lại” loads the list', (await h.locator('.hw-tile').count()) === 9);
  await open('hv', { acct: 's2' });
  ok('013 another account’s practice data → A05', (await T(h)).includes('Không tìm thấy nội dung'));

  /* V15: Tự học is for HV only — the GV frame gets A05 */
  await open('gv', {});
  ok('013 V15: GV opening S16 → A05 in the GV shell', (await scr('gv')) === 'A05' && (await g.locator('.gv-side').count()) === 1);
  await p.close();
}

/* ════════ v14 014 nghe & nói (S17–S18) — from proto-w3/014/verify-steps.cjs ════════ */
// 014 Luyện nghe & nói — S17 / S18 click-through checks, in the style of scripts/design/verify-prototype.cjs.
// Integrator: paste `verify014` into verify-prototype.cjs and call it inside the main IIFE, e.g.
//   await STEP('014 listening & speaking', () => verify014({ browser, URL, ok, norm, watch }));
// It opens its own page (like the 'exams' step), so the state of the main page is untouched.
async function verify014({ browser, URL, ok, norm, watch }) {
  const p = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); watch(p); p.setDefaultTimeout(8000);
  const net = []; p.on('request', (r) => { const u = r.url(); if (!u.startsWith('file:') && !/fonts\.(googleapis|gstatic)\.com/.test(u) && !u.startsWith('data:')) net.push(u); });
  await p.goto(URL + '#S17', { waitUntil: 'load' }); await p.waitForTimeout(400);
  const h = p.locator('[data-frame="hv"]'); const g = p.locator('[data-frame="gv"]');
  const T = async (fr) => norm(await fr.innerText()); const scr = (fr) => fr.getAttribute('data-screen');
  const hasText = async (fr, t) => (await fr.getByText(t, { exact: false }).count()) > 0;
  const waitText = async (fr, t, ms = 8000) => { try { await fr.getByText(t, { exact: false }).first().waitFor({ timeout: ms }); return true; } catch (e) { return false; } };
  const open = (id, fid, params, ui) => p.evaluate(([a, f, c, d]) => { enterRole(f, a); openInProto(a, f, null, c, d); }, [id, fid, params || {}, ui || null]);
  const T14 = (fn) => p.evaluate(fn);

  /* ── S17 · Nghe từ & câu ── */
  ok('014 #S17 deep link → HV frame S17 “Luyện nghe” with “Quay lại”', (await scr(h)) === 'S17' && (await h.locator('.hv-head h1').innerText()) === 'Luyện nghe' && (await h.getByRole('button', { name: 'Quay lại' }).count()) === 1);
  ok('014 S17: tabs “Nghe từ & câu” (selected) · “Nghe hiểu” · “Lịch sử” (014 · AC-1.3)', norm((await h.getByRole('tab').allInnerTexts()).join('|')) === 'Nghe từ & câu|Nghe hiểu|Lịch sử' && (await h.getByRole('tab', { name: 'Nghe từ & câu' }).getAttribute('aria-selected')) === 'true');
  ok('014 S17: filters “Cấp HSK” HSK 1 … HSK 6, HSK 7–9 (last chosen HSK 2 pre-selected) + “Chủ đề” starting with “Tất cả” (014 · AC-2.1, AC-2.2)', (await h.getByRole('group', { name: 'Cấp HSK' }).getByRole('button').count()) === 7 && (await h.getByRole('button', { name: 'HSK 2', exact: true }).getAttribute('aria-pressed')) === 'true' && (await h.getByRole('group', { name: 'Chủ đề' }).getByRole('button').first().getAttribute('aria-pressed')) === 'true');
  const row = h.locator('[data-ls-item="w201"]');
  ok('014 S17: an item = Hanzi + tone-marked pinyin + meaning + play + “Nói theo” (014 · AC-4.1)', /谢谢 xièxie cảm ơn/.test(await T(row)) && (await row.getByRole('button', { name: 'Phát: 谢谢' }).count()) === 1 && (await row.getByRole('button', { name: /Nói theo/ }).count()) === 1);
  await row.getByRole('button', { name: 'Phát: 谢谢' }).click();
  ok('014 S17: first tap shows the loading state on the play button (014 · AC-3.5)', (await row.locator('.ls-pbtn[aria-busy="true"]').count()) === 1);
  await row.locator('.ls-pbtn').click();   /* a second tap while loading must not start twice */
  await row.getByRole('button', { name: 'Tạm dừng: 谢谢' }).waitFor({ timeout: 3000 });
  ok('014 S17: playing item is marked “Đang phát” with “Tạm dừng” (014 · AC-3.1, AC-4.2)', (await row.getAttribute('class')).includes('is-on') && (await T(row)).includes('Đang phát'));
  await row.getByRole('button', { name: 'Phát: 谢谢' }).waitFor({ timeout: 4000 });
  ok('014 S17: after playing, nothing else auto-plays (014 · AC-4.5)', (await h.locator('.ls-item.is-on').count()) === 0);
  await h.getByRole('button', { name: /^Tốc độ phát/ }).first().click();
  ok('014 S17: speed menu 0,5× · 0,75× · 1× (mặc định) · 1,25× (014 · AC-3.2)', norm((await h.getByRole('menuitemradio').allInnerTexts()).join('|')) === '0,5×|0,75×|1× (mặc định)|1,25×');
  await h.getByRole('menuitemradio', { name: /0,75×/ }).click();
  ok('014 S17: chosen speed shows on the control', (await h.getByRole('button', { name: 'Tốc độ phát: 0,75×' }).count()) >= 1);
  await h.getByRole('button', { name: 'Lặp lại' }).first().click();
  ok('014 S17: “Lặp lại” is a toggle (014 · AC-3.3)', (await h.getByRole('button', { name: 'Lặp lại' }).first().getAttribute('aria-pressed')) === 'true');
  await h.getByRole('switch', { name: 'Pinyin' }).click();
  ok('014 S17: “Pinyin” off hides pinyin of every item, Hanzi + meaning stay (014 · AC-4.3)', (await h.locator('.ls-item .ls-py').count()) === 0 && (await T(row)).includes('谢谢') && (await T(row)).includes('cảm ơn'));
  await open('S17', 'hv');
  ok('014 S17 reopened: Pinyin choice and speed are kept on the device (014 · AC-4.3, AC-3.2)', (await h.locator('.ls-item .ls-py').count()) === 0 && (await h.getByRole('button', { name: 'Tốc độ phát: 0,75×' }).count()) >= 1);
  await h.getByRole('switch', { name: 'Pinyin' }).click();
  await h.locator('.seg').getByRole('button', { name: 'Câu', exact: true }).click();
  ok('014 S17: “Câu” lists sentences only', (await h.locator('.ls-item').count()) > 0 && (await h.locator('.ls-item .ls-kind').allInnerTexts()).every((x) => /câu/i.test(x)));
  await h.getByRole('button', { name: 'HSK 7–9', exact: true }).click();
  ok('014 S17: level without content → “Chưa có nội dung cho cấp và chủ đề này.”, filters kept (014 · AC-2.4)', await hasText(h, 'Chưa có nội dung cho cấp và chủ đề này.') && (await h.getByRole('group', { name: 'Cấp HSK' }).count()) === 1);
  await h.getByRole('button', { name: 'HSK 1', exact: true }).click(); await h.locator('.seg').getByRole('button', { name: 'Tất cả', exact: true }).click();
  ok('014 S17: 20 items per load + “Tải thêm” (014 · AC-2.3)', (await h.locator('.ls-item').count()) === 20 && (await h.getByRole('button', { name: /Tải thêm 6 mục/ }).count()) === 1);
  await h.getByRole('button', { name: /Tải thêm/ }).click();
  ok('014 S17: “Tải thêm” appends the rest', (await h.locator('.ls-item').count()) === 26);
  await T14(() => { D.tuhoc014.flags.loadFail = true; render(FRAMES.hv); });
  ok('014 S17: load error → “Không tải được nội dung. Vui lòng thử lại.” + “Thử lại”, no empty list (014 · AC-2.5)', await hasText(h, 'Không tải được nội dung. Vui lòng thử lại.') && (await h.locator('.ls-item').count()) === 0);
  await h.getByRole('button', { name: 'Thử lại' }).click();
  await T14(() => { D.tuhoc014.flags.audioFail = true; D.tuhoc014.loaded = {}; });
  await h.locator('[data-ls-item="w101"]').getByRole('button', { name: 'Phát: 你好' }).click();
  ok('014 S17: audio error at that player → “Không phát được âm thanh. Vui lòng thử lại.” + “Thử lại” (014 · AC-3.6)', await waitText(h, 'Không phát được âm thanh. Vui lòng thử lại.', 3000) && (await h.locator('[data-ls-item="w101"] .ls-aerr').getByRole('button', { name: 'Thử lại' }).count()) === 1);
  await h.locator('[data-ls-item="w101"] .ls-aerr').getByRole('button', { name: 'Thử lại' }).click();
  ok('014 S17: “Thử lại” plays again', !(await hasText(h, 'Không phát được âm thanh.')));

  /* ── S17 · Nghe hiểu → kết quả → lịch sử ── */
  await h.getByRole('button', { name: 'HSK 2', exact: true }).click(); await h.getByRole('tab', { name: 'Nghe hiểu' }).click();
  const les = h.locator('.ls-lrow', { hasText: 'Ở nhà hàng' });
  ok('014 S17 Nghe hiểu: name, “Hội thoại”, 0:48, 3 câu hỏi, “Gần nhất: 3/3 câu đúng” / “Chưa làm” (014 · AC-5.1)', /Ở nhà hàng.*Hội thoại.*0:48.*3 câu hỏi.*Gần nhất: 3\/3 câu đúng/i.test(await T(les)) && await hasText(h, 'Chưa làm'));
  await les.click();
  ok('014 S17 lesson: player with progress bar + m:ss, no transcript / answers before submitting (014 · AC-5.2, AC-5.3)', (await h.getByRole('slider', { name: /Tua âm thanh/ }).count()) === 1 && (await T(h)).includes('0:48') && !(await T(h)).includes('欢迎光临') && (await h.getByRole('radio').count()) === 10);
  const submit = h.locator('.hv-foot').getByRole('button', { name: 'Nộp bài' });
  ok('014 S17 lesson: “Nộp bài” disabled + “Đã trả lời 0/3 câu” (014 · AC-5.5)', await submit.isDisabled() && (await T(h.locator('.hv-foot'))).includes('Đã trả lời 0/3 câu'));
  await h.getByRole('radiogroup', { name: 'Câu 1' }).getByRole('radio', { name: /Hai người/ }).click();
  await h.getByRole('button', { name: 'Quay lại' }).click();
  ok('014 S17 lesson: leaving with answers asks “Thoát bài nghe? Các câu đã chọn sẽ không được lưu.” (014 · AC-5.6)', /Thoát bài nghe\?.*Các câu đã chọn sẽ không được lưu\./.test(norm(await h.locator('.confirm').innerText())) && (await h.locator('.confirm').getByRole('button', { name: 'Ở lại' }).count()) === 1);
  await h.locator('.confirm').getByRole('button', { name: 'Ở lại' }).click();
  await h.getByRole('radiogroup', { name: 'Câu 2' }).getByRole('radio', { name: /Trà/ }).click();
  await h.getByRole('radiogroup', { name: 'Câu 3' }).getByRole('radio', { name: /Cơm/ }).click();
  ok('014 S17 lesson: all answered → “Đã trả lời 3/3 câu”, “Nộp bài” enabled', !(await submit.isDisabled()) && (await T(h.locator('.hv-foot'))).includes('Đã trả lời 3/3 câu'));
  await T14(() => { D.tuhoc014.flags.submitFail = true; });
  await submit.click();
  ok('014 S17: submit fails → “Không nộp được bài. Kiểm tra kết nối và thử lại.”, answers kept (014 · AC-6.6)', await hasText(h, 'Không nộp được bài. Kiểm tra kết nối và thử lại.') && (await h.getByRole('radio', { checked: true }).count()) === 3);
  await h.locator('.ls-suberr').getByRole('button', { name: 'Thử lại' }).click();
  ok('014 S17 result: “2/3 câu đúng”, Đúng/Sai per question, correct answer + explanation (014 · AC-6.1)', (await T(h.locator('.ls-hero'))).includes('2/3 câu đúng') && (await h.locator('.ls-rq .chip.danger').count()) === 1 && (await h.locator('.ls-rq .chip.done').count()) === 2 && (await h.locator('.ls-expl').count()) === 3 && (await h.locator('.ls-keylbl').count()) === 3);
  ok('014 S17 result: full transcript with speakers + “Pinyin” / “Nghĩa” switches, player still there (014 · AC-6.2)', (await T(h.locator('.ls-trans'))).includes('欢迎光临！您几位？') && (await T(h.locator('.ls-trans'))).includes('Nhân viên') && (await h.locator('.ls-trans').getByRole('switch').count()) === 2 && (await h.getByRole('slider', { name: /Tua âm thanh/ }).count()) === 1);
  ok('014 S17 result: “Làm lại” + “Bài tiếp theo” (014 · AC-6.3, AC-6.4)', (await h.locator('.hv-foot').getByRole('button', { name: 'Làm lại' }).count()) === 1 && (await h.locator('.hv-foot').getByRole('button', { name: /Bài tiếp theo/ }).count()) === 1);
  await h.getByRole('button', { name: 'Quay lại' }).click(); await h.getByRole('tab', { name: 'Lịch sử' }).click();
  const acc2 = norm(await h.locator('[data-ls-acc="2"]').innerText());
  ok('014 S17 Lịch sử: “Độ chính xác theo cấp” counts only the first attempt per listening — HSK2 67 %, “1 bài” after a re-take (014 · AC-7.1, AC-7.5)', /HSK2\s*67%\s*1 bài/.test(acc2), acc2);
  ok('014 S17 Lịch sử: every attempt, newest first, dd/mm/yyyy HH:mm + “x/y câu đúng”; removed listening labelled (014 · AC-7.2, AC-17.2)', (await h.locator('.ls-hrow').count()) === 5 && /2\/3 câu đúng/.test(await T(h.locator('.ls-hrow').first())) && /\d\d\/\d\d\/\d{4} \d\d:\d\d/.test(await T(h.locator('.ls-hrow').first())) && (await T(h.locator('.ls-hrow').last())).includes('Bài không còn trong kho'));
  await h.locator('.ls-hrow').last().click();
  ok('014 S17 Lịch sử: a removed listening opens read-only without “Làm lại” (014 · AC-7.3, AC-17.2)', (await T(h.locator('.ls-hero'))).includes('1/2 câu đúng') && (await h.getByRole('button', { name: 'Làm lại' }).count()) === 0 && (await h.getByRole('button', { name: 'Về Lịch sử' }).count()) === 1);
  await h.getByRole('button', { name: 'Về Lịch sử' }).click();

  /* ── S17 → S18 · Nói theo ── */
  await h.getByRole('tab', { name: 'Nghe từ & câu' }).click();
  await h.locator('[data-ls-item="w207"]').getByRole('button', { name: /Nói theo/ }).click();
  ok('014 “Nói theo” on an item → S18 practice screen of that item (014 · AC-4.4, AC-10.2)', (await scr(h)) === 'S18' && (await T(h.locator('.ls-word'))).includes('我想要一杯咖啡。') && (await T(h.locator('.ls-word'))).includes('Wǒ xiǎng yào yì bēi kāfēi.') && (await h.getByRole('button', { name: 'Nghe mẫu' }).count()) === 1 && (await h.getByRole('button', { name: 'Thu âm' }).count()) === 1);
  ok('014 S18: privacy line next to “Thu âm” (014 · AC-15.3)', (await T(h.locator('.ls-recard'))).includes('Bản thu chỉ lưu trên thiết bị này và tự xóa khi bạn rời bài.'));
  ok('014 S18: speed kept across S17 → S18 (014 · AC-3.2)', (await h.getByRole('button', { name: 'Tốc độ phát: 0,75×' }).count()) === 1);
  await h.getByRole('button', { name: 'Thu âm' }).click();
  ok('014 S18: first “Thu âm” explains the micro first, “Tiếp tục” / “Để sau” (014 · AC-8.1)', (await T(h.locator('.confirm'))).includes('SAT cần dùng micro để thu giọng của bạn. Bản thu chỉ lưu trên thiết bị này và tự xóa khi bạn rời bài.') && (await h.locator('.confirm').getByRole('button', { name: 'Để sau' }).count()) === 1);
  await h.locator('.confirm').getByRole('button', { name: 'Tiếp tục' }).click();
  ok('014 S18: recording → “Đang thu…”, timer, level meter, “Dừng” (014 · AC-9.1)', (await T(h.locator('.ls-recing'))).includes('Đang thu…') && (await h.locator('.ls-meter i').count()) > 10 && (await h.getByRole('button', { name: 'Dừng' }).count()) === 1);
  await p.waitForTimeout(1300); await h.getByRole('button', { name: 'Dừng' }).click();
  ok('014 S18: after “Dừng” → “Nghe bản thu”, “So sánh”, “Thu lại”, “Xóa bản thu” + self-assessment question (014 · AC-9.2, AC-10.4, AC-11.1)', (await h.getByRole('button', { name: 'Nghe bản thu' }).count()) === 1 && (await h.getByRole('button', { name: 'So sánh' }).count()) === 1 && (await h.getByRole('button', { name: 'Thu lại' }).count()) === 1 && (await h.getByRole('button', { name: 'Xóa bản thu' }).count()) === 1 && await hasText(h, 'Bạn thấy mình nói giống mẫu chưa?'));
  await h.getByRole('button', { name: 'So sánh' }).click();
  let sawM = false, sawB = false;
  for (let i = 0; 40 > i && !(sawM && sawB); i++) { await p.waitForTimeout(150); const on = await h.locator('.ls-cmptag.on').allInnerTexts(); if (on.join('').includes('Mẫu')) sawM = true; if (on.join('').includes('Bạn')) sawB = true; }
  ok('014 S18: “So sánh” marks “Mẫu” then “Bạn” (014 · AC-10.5)', sawM && sawB);
  await h.getByRole('button', { name: 'Giống', exact: true }).click();
  ok('014 S18: “Giống” saved as the latest self-assessment (014 · AC-11.2)', (await h.getByRole('button', { name: 'Giống', exact: true }).getAttribute('aria-pressed')) === 'true');
  await h.getByRole('button', { name: 'Xóa bản thu' }).click();
  ok('014 S18: “Xóa bản thu” deletes at once, back to “Thu âm” (014 · AC-9.6)', (await h.locator('.confirm').count()) === 0 && (await h.getByRole('button', { name: 'Thu âm' }).count()) === 1 && (await h.getByRole('button', { name: 'Nghe bản thu' }).count()) === 0);
  await h.getByRole('button', { name: 'Thu âm' }).click(); await h.getByRole('button', { name: 'Dừng' }).click();
  ok('014 S18: take shorter than 0,5 s is dropped — “Bản thu quá ngắn. Hãy chọn Thu âm, nói rồi chọn Dừng.” (014 · AC-9.4)', await hasText(h, 'Bản thu quá ngắn. Hãy chọn Thu âm, nói rồi chọn Dừng.') && (await h.getByRole('button', { name: 'Nghe bản thu' }).count()) === 0);
  await h.getByRole('button', { name: 'Thu âm' }).click(); await p.waitForTimeout(700); await h.getByRole('button', { name: 'Tiếp' }).click();
  ok('014 S18: “Tiếp” moves to the next item and its take is gone (014 · AC-15.2)', (await T(h.locator('.ls-word'))).includes('这个菜很好吃。') && (await h.getByRole('button', { name: 'Nghe bản thu' }).count()) === 0 && (await h.locator('.ls-recing').count()) === 0);
  await h.getByRole('button', { name: 'Quay lại' }).click();
  ok('014 S18 Nói theo list: tabs (Nói theo selected) + latest labels “Giống” / “Chưa giống” (014 · AC-1.4, AC-10.1, AC-11.2)', (await h.getByRole('tab', { name: 'Nói theo' }).getAttribute('aria-selected')) === 'true' && (await T(h.locator('.ls-srow', { hasText: '我想要一杯咖啡' }))).includes('Giống') && (await T(h.locator('.ls-srow', { hasText: '这个菜很好吃' }))).includes('Chưa giống'));

  /* ── S18 · Đóng vai ── */
  await h.getByRole('tab', { name: 'Đóng vai' }).click();
  ok('014 S18 Đóng vai: “Tình huống” filter + groups “Gọi món”, “Mua sắm”, “Phỏng vấn”, “Giao tiếp công sở”; “Đã hoàn thành n lần” / “Chưa luyện” (014 · AC-12.1)', norm((await h.locator('.ls-grp').allInnerTexts()).join('|')).toLowerCase() === 'gọi món|mua sắm|phỏng vấn|giao tiếp công sở' && (await h.getByRole('group', { name: 'Tình huống' }).count()) === 1 && await hasText(h, 'Đã hoàn thành 1 lần') && await hasText(h, 'Chưa luyện'));
  await h.locator('.ls-rrow', { hasText: 'Gọi món ở quán mì' }).click();
  ok('014 S18 scenario: context, roles with turn counts, “Bắt đầu” disabled until one role is chosen (014 · AC-12.2)', (await T(h)).includes('Bối cảnh') && (await h.getByRole('radio', { name: /Khách hàng.*4 lượt thoại/ }).count()) === 1 && await h.locator('.hv-foot').getByRole('button', { name: 'Bắt đầu' }).isDisabled());
  await h.getByRole('button', { name: 'Xem trước kịch bản' }).click();
  ok('014 S18: “Xem trước kịch bản” lists every turn (role, Hanzi, pinyin, meaning) with play (014 · AC-12.3)', (await h.locator('.ls-pv').count()) === 9 && (await T(h.locator('.ls-preview'))).includes('Kěyǐ yòng shǒujī fù qián ma?'));
  await h.getByRole('radio', { name: /Khách hàng/ }).click();
  await p.evaluate(() => { D.tuhoc014.dev.hv.speed = 1.25; });
  await h.locator('.hv-foot').getByRole('button', { name: 'Bắt đầu' }).click();
  ok('014 S18 run: chat with the app’s first turn (role name) + “Làm lại từ đầu” (014 · AC-12.4, AC-13.1, AC-13.2)', (await T(h.locator('.ls-chat'))).includes('欢迎光临！请坐。') && (await T(h.locator('.ls-chat'))).includes('Nhân viên phục vụ') && (await h.getByRole('button', { name: 'Làm lại từ đầu' }).count()) === 1);
  ok('014 S18 run: privacy line in the role-play (014 · AC-15.3)', await hasText(h, 'Bản thu chỉ lưu trên thiết bị này và tự xóa khi bạn rời bài.'));
  ok('014 S18 run: app turn plays by itself, then “Đến lượt bạn” + “Gợi ý”, “Nghe mẫu”, “Thu âm”, “Bỏ qua” (014 · AC-13.2, AC-13.4)', await waitText(h, 'Đến lượt bạn', 9000) && (await h.locator('.ls-yours').getByRole('button', { name: 'Gợi ý' }).count()) === 1 && (await h.locator('.ls-yours').getByRole('button', { name: 'Nghe mẫu' }).count()) === 1 && (await h.locator('.ls-yours').getByRole('button', { name: 'Thu âm' }).count()) === 1 && (await h.locator('.ls-yours').getByRole('button', { name: 'Bỏ qua' }).count()) === 1);
  await h.locator('.ls-yours').getByRole('button', { name: 'Gợi ý' }).click();
  ok('014 S18 run: “Gợi ý” shows pinyin + meaning (014 · AC-13.5)', (await T(h.locator('.ls-yours'))).includes('Xièxie. Yǒu càidān ma?') && (await T(h.locator('.ls-yours'))).includes('Cảm ơn. Có thực đơn không?'));
  await h.locator('.ls-yours').getByRole('button', { name: 'Thu âm' }).click(); await p.waitForTimeout(900); await h.getByRole('button', { name: 'Dừng' }).click();
  ok('014 S18 run: own turn recorded → “Nghe bản thu”, “Thu lại”, “Tiếp tục” (014 · AC-13.6)', (await h.locator('.ls-yours').getByRole('button', { name: 'Nghe bản thu' }).count()) === 1 && (await h.locator('.ls-yours').getByRole('button', { name: 'Thu lại' }).count()) === 1 && (await h.locator('.ls-yours').getByRole('button', { name: /Tiếp tục/ }).count()) === 1);
  await h.locator('.ls-yours').getByRole('button', { name: /Tiếp tục/ }).click();
  ok('014 S18 run: past turn has “Nghe lại” and “Đã thu” (014 · AC-13.8)', (await h.locator('.ls-turn[data-turn="1"]').getByRole('button', { name: /Nghe lại/ }).count()) === 1 && (await T(h.locator('.ls-turn[data-turn="1"]'))).includes('Đã thu'));
  await h.getByRole('button', { name: 'Làm lại từ đầu' }).click();
  ok('014 S18 run: “Làm lại từ đầu” asks “Bắt đầu lại? Các bản thu của lần này sẽ bị xóa.” (014 · AC-14.4)', /Bắt đầu lại\?.*Các bản thu của lần này sẽ bị xóa\./.test(norm(await h.locator('.confirm').innerText())));
  await h.locator('.confirm').getByRole('button', { name: 'Hủy' }).click();
  for (let k = 0; 3 > k; k++) { await h.locator('.ls-yours').getByRole('button', { name: 'Bỏ qua' }).waitFor({ timeout: 12000 }); await h.locator('.ls-yours').getByRole('button', { name: 'Bỏ qua' }).click(); }
  ok('014 S18 run: skipped turns marked “Đã bỏ qua” (014 · AC-13.7)', (await h.locator('.ls-turn.me', { hasText: 'Đã bỏ qua' }).count()) >= 2);
  ok('014 S18 done: “Hoàn thành hội thoại” + “Đã thu 1/4 lượt của bạn” + “Nghe lại cả hội thoại”, “Làm lại”, “Đổi vai”, “Về danh sách” (014 · AC-14.1)', await waitText(h, 'Hoàn thành hội thoại', 12000) && await hasText(h, 'Đã thu 1/4 lượt của bạn') && (await h.getByRole('button', { name: 'Nghe lại cả hội thoại' }).count()) === 1 && (await h.locator('.hv-foot').getByRole('button').allInnerTexts()).map(norm).join('|') === 'Làm lại|Đổi vai|Về danh sách');
  ok('014 S18 done: skipped turns replay as “Bản mẫu” (014 · AC-14.2)', (await h.locator('.ls-turn.me', { hasText: 'Bản mẫu' }).count()) === 3);
  await h.getByRole('button', { name: 'Nghe lại cả hội thoại' }).click(); await p.waitForTimeout(900);
  ok('014 S18 done: replay marks the playing turn, “Tạm dừng” (014 · AC-14.2, AC-14.3)', (await h.locator('.ls-turn.is-play').count()) === 1 && (await h.getByRole('button', { name: 'Tạm dừng' }).count()) === 1);
  await h.getByRole('button', { name: 'Tạm dừng' }).click();
  ok('014 S18 done: “Phát tiếp” after pausing (014 · AC-14.3)', (await h.getByRole('button', { name: 'Phát tiếp' }).count()) === 1);
  await h.locator('.hv-foot').getByRole('button', { name: 'Đổi vai' }).click();
  ok('014 S18: “Đổi vai” returns to role choice of the same scenario (014 · AC-14.5)', (await h.getByRole('radiogroup', { name: 'Chọn vai của bạn' }).count()) === 1 && await h.locator('.hv-foot').getByRole('button', { name: 'Bắt đầu' }).isDisabled());
  await h.getByRole('button', { name: 'Quay lại' }).click(); await h.getByRole('tab', { name: 'Tiến độ' }).click();
  ok('014 S18 Tiến độ: “Giống x/y” · “Chưa giống z” per level + completed scenarios with count, last role, date (014 · AC-11.4)', /Giống 3\/15\s*Chưa giống 1/.test(await T(h.locator('[data-ls-pg="2"]'))) && /Đã hoàn thành 2 lần · vai gần nhất: Khách hàng · 20\/10\/2026/.test(await T(h)));
  await h.locator('[data-ls-pg="2"]').getByRole('button', { name: 'Luyện lại mục Chưa giống' }).click();
  ok('014 S18: “Luyện lại mục Chưa giống” → Nói theo with only those items + “Bỏ lọc” (014 · AC-11.5)', (await h.locator('.ls-srow').count()) === 1 && (await h.getByRole('button', { name: 'Bỏ lọc' }).count()) === 1);
  await h.getByRole('button', { name: 'Bỏ lọc' }).click();
  ok('014 S18: “Bỏ lọc” shows the full list again', (await h.locator('.ls-srow').count()) === 15);

  /* ── micro / browser conditions (Kịch bản) ── */
  await p.evaluate(() => { lsReset(); D.tuhoc014.acc.hv.lv = 2; D.tuhoc014.flags.micDeny = true; });
  await open('S18', 'hv', {}, { tab: 'sh', item: 'w207' });
  await h.getByRole('button', { name: 'Thu âm' }).click(); await h.locator('.confirm').getByRole('button', { name: 'Tiếp tục' }).click();
  ok('014 S18: micro denied → “Bạn đã chặn quyền dùng micro…” + “Thử lại”, no recording, sample still playable (014 · AC-8.2)', await hasText(h, 'Bạn đã chặn quyền dùng micro. Hãy cho phép micro cho trang này trong cài đặt trình duyệt rồi chọn Thử lại.') && (await h.locator('.ls-recing').count()) === 0 && !(await h.getByRole('button', { name: 'Nghe mẫu' }).isDisabled()));
  await p.evaluate(() => { lsReset(); D.tuhoc014.acc.hv.lv = 2; D.tuhoc014.flags.micNone = true; D.tuhoc014.dev.hv.mic = 'granted'; });
  await open('S18', 'hv', {}, { tab: 'sh', item: 'w207' }); await h.getByRole('button', { name: 'Thu âm' }).click();
  ok('014 S18: no micro → “Không tìm thấy micro trên thiết bị này.”, “Thu âm” disabled until “Thử lại” (014 · AC-8.3)', await hasText(h, 'Không tìm thấy micro trên thiết bị này.') && await h.getByRole('button', { name: 'Thu âm' }).isDisabled());
  await p.evaluate(() => { lsReset(); D.tuhoc014.flags.unsupported = true; });
  await open('S18', 'hv', {}, { tab: 'sh', item: 'w207' });
  ok('014 S18: unsupported browser → banner on open, “Thu âm” disabled, listening still works (014 · AC-8.4)', await hasText(h, 'Trình duyệt này không hỗ trợ thu âm. Hãy dùng phiên bản mới của Chrome, Safari, Edge hoặc Firefox.') && await h.getByRole('button', { name: 'Thu âm' }).isDisabled() && !(await h.getByRole('button', { name: 'Nghe mẫu' }).isDisabled()));
  await p.evaluate(() => { lsReset(); D.tuhoc014.dev.hv.mic = 'granted'; D.tuhoc014.flags.interrupt = true; });
  await open('S18', 'hv', {}, { tab: 'sh', item: 'w207' }); await h.getByRole('button', { name: 'Thu âm' }).click();
  ok('014 S18: interrupted recording → “Thu âm bị gián đoạn. Vui lòng thu lại.” (014 · AC-8.5)', await waitText(h, 'Thu âm bị gián đoạn. Vui lòng thu lại.', 4000) && (await h.getByRole('button', { name: 'Nghe bản thu' }).count()) === 0);
  await p.evaluate(() => { lsReset(); D.tuhoc014.acc.hv.lv = 2; D.tuhoc014.flags.autoplayBlocked = true; });
  await open('S18', 'hv', {}, { tab: 'rp', sc: 'r1' }); await h.getByRole('radio', { name: /Khách hàng/ }).click(); await h.locator('.hv-foot').getByRole('button', { name: 'Bắt đầu' }).click();
  await h.locator('.ls-blocked').getByRole('button', { name: 'Phát' }).waitFor({ timeout: 3000 });
  ok('014 S18 run: autoplay blocked → stops at the turn with “Phát” (014 · AC-13.3)', (await h.locator('.ls-yours').count()) === 0);
  await h.locator('.ls-blocked').getByRole('button', { name: 'Phát' }).click();
  ok('014 S18 run: after “Phát” the conversation continues', await waitText(h, 'Đến lượt bạn', 9000));
  await h.getByRole('button', { name: 'Quay lại' }).click();
  ok('014 S18 run: leaving mid-way asks “Thoát đóng vai? Các bản thu của lần này sẽ bị xóa.” (014 · AC-14.6)', /Thoát đóng vai\?.*Các bản thu của lần này sẽ bị xóa\./.test(norm(await h.locator('.confirm').innerText())));
  await h.locator('.confirm').getByRole('button', { name: 'Thoát' }).click();
  ok('014 no audio leaves the device: 0 network requests during Nói theo / Đóng vai (014 · AC-15.1, NFR-8)', net.length === 0, net.join(' '));

  /* ── V15: Tự học is for HV only — the GV frame gets A05 ── */
  await open('S17', 'gv');
  ok('014 V15: GV opening S17 → A05 in the GV shell', (await scr(g)) === 'A05' && (await g.locator('.gv-side').count()) === 1);
  await open('S18', 'gv', {}, { tab: 'pg' });
  ok('014 V15: GV opening S18 → A05', (await scr(g)) === 'A05');
  await p.close();
}

/* ════════ v14 015 thi thử HSK (S19–S20) — from proto-w3/015/verify-steps.cjs ════════ */
/* ---------- 015 · Thi thử HSK: S19 (cấp, 3 loại bài, luyện, đề thi thử có giờ + Nghe, nộp) → S20 (kết quả, xem lại, thống kê lỗi) · GV desktop · A05 ----------
   Style of scripts/design/verify-prototype.cjs. In that file: `await STEP('015 thi thử', () => verify015({ browser, URL, ok, norm, watch, SP }));` */
async function verify015(ctx) {
  const { browser, URL, ok, norm, watch, SP } = ctx;
  const p = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); watch(p); p.setDefaultTimeout(6000);
  await p.goto(URL + '#S19', { waitUntil: 'load' }); await p.waitForTimeout(300);
  const h = p.locator('[data-frame="hv"]'); const g = p.locator('[data-frame="gv"]');
  const T = async (loc) => norm(await loc.innerText()); const scr = (fr) => fr.getAttribute('data-screen');
  const toastHv = async () => norm(await p.locator('[data-toasts="hv"]').innerText());
  const conf = async () => ((await h.locator('.confirm').count()) ? norm(await h.locator('.confirm').innerText()) : '');
  const confirmOk = (name) => h.locator('.confirm').getByRole('button', { name, exact: true }).click();
  const home = async () => { await p.evaluate(() => openInProto('S19', 'hv', null, {})); await p.waitForTimeout(150); };

  ok('015 deep link #S19 opens the HV role at S19 “Thi thử HSK”', (await scr(h)) === 'S19' && (await T(h.locator('.hv-head h1'))) === 'Thi thử HSK');
  const lv = (await h.getByRole('radiogroup', { name: 'Cấp HSK' }).getByRole('radio').allInnerTexts()).map(norm);
  ok('S19 level picker HSK 1–6 + HSK 7–9, HSK 1 preselected (015 · AC-2.1)', lv.join('|') === 'HSK 1|HSK 2|HSK 3|HSK 4|HSK 5|HSK 6|HSK 7–9' && (await h.getByRole('radio', { name: 'HSK 1' }).getAttribute('aria-checked')) === 'true', lv.join('|'));
  const cards = await T(h.locator('.mk-types'));
  ok('S19 three type cards with published counts “n câu hỏi / n bài kiểm tra / n đề” + “Thống kê lỗi sai” (015 · AC-2.3)', /Luyện theo dạng \d+ câu hỏi/.test(cards) && /Kiểm tra cuối chương \d+ bài kiểm tra/.test(cards) && /Đề thi thử \d+ đề/.test(cards) && (await h.getByRole('button', { name: 'Thống kê lỗi sai' }).count()) === 1, cards);
  ok('S19 “Lịch sử làm bài”: 6 past attempts, newest first, with score, “Đạt”/“Chưa đạt” and “Nộp tự động” (015 · AC-12.3)', (await h.locator('.mk-hrow').count()) === 6 && (await T(h.locator('.mk-hrow').first())).includes('Kiểm tra cuối chương 3') && (await T(h.locator('.mk-hrow', { hasText: '05/10/2026' }))).includes('Nộp tự động'));
  await h.locator('.mk-hf').getByRole('button', { name: 'Đề thi thử' }).click();
  ok('history filter “Đề thi thử” → 2 rows', (await h.locator('.mk-hrow').count()) === 2);
  await h.getByRole('radio', { name: 'HSK 2' }).click();
  ok('HSK 2 (no content): each card “Chưa có nội dung cho HSK 2.” and empty history (015 · AC-2.5, AC-12.5)', (await h.getByText('Chưa có nội dung cho HSK 2.').count()) === 3 && (await h.getByText('Bạn chưa có lượt làm nào ở HSK 2.').count()) === 1);
  await h.getByRole('radio', { name: 'HSK 1' }).click();

  /* Luyện theo dạng: setup → “Chỉ có n câu” → Kiểm tra → Tạm dừng → conflict dialog → Tiếp tục lượt cũ → Nộp bài */
  await h.locator('.mk-type', { hasText: 'Luyện theo dạng' }).click();
  ok('“Luyện theo dạng” setup: skills, “Tất cả dạng”, 10/20/30, “Bắt đầu luyện” (015 · AC-3.1)', (await h.getByRole('radiogroup', { name: 'Kỹ năng' }).getByRole('radio').count()) === 5 && (await h.getByRole('radio', { name: 'Tất cả dạng' }).getAttribute('aria-checked')) === 'true' && (await h.getByRole('group', { name: 'Số câu' }).getByRole('button').allInnerTexts()).join('|') === '10|20|30');
  await h.getByRole('radio', { name: /^Ngữ pháp/ }).click(); await h.getByRole('button', { name: 'Bắt đầu luyện' }).click();
  ok('practice attempt opens at Câu 1/5 with “Chỉ có 5 câu cho lựa chọn này.”, elapsed time, “Tạm dừng”, “Bỏ lượt”, no countdown (015 · AC-3.4, AC-6.1)', (await h.getByText('Chỉ có 5 câu cho lựa chọn này.').count()) === 1 && (await T(h.locator('.mk-dobar'))).includes('Câu 1/5') && (await h.locator('[data-mk-el]').count()) === 1 && (await h.locator('[data-mk-timer]').count()) === 0 && (await h.getByRole('button', { name: 'Tạm dừng' }).count()) === 1 && (await h.getByRole('button', { name: 'Bỏ lượt' }).count()) === 1);
  ok('“Kiểm tra” disabled until the question has an answer; no answer key shown (015 · AC-6.3, AC-5.3)', (await h.getByRole('button', { name: 'Kiểm tra' }).isDisabled()) && (await h.getByText('Đáp án đúng').count()) === 0);
  await h.locator('.q-card .opt').first().click(); await h.getByRole('button', { name: 'Kiểm tra' }).click();
  const fb = await T(h.locator('.mk-fb'));
  ok('“Kiểm tra” grades + locks the question: result, “Đáp án đúng:”, “Giải thích:” (015 · AC-6.3)', /^(Đúng|Sai|Đúng một phần)/.test(fb) && fb.includes('Đáp án đúng:') && fb.includes('Giải thích:') && (await h.locator('.q-card .opt').first().getAttribute('aria-disabled')) === 'true', fb);
  await h.getByRole('button', { name: 'Tạm dừng' }).click();
  ok('“Tạm dừng” → S19 “Đang làm dở”: “Đang tạm dừng · 1/5 câu đã trả lời” + “Tiếp tục” (015 · AC-2.4, AC-6.2)', (await scr(h)) === 'S19' && (await T(h.locator('.mk-doing'))).includes('Đang tạm dừng · 1/5 câu đã trả lời') && (await h.locator('.mk-doing').getByRole('button', { name: 'Tiếp tục' }).count()) === 1);
  await h.locator('.mk-type', { hasText: 'Luyện theo dạng' }).click(); await h.getByRole('button', { name: 'Bắt đầu luyện' }).click();
  const dlg = await T(h.locator('.sheet'));
  ok('second practice at the same level → “Bạn có một lượt luyện chưa xong (1/5 câu đã trả lời).” + “Tiếp tục lượt cũ” / “Bỏ lượt cũ, bắt đầu mới” (015 · AC-3.5)', dlg.includes('Bạn có một lượt luyện chưa xong (1/5 câu đã trả lời).') && dlg.includes('Tiếp tục lượt cũ') && dlg.includes('Bỏ lượt cũ, bắt đầu mới'), dlg);
  await h.getByRole('button', { name: 'Tiếp tục lượt cũ' }).click();
  ok('“Tiếp tục lượt cũ” → same attempt, checked question still locked with its result (015 · AC-5.5)', (await h.locator('.mk-fb').count()) === 1 && (await T(h.locator('.mk-dobar'))).includes('Câu 1/5'));
  await h.locator('.mk-dobar').getByRole('button', { name: 'Nộp bài' }).click();
  const c1 = await conf();
  ok('“Nộp bài” confirm: unfinished questions + “Sau khi nộp, lượt này được chấm và lưu vào lịch sử.” + Nộp bài / Làm tiếp (015 · AC-9.1)', c1.includes('Còn 4 câu chưa hoàn thành') && c1.includes('Sau khi nộp, lượt này được chấm và lưu vào lịch sử.') && c1.includes('Làm tiếp'), c1);
  await confirmOk('Nộp bài');
  const r1 = await T(h.locator('.mk-res'));
  ok('practice result S20: “Luyện Ngữ pháp · Tất cả dạng”, “n/100”, “x/5 câu đúng”, simulated-score line (015 · AC-10.2, AC-11.1)', (await scr(h)) === 'S20' && r1.includes('Luyện Ngữ pháp · Tất cả dạng') && /\d+\/100/.test(r1) && /\d+\/5 câu đúng/.test(r1) && r1.includes('Kết quả mô phỏng — không phải điểm thi HSK chính thức.'), r1);
  ok('practice result footer: “Luyện tiếp”, “Luyện lại câu sai”, “Về Thi thử HSK” (015 · AC-11.5)', (await h.getByRole('button', { name: 'Luyện tiếp' }).count()) === 1 && (await h.getByRole('button', { name: 'Luyện lại câu sai' }).count()) === 1 && (await h.getByRole('button', { name: 'Về Thi thử HSK' }).count()) === 1);

  /* Kiểm tra cuối chương without a time limit: Tạm dừng / Bỏ lượt, but no per-question “Kiểm tra” (AC-6.6) */
  await home(); await h.locator('.mk-type', { hasText: 'Kiểm tra cuối chương' }).click();
  ok('“Kiểm tra cuối chương” list: “Chương n · chủ đề”, “Không giới hạn thời gian”, “Chưa làm” / last score (015 · AC-4.1)', (await T(h.locator('.mk-test').first())).includes('Chương 1 · Chào hỏi') && (await T(h.locator('.mk-test').first())).includes('Không giới hạn thời gian') && (await T(h.locator('.mk-test').first())).includes('Chưa làm') && (await T(h.locator('.mk-test').nth(1))).includes('Gần nhất 71/100'));
  await h.locator('.mk-test').first().getByRole('button', { name: 'Bắt đầu' }).click(); await h.getByRole('button', { name: 'Bắt đầu làm bài' }).click();
  await h.locator('.q-card .opt').first().click();
  ok('untimed chapter test: elapsed time, “Tạm dừng”, “Bỏ lượt”, no “Kiểm tra” even after answering (015 · AC-6.1, AC-6.6)', (await h.locator('[data-mk-el]').count()) === 1 && (await h.getByRole('button', { name: 'Tạm dừng' }).count()) === 1 && (await h.getByRole('button', { name: 'Kiểm tra' }).count()) === 0);
  await h.getByRole('button', { name: 'Bỏ lượt' }).click(); await confirmOk('Bỏ lượt');
  ok('“Bỏ lượt” → back to S19, nothing in “Đang làm dở” or history (015 · AC-6.5)', (await scr(h)) === 'S19' && (await h.locator('.mk-doing').count()) === 0 && (await h.locator('.mk-hrow').count()) === 7);

  /* Đề thi thử: list → start screen (preload) → timed sections, exam audio → next section → submit */
  await home(); await h.locator('.mk-type', { hasText: 'Đề thi thử' }).click();
  const m1 = await T(h.locator('.mk-test', { hasText: 'Đề số 1' }));
  ok('“Đề thi thử” list: sections + counts, total time, “Điểm đạt 180/300”, best/latest score (015 · AC-4.2)', m1.includes('Nghe · 3 câu') && m1.includes('Tổng 15 phút') && m1.includes('Điểm đạt 180/300') && m1.includes('Cao nhất 233/300'), m1);
  await h.locator('.mk-test', { hasText: 'Đề số 1' }).getByRole('button', { name: 'Bắt đầu' }).click();
  const st = await T(h);
  ok('start screen: sections, total time, pass mark, clock + audio rules, “Nghe thử”, no question content (015 · AC-4.3–AC-4.5)', st.includes('Tổng thời gian 15 phút') && st.includes('Đồng hồ chạy liên tục kể cả khi bạn thoát ra hoặc mất kết nối. Không thể tạm dừng.') && st.includes('Âm thanh phát tự động như khi thi thật, không tạm dừng hay nghe lại được. Hãy dùng tai nghe.') && (await h.getByRole('button', { name: 'Nghe thử' }).count()) === 1 && (await h.locator('.q-card').count()) === 0);
  ok('“Bắt đầu làm bài” disabled while “Đang tải âm thanh… n%” (015 · AC-4.5)', (await h.getByRole('button', { name: 'Bắt đầu làm bài' }).isDisabled()) && /Đang tải âm thanh… \d+%/.test(st));
  await p.waitForFunction(() => { const b = [...document.querySelectorAll('[data-frame="hv"] .hv-foot button')].find((x) => x.textContent.includes('Bắt đầu làm bài')); return b && !b.disabled; }, null, { timeout: 6000 });
  await h.getByRole('button', { name: 'Bắt đầu làm bài' }).click();
  const tt = norm(await h.locator('[data-mk-tt]').innerText()); const bar0 = await T(h.locator('.mk-dobar'));
  ok('mock attempt: section countdown ≤ 05:00, “Phần 1/3 · Nghe”, “Câu 1/10”, no “Tạm dừng” / “Bỏ lượt” / “Kiểm tra” (015 · AC-7.1, AC-7.3, AC-6.6)', /^0[45]:\d\d$/.test(tt) && bar0.includes('Phần 1/3 · Nghe') && bar0.includes('Câu 1/10') && (await h.getByRole('button', { name: 'Tạm dừng' }).count()) === 0 && (await h.getByRole('button', { name: 'Bỏ lượt' }).count()) === 0 && (await h.getByRole('button', { name: 'Kiểm tra' }).count()) === 0, tt + ' ' + bar0);
  ok('exam audio: “Đang phát: câu 1 · lần 1/2”, no player controls, questions whose audio has not started are locked (015 · AC-8.1, AC-8.2)', (await T(h.locator('.mk-playbar'))).includes('Đang phát: câu 1 · lần 1/2') && (await h.locator('.q-card input[type="range"]').count()) === 0 && (await h.locator('.qn').nth(1).getAttribute('aria-disabled')) === 'true');
  await h.locator('.q-card .opt').first().click(); await p.waitForTimeout(2300);
  ok('autosave “Đã lưu lúc HH:mm:ss”; sub-questions numbered “1.1” (015 · AC-5.4, AC-5.2)', /Đã lưu lúc \d\d:\d\d:\d\d/.test(await h.locator('[data-save]').innerText()) && (await T(h.locator('.q-card'))).includes('1.1'));
  await h.locator('.mk-dobar').getByRole('button', { name: 'Sang phần tiếp theo' }).click();
  const c2 = await conf();
  ok('“Sang phần tiếp theo” confirm: “Bạn sẽ không thể quay lại phần Nghe. Thời gian còn lại của phần này không được cộng sang phần sau.” (015 · AC-7.4)', c2.includes('Bạn sẽ không thể quay lại phần Nghe. Thời gian còn lại của phần này không được cộng sang phần sau.'), c2);
  await confirmOk('Sang phần tiếp theo');
  ok('next section starts at once: “Phần 2/3 · Đọc hiểu”, new 06:00 clock (015 · AC-7.3)', (await T(h.locator('.mk-dobar'))).includes('Phần 2/3 · Đọc hiểu') && /^0[56]:\d\d$/.test(norm(await h.locator('[data-mk-tt]').innerText())));
  await h.locator('.mk-dobar').getByRole('button', { name: 'Nộp bài' }).click();
  const c3 = await conf();
  ok('mock “Nộp bài” confirm adds “Các phần chưa làm sẽ được tính 0 điểm.” (015 · AC-9.1)', c3.includes('Các phần chưa làm sẽ được tính 0 điểm.'), c3);
  await confirmOk('Nộp bài');
  const r2 = await T(h.locator('.mk-res'));
  ok('mock result: “Nghe x/100 · Đọc hiểu x/100 · Sắp xếp câu x/100”, total “x/300”, “Chưa đạt” + “Điểm đạt: 180/300” (015 · AC-10.3, AC-10.4, AC-11.1)', /Nghe \d+\/100/.test(r2) && /Đọc hiểu \d+\/100/.test(r2) && /Sắp xếp câu 0\/100/.test(r2) && /\d+\/300/.test(r2) && r2.includes('Chưa đạt') && r2.includes('Điểm đạt: 180/300'), r2);
  const segs = (await h.getByRole('group', { name: 'Lọc câu' }).getByRole('button').allInnerTexts()).map(norm);
  ok('“Xem lại từng câu” grouped by section with filters “Tất cả (10)”, “Câu sai (n)”, “Chưa trả lời (n)” (015 · AC-11.2, AC-11.3)', segs[0] === 'Tất cả (10)' && /^Câu sai \(\d+\)$/.test(segs[1]) && /^Chưa trả lời \(\d+\)$/.test(segs[2]) && (await h.getByText('Phần 1 · Nghe').count()) === 1, segs.join('|'));
  await h.getByRole('group', { name: 'Lọc câu' }).getByRole('button', { name: /^Chưa trả lời/ }).click();
  const nb = +/\((\d+)\)/.exec(segs[2])[1];
  ok('filter “Chưa trả lời” shows only those questions', (await h.locator('.mk-rv').count()) === nb);
  await h.getByRole('group', { name: 'Lọc câu' }).getByRole('button', { name: /^Tất cả/ }).click();
  const rvL = await T(h.locator('.mk-rv').first());
  ok('listening question review: player, “Lời thoại”, “Bạn trả lời:”, “Đáp án đúng:”, “Giải thích:” (015 · AC-11.4)', rvL.includes('Lời thoại') && rvL.includes('Bạn trả lời:') && rvL.includes('Đáp án đúng:') && rvL.includes('Giải thích:') && (await h.locator('.mk-rv').first().getByRole('button', { name: /Phát/ }).count()) === 1);
  await h.getByRole('button', { name: 'Thêm từ sai vào bộ từ' }).click();
  ok('“Thêm từ sai vào bộ từ” → my decks + “Tạo bộ mới” (015 · AC-16.2)', (await h.locator('.sheet').getByRole('radio', { name: /Từ đi chợ/ }).count()) === 1 && (await h.locator('.sheet').getByRole('radio', { name: /Từ bài 3/ }).count()) === 1 && (await h.locator('.sheet').getByRole('radio', { name: 'Tạo bộ mới' }).count()) === 1);
  await h.locator('.sheet').getByRole('radio', { name: 'Tạo bộ mới' }).click();
  ok('“Tạo bộ mới” suggests “Từ sai · HSK 1”', (await h.locator('.sheet input.inp').inputValue()) === 'Từ sai · HSK 1');
  await h.locator('.sheet').getByRole('button', { name: 'Thêm vào bộ' }).click();
  const tw = await toastHv();
  ok('“Đã thêm x từ vào bộ Từ sai · HSK 1.” (015 · AC-16.3)', /Đã thêm \d+ từ vào bộ Từ sai · HSK 1\./.test(tw), tw);
  await h.getByRole('button', { name: 'Thêm từ sai vào bộ từ' }).click(); await h.locator('.sheet').getByRole('radio', { name: /Từ sai · HSK 1/ }).click(); await h.locator('.sheet').getByRole('button', { name: 'Thêm vào bộ' }).click();
  const tw2 = await toastHv();
  ok('adding again → “Đã thêm 0 từ … n từ đã có trong bộ.” (no duplicates)', /Đã thêm 0 từ vào bộ Từ sai · HSK 1\. \d+ từ đã có trong bộ\./.test(tw2), tw2);
  await h.getByRole('tab', { name: 'Thống kê lỗi sai' }).click();
  ok('attempt “Thống kê lỗi sai”: by skill, by question type, by grammar/vocab point, “x/y câu sai” + correct rate (015 · AC-14.2)', (await h.locator('.mk-gtbl').count()) === 3 && /\d+\/\d+ câu sai/.test(await T(h.locator('.mk-gtbl').first())) && (await T(h.locator('.mk-stwrap'))).includes('Theo điểm ngữ pháp / từ vựng'));

  /* older version + Luyện lại câu sai (one question withdrawn from the bank) */
  await p.evaluate(() => openInProto('S20', 'hv', null, { att: 'h-m1a' }));
  ok('attempt on an older version: “Đề này đã được cập nhật sau lượt làm của bạn. Kết quả được giữ theo phiên bản bạn đã làm.” + “Nộp tự động” (015 · AC-13.4)', (await h.getByText('Đề này đã được cập nhật sau lượt làm của bạn. Kết quả được giữ theo phiên bản bạn đã làm.').count()) === 1 && (await T(h.locator('.mk-res'))).includes('Nộp tự động'));
  await h.getByRole('button', { name: 'Luyện lại câu sai' }).click();
  ok('“Luyện lại câu sai” → practice “Luyện lại câu sai · Đề số 1” with “1 câu không còn trong kho nên đã được bỏ qua.” and “Kiểm tra” (015 · AC-15.1, AC-15.2)', (await scr(h)) === 'S19' && (await T(h.locator('.hv-head h1'))).includes('Luyện lại câu sai · Đề số 1') && (await h.getByText('1 câu không còn trong kho nên đã được bỏ qua.').count()) === 1 && (await h.getByRole('button', { name: 'Kiểm tra' }).count()) === 1);
  ok('practice listening: player with “Phát”, seek bar and “0,75×” / “1×”, no auto-play (015 · AC-8.6)', (await h.locator('.q-card .mk-player').count()) === 1 && (await h.locator('.q-card input[type="range"]').count()) === 1 && (await h.getByRole('group', { name: 'Tốc độ phát' }).getByRole('button').allInnerTexts()).map(norm).join('|') === '0,75×|1×' && (await h.locator('.mk-playbar').count()) === 0);

  /* aggregate statistics */
  await home(); await h.getByRole('button', { name: 'Thống kê lỗi sai' }).click();
  const sv = await T(h);
  ok('S19 “Thống kê lỗi sai” → S20 aggregate: type filter, “30 ngày gần nhất” / “Tất cả”, “Điểm yếu” with “Sai x/y” + “Luyện” (015 · AC-14.3, AC-14.4)', (await scr(h)) === 'S20' && sv.includes('30 ngày gần nhất') && /Sai \d+\/\d+/.test(await T(h.locator('.mk-weak li').first())) && (await h.locator('.mk-weak li').first().getByRole('button', { name: 'Luyện' }).count()) === 1);
  ok('“Xu hướng”: skill-rate chart with legend + total-score chart with the pass line (015 · AC-14.5)', (await h.locator('svg.mk-chart').count()) === 2 && (await h.locator('.mk-legend span').count()) >= 3 && (await h.locator('svg.mk-chart .mk-reft').count()) === 1);
  await h.getByRole('button', { name: 'Xem dạng bảng' }).first().click();
  ok('“Xem dạng bảng” shows the same numbers as a table (015 · AC-14.5)', (await h.locator('table.mk-ttbl').count()) === 1 && (await h.locator('svg.mk-chart').count()) === 1);
  const before = /tính trên (\d+) lượt/.exec(norm(await h.locator('.mk-sthead').innerText()))[1];
  await h.getByRole('group', { name: 'Khoảng thời gian' }).getByRole('button', { name: 'Tất cả' }).click();
  const after = /tính trên (\d+) lượt/.exec(norm(await h.locator('.mk-sthead').innerText()))[1];
  ok('range “Tất cả” includes attempts older than 30 days', +after === +before + 1, before + '→' + after);
  await h.locator('.mk-weak li').first().getByRole('button', { name: 'Luyện' }).click();
  ok('“Luyện” on a weak point with an unfinished practice → AC-3.5 dialog', (await h.locator('.sheet').getByRole('button', { name: 'Bỏ lượt cũ, bắt đầu mới' }).count()) === 1);
  await h.locator('.sheet').getByRole('button', { name: 'Bỏ lượt cũ, bắt đầu mới' }).click();
  const c4 = await conf();
  ok('dropping asks “Bỏ lượt này? Câu trả lời sẽ bị xóa và không được lưu vào lịch sử.” (015 · AC-6.5)', c4.includes('Bỏ lượt này? Câu trả lời sẽ bị xóa và không được lưu vào lịch sử.'), c4);
  await confirmOk('Bỏ lượt cũ, bắt đầu mới');
  ok('→ new practice “Luyện điểm yếu · …” (015 · AC-15.4)', (await T(h.locator('.hv-head h1'))).startsWith('Luyện điểm yếu ·'));

  /* Kịch bản: auto-submit, audio preload failure, load error */
  const scn = async (label) => { await p.getByRole('button', { name: 'Hướng dẫn' }).click(); await p.locator('#guide [data-scn]', { hasText: label }).click(); await p.waitForTimeout(250); };
  await scn('Thi thử HSK: tua qua giờ kết thúc (nộp tự động)');
  ok('Kịch bản tua qua giờ: “Hết giờ — bài đã được nộp tự động lúc HH:mm” + “Xem kết quả” (015 · AC-9.4, AC-9.5)', /Hết giờ — bài đã được nộp tự động lúc \d\d:\d\d/.test(await T(h)) && (await h.getByRole('button', { name: 'Xem kết quả' }).count()) === 1);
  await h.getByRole('button', { name: 'Xem kết quả' }).click();
  ok('→ S20 with “Nộp tự động”', (await scr(h)) === 'S20' && (await T(h.locator('.mk-res'))).includes('Nộp tự động'));
  await scn('Thi thử HSK: mất kết nối khi làm bài');
  await h.locator('.q-card .opt').first().click();
  { const bt = await T(h.locator('.banner.danger')); ok('offline: “Mất kết nối — câu trả lời chưa được lưu”, unsaved count, “Đồng hồ vẫn chạy.” (015 · AC-5.7)', bt.includes('Mất kết nối — câu trả lời chưa được lưu') && bt.includes('1 câu chưa lưu') && bt.includes('Đồng hồ vẫn chạy.'), bt); }
  await h.locator('.mk-dobar').getByRole('button', { name: 'Nộp bài' }).click(); await confirmOk('Nộp bài');
  ok('submit while offline: “Chưa nộp được bài do mất kết nối. Bài làm của bạn vẫn được giữ lại.” + “Thử lại” (015 · AC-9.7)', (await h.getByText('Chưa nộp được bài do mất kết nối. Bài làm của bạn vẫn được giữ lại.').count()) === 1 && (await scr(h)) === 'S19');
  await h.locator('.hv-head').getByRole('button', { name: 'Đóng' }).click();
  ok('leaving with unsaved answers warns “Một số câu trả lời chưa được lưu. Rời trang có thể làm mất chúng.” (015 · AC-5.8)', (await conf()).includes('Một số câu trả lời chưa được lưu. Rời trang có thể làm mất chúng.'));
  await h.locator('.confirm').getByRole('button', { name: 'Ở lại' }).click(); await h.getByRole('button', { name: 'Kết nối lại (mô phỏng)' }).click(); await p.waitForTimeout(2300);
  ok('reconnect → pending answers saved “Đã lưu lúc …”', /Đã lưu lúc/.test(await h.locator('[data-save]').innerText()));
  await scn('Thi thử HSK: mở ở thiết bị khác');
  ok('opened elsewhere: “Bài đang được làm ở thiết bị hoặc cửa sổ khác”, answers locked (015 · AC-5.6)', (await T(h.locator('.banner.warn'))).includes('Bài đang được làm ở thiết bị hoặc cửa sổ khác') && (await h.locator('.q-card .opt').first().getAttribute('aria-disabled')) === 'true');
  await h.getByRole('button', { name: 'Làm bài ở đây' }).click();
  await scn('Thi thử HSK: âm thanh không phát được');
  ok('audio failure: “Không phát được âm thanh.” + “Thử lại”, clock keeps running (015 · AC-8.5)', (await T(h.locator('.mk-audfail'))).includes('Không phát được âm thanh.') && (await h.locator('[data-mk-timer]').count()) === 1);
  await h.locator('.mk-audfail').getByRole('button', { name: 'Thử lại' }).click();
  await scn('Thi thử HSK: thêm từ vào bộ từ thất bại');
  await h.getByRole('button', { name: 'Thêm từ sai vào bộ từ' }).click(); await h.locator('.sheet').getByRole('button', { name: 'Thêm vào bộ' }).click();
  ok('adding words fails → “Không thêm được từ vào bộ từ. Vui lòng thử lại.” + reason, nothing reported as added (015 · AC-16.5)', (await toastHv()).includes('Không thêm được từ vào bộ từ. Vui lòng thử lại.') && !(await toastHv()).includes('Đã thêm'));
  await p.evaluate(() => { D.tuhoc015.wordFail = false; });
  await scn('Thi thử HSK: tải âm thanh thất bại');
  ok('preload failure: “Không tải được âm thanh của đề. Kiểm tra kết nối và thử lại.” + “Thử lại”, start disabled (015 · AC-4.6)', (await h.getByText('Không tải được âm thanh của đề. Kiểm tra kết nối và thử lại.').count()) === 1 && (await h.getByRole('button', { name: 'Thử lại' }).count()) === 1 && (await h.getByRole('button', { name: 'Bắt đầu làm bài' }).isDisabled()));
  await h.getByRole('button', { name: 'Thử lại' }).click();
  await scn('Thi thử HSK: lỗi tải dữ liệu');
  ok('load error: “Không tải được dữ liệu. Vui lòng thử lại.” + “Thử lại”, no zero counts (015 · AC-2.7)', (await h.getByText('Không tải được dữ liệu. Vui lòng thử lại.').count()) === 1 && (await h.locator('.mk-type').count()) === 0);
  await p.locator('#view-hv .scaler').screenshot({ path: SP + '/v14-015-s19-error.png' });

  /* V15: Tự học is for HV only — the GV frame gets A05 (an HV attempt too, AC-17.2) */
  await p.evaluate(() => { enterRole('gv', 'S19'); });
  await p.waitForTimeout(200);
  ok('015 V15: GV opening S19 → A05 in the GV shell', (await scr(g)) === 'A05' && (await g.locator('.gv-side').count()) === 1);
  await p.evaluate(() => openInProto('S20', 'gv', null, { att: 'h-m1b' }));
  ok('GV opening an HV attempt → A05 “Không tìm thấy nội dung bạn yêu cầu.” (015 · AC-17.2)', (await g.getByText('Không tìm thấy nội dung bạn yêu cầu.').count()) === 1 && !(await T(g)).includes('233/300'));
  await p.goto(URL + '#S20', { waitUntil: 'load' }); await p.waitForTimeout(250);
  ok('deep link #S20 opens the HV role at S20', (await scr(h)) === 'S20' && (await p.locator('#view-hv').isVisible()));
  await p.close();
}

/* ════════ v15 016 kho tự học của GV (T23–T27) — replaces the v14 016 “Quản trị nội dung” checks ════════ */
/* ---------- V15 (22/10/2026): two roles only; the self-study library is the GV's “Kho tự học” (T23–T27, GV shell),
   pre-loaded with “Bộ nội dung mẫu HSK”; Tự học (S13–S20) is HV-only; T24 vocabulary feeds the HV's S14.
   Call: await STEP('v15 016 kho tự học (T23–T27)', () => verifyKho({ browser, URL, ok, norm, watch, SP }));
   Each sub-flow uses a fresh page (mock data resets on load). */
async function verifyKho({ browser, URL, ok, norm, watch, SP }) {
  const newPage = async (hash) => { const p = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); watch(p); p.setDefaultTimeout(6000); await p.goto(URL + (hash || ''), { waitUntil: 'load' }); await p.waitForTimeout(300); return p; };
  const T = async (l) => norm(await l.innerText());
  const open = (p, id, params, ui) => p.evaluate(([a, b, c]) => { enterRole('gv', a); openInProto(a, 'gv', null, b, c); }, [id, params || {}, ui || null]);
  const hvOpen = (p, id, params, ui) => p.evaluate(([a, b, c]) => { enterRole('hv', a); openInProto(a, 'hv', null, b, c); }, [id, params || {}, ui || null]);
  const scr = (q) => q.getAttribute('data-screen');
  const toast = async (p) => norm(await p.locator('[data-toasts="gv"]').innerText());
  const LIB = [['T23', 'Tổng quan', '/gv/kho-tu-hoc'], ['T24', 'Từ vựng tự học', '/gv/kho-tu-hoc/tu-vung'], ['T25', 'Nghe & hội thoại', '/gv/kho-tu-hoc/nghe-hoi-thoai'], ['T26', 'Đề thi thử HSK', '/gv/kho-tu-hoc/de-thi-thu'], ['T27', 'Chữ Hán & bộ thủ', '/gv/kho-tu-hoc/chu-han']];

  /* 1. two roles, GV sidebar “Kho tự học”, T23–T27 in the GV shell, deep links */
  let p = await newPage();
  const land = await T(p.locator('#landing'));
  ok('V15 role picker: exactly 2 roles — “Giáo viên”, “Học viên” (no “Quản trị nội dung”)', (await p.locator('#landing [data-role]').count()) === 2 && (await p.locator('.role-card').evaluateAll((els) => els.map((e) => e.dataset.role))).join() === 'gv,hv'
    && !land.includes('Quản trị nội dung') && (await p.locator('.lib-rolecard, #view-qt, [data-frame="qt"]').count()) === 0, land);
  ok('V15 role cards: GV “… kho tự học …”, HV “… tự học …”', (await T(p.locator('.role-card[data-role="gv"]'))).includes('kho tự học') && (await T(p.locator('.role-card[data-role="hv"]'))).includes('tự học'));
  await p.screenshot({ path: SP + '/v15-picker.png' });
  await open(p, 'T01'); const q = p.locator('[data-frame="gv"]');
  ok('V15 GV sidebar: Dashboard | Lớp học | Giáo trình | Bài thi | Học viên | Kho tự học | Tài khoản — no “Tự học”', (await q.locator('.gv-nav button').allInnerTexts()).map(norm).join('|') === 'Dashboard|Lớp học|Giáo trình|Bài thi|Học viên|Kho tự học|Tài khoản');
  await q.locator('.gv-nav').getByRole('button', { name: 'Kho tự học' }).click();
  ok('V15 sidebar “Kho tự học” → T23 in the GV shell, item current, crumb “Kho tự học” (016 · AC-1.1)', (await scr(q)) === 'T23' && (await q.locator('.gv-side').count()) === 1 && (await T(q.locator('.gv-nav [aria-current="page"]'))) === 'Kho tự học' && (await T(q.locator('.crumbs'))) === 'Kho tự học');
  ok('V15 T23 sub-navigation: Tổng quan · Từ vựng tự học · Nghe & hội thoại · Đề thi thử HSK · Chữ Hán & bộ thủ, current “Tổng quan”', (await q.locator('.v15-libnav button').allInnerTexts()).map(norm).join('|') === LIB.map((x) => x[1]).join('|') && (await T(q.locator('.v15-libnav [aria-current="page"]'))) === 'Tổng quan');
  for (const [id, label, path] of LIB.slice(1).concat([LIB[0]])) {
    await q.locator('.v15-libnav').getByRole('button', { name: label, exact: true }).click(); await p.waitForTimeout(60);
    ok(`V15 sub-nav “${label}” → ${id} in the GV shell (sidebar “Kho tự học” current, URL ${path})`, (await scr(q)) === id && (await q.locator('.gv-side').count()) === 1 && (await T(q.locator('.gv-nav [aria-current="page"]'))) === 'Kho tự học'
      && (await T(q.locator('.v15-libnav [aria-current="page"]'))) === label && (await T(p.locator('[data-url="gv"]'))) === 'sat.example' + path, `${await scr(q)} · ${await T(p.locator('[data-url="gv"]'))}`);
  }
  const t23 = await T(q.locator('.gv-content'));
  ok('V15 T23: “Kho được khởi tạo từ Bộ nội dung mẫu HSK (2026.10) ngày 02/09/2026.”, own workspace library, edits only affect this workspace’s HV (016 · AC-15.8, AC-15.3)', t23.includes('Tổng quan kho tự học') && t23.includes('Kho được khởi tạo từ Bộ nội dung mẫu HSK (2026.10) ngày 02/09/2026.') && t23.includes('chỉ ảnh hưởng học viên') && t23.includes('Kho riêng của workspace'));
  ok('016 T23: 6 content rows × HSK 1–6 + “HSK 7–9” + Tổng (AC-13.1, AC-2.1)', (await q.locator('.lib-count tbody tr').count()) === 6 && (await q.locator('.lib-count thead th').allInnerTexts()).map(norm).join('|') === 'Loại nội dung|HSK 1|HSK 2|HSK 3|HSK 4|HSK 5|HSK 6|HSK 7–9|Tổng');
  ok('016 T23: “Cần xử lý” + “Thay đổi gần đây” + “Sử dụng 30 ngày qua” = anonymous counts of the workspace’s HV, no e-mail addresses (AC-13.3, AC-13.4)', t23.includes('Từ thiếu âm thanh') && t23.includes('Chữ chưa có dữ liệu') && t23.includes('Chữ lệch số nét') && t23.includes('Thay đổi gần đây') && t23.includes('Sử dụng 30 ngày qua')
    && t23.includes('Học viên đã dùng khu Tự học') && t23.includes('Chỉ số đếm tổng hợp của học viên trong workspace') && !/@/.test(t23));
  await p.locator('#view-gv .scaler').screenshot({ path: SP + '/v15-T23.png' });
  const nLv1 = await p.evaluate(() => D.lib016.words.filter((w) => w.lv === '1').length);
  await q.locator('tr[data-lib-count="word"] .lib-cell').first().locator('button').click();
  ok('016 T23 cell → T24 filtered on HSK 1 (starter set + own words) (AC-13.2)', (await scr(q)) === 'T24' && (await q.locator('[data-bind="fLv"]').inputValue()) === '1' && (await q.locator('.lib-tbl tbody tr').count()) === nLv1 && nLv1 >= 30, String(nLv1));
  await q.locator('.v15-libnav').getByRole('button', { name: 'Tổng quan' }).click();
  await q.getByRole('button', { name: 'Xem tất cả' }).click();
  ok('016 “Xem tất cả”: full history filtered by thao tác + khoảng ngày only (no performer filter in a one-GV workspace) (AC-13.3)', (await q.locator('.modal [data-bind="modal.v.by"]').count()) === 0 && (await q.locator('.modal [data-bind="modal.v.op"]').count()) === 1 && (await q.locator('.modal [data-bind="modal.v.from"]').count()) === 1 && (await q.locator('.modal .lib-recent-row').count()) > 20);
  await p.close();
  for (const [h, want] of [['#T24', 'T24'], ['#T27', 'T27'], ['#Q04', 'T26']]) {
    p = await newPage(h);
    ok(`V15 deep link ${h} opens the GV role at ${want}${h === '#Q04' ? ' (old Q link)' : ''}`, (await p.locator('[data-frame="gv"]').getAttribute('data-screen')) === want && (await p.locator('#view-gv').isVisible()) && (await p.locator('[data-frame="qt"]').count()) === 0);
    await p.close();
  }
  p = await newPage('#qt');
  ok('V15 old link #qt → role picker (no third role)', (await p.locator('#landing').isVisible()) && (await p.locator('[data-frame="qt"]').count()) === 0);
  await p.close();

  /* 2. T24 list, “Bộ mẫu”, search, editor validation, publish (REQ-3, REQ-4, REQ-12) */
  p = await newPage(); await open(p, 'T24'); let g = p.locator('[data-frame="gv"]');
  ok('V15 T24: starter-set words carry “Bộ mẫu”, the GV’s own draft 水果 does not', (await T(g.locator('tr[data-lib-row="w1"]'))).includes('Bộ mẫu') && (await T(g.locator('tr[data-lib-row="bw10"]'))).includes('Bộ mẫu') && !(await T(g.locator('tr[data-lib-row="w5"]'))).includes('Bộ mẫu') && (await T(g.locator('tr[data-lib-row="w5"]'))).includes('水果'));
  await g.locator('[data-bind="q"]').fill('nihao');
  ok('016 T24 search “nihao” → 你好 (AC-12.2)', (await g.locator('.lib-tbl tbody tr').count()) === 1 && (await T(g.locator('.lib-tbl tbody'))).includes('你好'));
  await g.locator('[data-bind="q"]').fill('zzz');
  ok('016 T24 no match → “Không có nội dung phù hợp.” + “Xóa bộ lọc” (AC-12.4)', (await T(g)).includes('Không có nội dung phù hợp.') && (await g.getByRole('button', { name: 'Xóa bộ lọc' }).count()) === 1);
  await g.getByRole('button', { name: 'Xóa bộ lọc' }).click();
  await g.locator('tr[data-lib-row="w5"] .check').click(); await g.locator('tr[data-lib-row="w6"] .check').click();
  await g.locator('.lib-bulk').getByRole('button', { name: 'Xuất bản', exact: true }).click();
  ok('016 bulk publish: “Đã xuất bản 1 mục. 1 mục chưa đủ điều kiện:” + reason (AC-3.4, AC-12.5)', (await T(g.locator('.modal'))).includes('Đã xuất bản 1 mục. 1 mục chưa đủ điều kiện:') && (await T(g.locator('.modal'))).includes('Vui lòng nhập nguồn / giấy phép.'));
  await g.locator('.modal-foot').getByRole('button', { name: 'Đóng' }).click();
  await g.getByRole('button', { name: 'Thêm từ' }).click();
  const lbls = (await g.locator('.lib-form .lbl').allInnerTexts()).map(norm).join('|');
  ok('016 “Thêm từ” → form with all AC-4.1 fields', ['Chữ Hán', 'Pinyin', 'Từ loại', 'Nghĩa tiếng Việt', 'Cách dùng', 'Cấp HSK', 'Chương', 'Thứ tự', 'Chủ đề', 'Âm thanh phát âm', 'Câu ví dụ', 'Nguồn / giấy phép'].every((l) => lbls.includes(l)), lbls);
  await g.locator('[data-bind="ed.han"]').fill('學'); await g.locator('[data-bind="ed.py"]').fill('xue2'); await g.locator('[data-bind="ed.src"]').click();
  ok('016 pinyin with tone numbers → tone marks on blur (AC-4.3)', (await g.locator('[data-bind="ed.py"]').inputValue()) === 'xué');
  await g.locator('.lib-edbar').getByRole('button', { name: 'Lưu', exact: true }).click();
  ok('016 traditional form rejected “Hãy dùng chữ giản thể: 學 → 学.” (AC-4.2)', (await T(g)).includes('Hãy dùng chữ giản thể: 學 → 学.'));
  await g.locator('[data-bind="ed.han"]').fill('你好'); await g.locator('[data-bind="ed.py"]').fill('nǐ hǎo');
  await g.locator('.lib-edbar').getByRole('button', { name: 'Lưu', exact: true }).click();
  ok('016 duplicate pair blocked + “Mở mục đã có” (AC-4.7)', (await T(g)).includes('Từ "你好 nǐ hǎo" đã có trong kho (HSK 1 · Đã xuất bản).') && (await g.getByRole('button', { name: 'Mở mục đã có' }).count()) === 1);
  await g.locator('[data-bind="ed.han"]').fill('行'); await g.locator('[data-bind="ed.py"]').fill('héng');
  ok('016 same Hanzi, other reading → warning only (AC-4.8)', (await T(g)).includes('Kho đã có 2 từ cùng chữ Hán với cách đọc khác:'));
  await g.locator('[data-bind="ed.han"]').fill('好'); await g.locator('[data-bind="ed.py"]').fill('hao');
  await g.getByRole('button', { name: 'Tính từ', exact: true }).click(); await g.locator('[data-bind="ed.means.0"]').fill('tốt'); await g.locator('[data-bind="ed.src"]').fill('Biên soạn nội bộ');
  await g.locator('.lib-edbar').getByRole('button', { name: 'Lưu', exact: true }).click();
  ok('016 new word saved as Nháp, by the GV, no “Bộ mẫu” (AC-3.1)', (await toast(p)).includes('Đã tạo mục ở trạng thái Nháp.') && (await T(g.locator('.lib-edbar'))).includes('Nháp') && !(await T(g.locator('.lib-edbar'))).includes('Bộ mẫu') && (await T(g.locator('.lib-edhead'))).includes('bởi Lưu Thị Lan'));
  await g.locator('.lib-edbar').getByRole('button', { name: 'Xuất bản', exact: true }).click();
  ok('016 publish → “Đã xuất bản”, no “Xóa” any more (AC-3.3, AC-3.8)', (await T(g.locator('.lib-edbar'))).includes('Đã xuất bản') && (await g.locator('.lib-edbar').getByRole('button', { name: 'Xóa' }).count()) === 0);
  await g.locator('[data-bind="ed.src"]').fill('');
  await g.locator('.lib-edbar').getByRole('button', { name: 'Lưu', exact: true }).click();
  ok('016 save that would break a published item is refused (AC-14.1 / AC-3.9)', (await T(g)).includes('Vui lòng nhập nguồn / giấy phép.'));
  await g.getByRole('tab', { name: /Lịch sử thay đổi/ }).click();
  ok('016 “Lịch sử thay đổi” tab: Tạo + Xuất bản, read-only (AC-14.3, AC-14.4)', (await T(g.locator('.lib-hist'))).includes('Xuất bản') && (await T(g.locator('.lib-hist'))).includes('Tạo') && (await T(g)).includes('chỉ đọc'));
  await open(p, 'T24', { w: 'w1' }, { etab: 'hist' });
  const hist1 = await T(g.locator('.lib-hist'));
  ok('V15 你好 history starts with the copy “Bộ nội dung mẫu HSK · 02/09/2026 08:00 · Sao từ Bộ nội dung mẫu HSK (2026.10)”, then the GV’s edit (016 · AC-14.2, AC-14.3, AC-15.2)', hist1.includes('Bộ nội dung mẫu HSK · 02/09/2026 08:00 · Sao từ Bộ nội dung mẫu HSK (2026.10)') && hist1.includes('Lưu Thị Lan · 20/10/2026 09:14 · Sửa'), hist1);
  await open(p, 'T24', { w: 'w1' });
  ok('V15 seeded word 你好: “Bộ mẫu” chip + Nguồn / giấy phép “Bộ nội dung mẫu HSK”', (await T(g.locator('.lib-edbar'))).includes('Bộ mẫu') && (await g.locator('[data-bind="ed.src"]').inputValue()) === 'Bộ nội dung mẫu HSK');
  await p.locator('#view-gv .scaler').screenshot({ path: SP + '/v15-T24-editor.png' });
  await open(p, 'T24', { w: 'w4' });
  ok('016 archived word: “Khôi phục”, no “Xóa” (AC-3.7, AC-3.8)', (await g.locator('.lib-edbar').getByRole('button', { name: 'Khôi phục' }).count()) === 1 && (await g.locator('.lib-edbar').getByRole('button', { name: 'Xóa' }).count()) === 0);
  await open(p, 'T24', { w: 'w999' });
  ok('016 unknown item → A05 “Không tìm thấy nội dung bạn yêu cầu.” in the GV shell (AC-1.3)', (await T(g)).includes('Không tìm thấy nội dung bạn yêu cầu.') && (await g.locator('.gv-side').count()) === 1);
  await p.close();

  /* 3. import + bulk audio (REQ-5, REQ-6) */
  p = await newPage(); await open(p, 'T24'); g = p.locator('[data-frame="gv"]');
  const rows0 = await g.locator('.lib-tbl tbody tr').count();
  await g.getByRole('button', { name: 'Nhập từ tệp' }).click();
  ok('016 “Nhập từ vựng” dialog: “Tải tệp mẫu” + batch source (AC-5.1)', (await g.getByRole('button', { name: 'Tải tệp mẫu' }).count()) === 1 && (await T(g.locator('.modal'))).includes('Nguồn / giấy phép của lô'));
  await g.getByRole('button', { name: /ghi-chu\.pdf/ }).click(); await g.getByRole('button', { name: 'Kiểm tra tệp' }).click();
  ok('016 wrong file type rejected (AC-5.2)', (await T(g.locator('.modal'))).includes('Tệp không hợp lệ:'));
  await g.getByRole('button', { name: /tu-vung-moi/ }).click(); await g.getByRole('button', { name: 'Kiểm tra tệp' }).click();
  ok('016 batch source required (AC-14.1)', (await T(g.locator('.modal'))).includes('Vui lòng nhập nguồn / giấy phép.'));
  await g.locator('[data-bind="modal.v.src"]').fill('Biên soạn nội bộ'); await g.getByRole('button', { name: 'Kiểm tra tệp' }).click();
  ok('016 progress in % while checking (AC-5.3)', /\d+%/.test(await T(g.locator('.modal'))));
  await p.waitForTimeout(2600);
  const rep = await T(g.locator('.modal'));
  ok('016 report: 2 hợp lệ / 2 lỗi / 2 trùng with row numbers and reasons (AC-5.3, AC-5.4)', /2 dòng hợp lệ/.test(rep) && /2 dòng lỗi/.test(rep) && /2 dòng trùng/.test(rep) && rep.includes('Trùng với kho') && rep.includes('Trùng với dòng 2') && (await g.locator('[data-imp-row]').count()) === 4);
  await g.getByRole('button', { name: 'Nhập 2 từ hợp lệ' }).click();
  ok('016 import → “Đã nhập 2 từ ở trạng thái Nháp.” (AC-5.6)', (await toast(p)).includes('Đã nhập 2 từ ở trạng thái Nháp.') && (await g.locator('.lib-tbl tbody tr').count()) === rows0 + 2, `${rows0} → ${await g.locator('.lib-tbl tbody tr').count()}`);
  await g.getByRole('button', { name: 'Tải âm thanh hàng loạt' }).click();
  const aud = await T(g.locator('.modal'));
  ok('016 bulk audio report groups + “Lưu 2 âm thanh” (AC-6.4)', ['Ghép được', 'Không tìm thấy từ', 'Nhiều từ cùng chữ Hán — cần ghi kèm pinyin', 'Từ đã có âm thanh', 'Tệp lỗi'].every((x) => aud.includes(x)) && (await g.getByRole('button', { name: 'Lưu 2 âm thanh' }).count()) === 1);
  await g.locator('.modal').getByRole('checkbox', { name: 'Thay âm thanh đã có' }).click();
  ok('016 “Thay âm thanh đã có” → 3 files match (AC-6.5)', (await g.getByRole('button', { name: 'Lưu 3 âm thanh' }).count()) === 1);
  await p.close();

  /* 4. T25 listening + role-play, T26 versions, T27 stroke data */
  p = await newPage(); await open(p, 'T25', { tab: 'role', r: 'r1' }); g = p.locator('[data-frame="gv"]');
  await g.locator('.lib-edbar').getByRole('button', { name: 'Xuất bản', exact: true }).click();
  ok('016 role-play publish conditions listed (AC-9.3)', (await T(g)).includes('Lời thoại 5 chưa có âm thanh.'));
  await g.locator('.lib-edbar').getByRole('button', { name: 'Xem thử' }).click();
  ok('016 “Xem thử” plays line by line with “Tạm dừng” / “Phát lại” (AC-9.4)', (await T(g.locator('.modal'))).includes('Lời thoại 1 / 8') && (await g.getByRole('button', { name: 'Phát lại' }).count()) === 1);
  await g.locator('.modal-foot').getByRole('button', { name: 'Đóng', exact: true }).click();
  await open(p, 'T25', { tab: 'listen', l: 'l3' });
  await g.locator('.lib-edbar').getByRole('button', { name: 'Xuất bản', exact: true }).click();
  ok('016 listening publish reasons “Chưa có âm thanh.” / “Câu hỏi 2 chưa có giải thích.” (AC-8.3)', (await T(g)).includes('Chưa có âm thanh.') && (await T(g)).includes('Câu hỏi 2 chưa có giải thích.'));
  await open(p, 'T26', {});
  ok('016 T26 list shows versions and “Đã có người làm” (AC-12.1, AC-11.6)', (await T(g)).includes('Phiên bản 1') && (await T(g)).includes('Đã có người làm · 40 lượt'));
  await open(p, 'T26', { t: 't1' });
  ok('016 T26 test with attempts is read-only until “Sửa” (AC-11.2)', (await g.locator('fieldset.lib-fs[disabled]').count()) === 1);
  await g.getByRole('button', { name: 'Sửa', exact: true }).click();
  ok('016 “Sửa” → Phiên bản 2 Nháp + message (AC-11.2)', (await T(g)).includes('Đề đã có người làm. Bạn đang sửa phiên bản 2; phiên bản 1 vẫn được dùng cho tới khi bạn xuất bản phiên bản mới.') && (await g.locator('tr[data-ver]').count()) === 2);
  await g.locator('[data-bind="ed.time"]').fill('20'); await g.locator('.lib-edbar').getByRole('button', { name: 'Lưu', exact: true }).click();
  ok('016 section times above the test time are refused (AC-10.2)', (await T(g)).includes('Tổng thời gian các phần (25 phút) vượt thời gian làm bài (20 phút).'));
  await g.locator('[data-bind="ed.time"]').fill('90');
  ok('016 live totals “Tổng: 9 câu · 10 điểm” (AC-10.5)', (await T(g.locator('.lib-totals'))).includes('Tổng: 9 câu · 10 điểm'));
  await g.getByRole('button', { name: 'Xuất bản phiên bản 2' }).click();
  ok('016 publishing v2 archives v1 (AC-11.4)', (await T(g.locator('tr[data-ver="1"]'))).includes('Lưu trữ') && (await T(g.locator('tr[data-ver="2"]'))).includes('Đã xuất bản'));
  await g.getByRole('button', { name: 'Xem trước' }).click();
  await g.locator('.modal').getByRole('button', { name: 'Hiện đáp án' }).first().click();
  ok('016 “Xem trước”: try answers + “Hiện đáp án”, nothing saved (AC-10.7)', (await T(g.locator('.modal'))).includes('Đáp án:') && (await T(g.locator('.modal'))).includes('không lưu kết quả'));
  await g.locator('.modal-foot').getByRole('button', { name: 'Đóng', exact: true }).click();
  await open(p, 'T27', { c: 'c6' });
  await g.locator('.lib-edbar').getByRole('button', { name: 'Xuất bản', exact: true }).click();
  ok('016 Hanzi stroke mismatch blocks publishing (AC-7.6)', (await T(g)).includes('Dữ liệu nét có 4 nét nhưng Số nét là 5.'));
  await open(p, 'T27', {});
  ok('016 T27: “Chữ chưa có dữ liệu” per level + create drafts (AC-7.2)', (await T(g.locator('.lib-nodata'))).includes('Tạo mục nháp cho các chữ này'));
  await g.getByRole('tab', { name: /Bộ thủ/ }).click();
  ok('016 T27 “Bộ thủ” tab: fixed list, editable names, no add/delete (AC-7.7)', (await g.locator('tr[data-rad]').count()) >= 10 && (await g.getByRole('button', { name: /Thêm bộ/ }).count()) === 0);
  await p.close();

  /* 5. Kịch bản: conflict in another window (AC-1.5), starter set still being copied (AC-15.5), fewer than 5 HV (AC-13.4); HV on T23–T27 (001 · AC-20.10) */
  p = await newPage(); await open(p, 'T23'); g = p.locator('[data-frame="gv"]');
  await p.evaluate(() => { const s = SCN.gv.find((x) => x[0].startsWith('Kho tự học: 你好 vừa được lưu')); s[3](); openInProto(s[1], 'gv', null, s[2]); });
  await g.locator('.lib-edbar').getByRole('button', { name: 'Lưu', exact: true }).click();
  ok('016 saved meanwhile in another window → “Nội dung này vừa được cập nhật lúc 21:12 ở một cửa sổ khác. …” + “Tải lại” (AC-1.5)', (await T(g)).includes('Nội dung này vừa được cập nhật lúc 21:12 ở một cửa sổ khác. Tải lại để xem bản mới nhất trước khi lưu.') && (await g.getByRole('button', { name: 'Tải lại' }).count()) === 1);
  const scn = (label) => p.evaluate((l) => { const s = SCN.gv.find((x) => x[0].startsWith(l)); if (s[3]) s[3](); openInProto(s[1], 'gv', null, s[2], s[4]); }, label);
  await scn('Kho tự học: đang chuẩn bị');
  ok('016 copy not finished: T23 shows “Đang chuẩn bị Bộ nội dung mẫu HSK cho kho tự học của bạn…” instead of the library (AC-15.5)', (await T(g.locator('.gv-content'))).includes('Đang chuẩn bị Bộ nội dung mẫu HSK cho kho tự học của bạn…') && (await g.locator('.lib-count').count()) === 0);
  await open(p, 'T24');
  ok('016 copy not finished: T24 has no list and no “Thêm từ” / “Nhập từ tệp” (AC-15.5)', (await g.locator('.lib-tbl').count()) === 0 && (await g.getByRole('button', { name: 'Thêm từ' }).count()) === 0 && (await g.getByRole('button', { name: 'Nhập từ tệp' }).count()) === 0);
  await hvOpen(p, 'S14');
  ok('016 copy not finished: the HV gets no library word yet (AC-15.5)', !(await T(p.locator('[data-frame="hv"] .hv-body'))).includes('HSK 1 27 từ'));
  await open(p, 'T23'); await g.getByRole('button', { name: 'Mô phỏng: hoàn tất' }).click();
  ok('016 copy finished → T23 shows the library again', (await g.locator('.lib-count').count()) === 1);
  await scn('Kho tự học: dưới 5 học viên');
  ok('016 fewer than 5 HV used Tự học → “Chưa đủ dữ liệu để hiển thị (cần ít nhất 5 học viên dùng Tự học).” instead of the counts (AC-13.4)', (await T(g.locator('[data-lib-few]'))) === 'Chưa đủ dữ liệu để hiển thị (cần ít nhất 5 học viên dùng Tự học).' && !(await T(g.locator('.gv-content'))).includes('Học viên đã dùng khu Tự học'));
  await hvOpen(p, 'T24');
  ok('V15 HV frame on T24 → S01 (001 · AC-20.10)', (await p.locator('[data-frame="hv"]').getAttribute('data-screen')) === 'S01');
  await p.close();

  /* 6. wiring: what the GV edits / publishes / archives in T24 is what the HV sees in S14 */
  p = await newPage('#T24'); g = p.locator('[data-frame="gv"]'); const h = p.locator('[data-frame="hv"]');
  const hvLib = async () => { await hvOpen(p, 'S14'); return T(h.locator('.hv-body')); };
  const hvSearch = async (s) => { await hvOpen(p, 'S14'); await h.locator('[data-bind="q"]').fill(s); return h.locator('.th-row').evaluateAll((els) => els.map((e) => e.dataset.word)); };
  ok('V15 wiring: HV S14 before — “HSK 1 · 27 từ”, 你好 found by “nihao”', (await hvLib()).includes('HSK 1 27 từ') && (await hvSearch('nihao'))[0] === 'w2');
  await open(p, 'T24', { w: 'w1' });
  await g.locator('[data-bind="ed.means.1"]').fill('chào cậu'); await g.locator('.lib-edbar').getByRole('button', { name: 'Lưu', exact: true }).click();
  ok('V15 wiring: GV edits 你好 in T24 (nghĩa 2 → “chào cậu”) → “Đã lưu.”', (await toast(p)).includes('Đã lưu.'));
  await hvSearch('nihao'); await h.locator('.th-row[data-word="w2"] .th-row-main').click();
  ok('V15 wiring: the HV’s S14 word detail shows the edited meaning “chào cậu”', (await T(h.locator('.th-det'))).includes('chào cậu'));
  await open(p, 'T24', { w: 'w1' });
  await g.locator('.lib-edbar').getByRole('button', { name: 'Lưu trữ' }).click(); await g.locator('.confirm').getByRole('button', { name: 'Lưu trữ', exact: true }).click();
  ok('V15 wiring: GV archives (unpublishes) 你好 in T24', (await T(g.locator('.lib-edbar'))).includes('Lưu trữ') && (await g.locator('.lib-edbar').getByRole('button', { name: 'Khôi phục' }).count()) === 1);
  const lib1 = await hvLib(); const s1 = await hvSearch('nihao');
  ok('V15 wiring: HV S14 no longer lists 你好 — “HSK 1 · 26 từ”, “nihao” finds nothing in the library', lib1.includes('HSK 1 26 từ') && !s1.includes('w2'), lib1.slice(0, 120) + ' · ' + s1.join());
  await hvOpen(p, 'S14', {}, { tab: 'decks', deck: 'd1' });
  ok('V15 wiring: 你好 stays in the HV’s deck “Từ bài 3” labelled “Không còn trong kho” (012 · AC-19.4)', (await T(h.locator('.th-row[data-word="w2"]'))).includes('Không còn trong kho'));
  await open(p, 'T24', { w: 'new' });
  await g.locator('[data-bind="ed.han"]').fill('好'); await g.locator('[data-bind="ed.py"]').fill('hǎo');
  await g.getByRole('button', { name: 'Tính từ', exact: true }).click(); await g.locator('[data-bind="ed.means.0"]').fill('tốt'); await g.locator('[data-bind="ed.src"]').fill('Biên soạn nội bộ');
  await g.locator('.lib-edbar').getByRole('button', { name: 'Lưu', exact: true }).click();
  const hidden = await hvSearch('好');
  await open(p, 'T24', { w: await p.evaluate(() => D.lib016.words.find((w) => w.han === '好').id) });
  await g.locator('.lib-edbar').getByRole('button', { name: 'Xuất bản', exact: true }).click();
  const thId = await p.evaluate(() => D.lib016.words.find((w) => w.han === '好').th);
  const shown = await hvSearch('好');
  ok('V15 wiring: a new word 好 is invisible to the HV as Nháp and appears in S14 once the GV publishes it', !hidden.includes(thId) && shown.includes(thId) && (await T(h.locator(`.th-row[data-word="${thId}"]`))).includes('tốt'), `${hidden.join()} → ${shown.join()} (${thId})`);
  await open(p, 'T24', { w: 'w1' }); await g.locator('.lib-edbar').getByRole('button', { name: 'Khôi phục' }).click();
  const lib2 = await hvLib();
  ok('V15 wiring: “Khôi phục” 你好 → back in the HV library (“HSK 1 · 28 từ” with 好)', lib2.includes('HSK 1 28 từ') && (await hvSearch('nihao'))[0] === 'w2', lib2.slice(0, 120));
  await p.close();
}

/* ════════ v14 tự học — nối các khối — from proto-w3/integrate/wire-verify.cjs ════════ */
/* ---------- v14 · Tự học — nối các khối: cross-block checks (012 ↔ 013 / 014 / 015, nav, shells) ----------
   Call: await STEP('v14 tự học — nối các khối', () => verifyWire({ browser, URL, ok, norm, watch, SP })); */
async function verifyWire({ browser, URL, ok, norm, watch, SP }) {
  const p = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); watch(p); p.setDefaultTimeout(6000);
  await p.goto(URL + '#S13', { waitUntil: 'load' }); await p.waitForTimeout(300);
  const h = p.locator('[data-frame="hv"]'); const g = p.locator('[data-frame="gv"]');
  const T = async (l) => norm(await l.innerText()); const scr = (fr) => fr.getAttribute('data-screen');
  const hub = async (fid) => { await p.evaluate((f) => { enterRole(f, 'S13'); openInProto('S13', f, null, {}); }, fid); await p.waitForTimeout(100); };

  /* 1. S13 → each card opens its screen; back returns to S13 (HV phone; V15: the GV gets A05) */
  const CARDS = [['Từ vựng', 'S14'], ['Luyện viết', 'S16'], ['Luyện nghe & nói', 'S17'], ['Thi thử HSK', 'S19']];
  for (const [name, id] of CARDS) {
    await hub('hv'); await h.locator('.th-card-link', { hasText: name }).first().click(); await p.waitForTimeout(120);
    const got = await scr(h); await h.locator('.hv-head').getByRole('button', { name: 'Quay lại' }).click(); await p.waitForTimeout(120);
    ok(`wire HV S13 card “${name}” → ${id}, “Quay lại” → S13`, got === id && (await scr(h)) === 'S13', got + ' → ' + (await scr(h)));
  }
  await hub('gv');
  ok('wire V15: GV frame on S13 → A05 (Tự học only for HV)', (await scr(g)) === 'A05');
  await p.evaluate(() => { enterRole('hv', 'S18'); openInProto('S18', 'hv', null, {}); }); await p.waitForTimeout(100);
  await h.locator('.hv-head').getByRole('button', { name: 'Quay lại' }).click(); await p.waitForTimeout(120);
  ok('wire HV S18 “Quay lại” → S13 Tự học', (await scr(h)) === 'S13');
  ok('wire one dual shell: S13–S20 all use SHELLS.self (013/014/015 shells are aliases)', await p.evaluate(() => ['S13', 'S14', 'S15', 'S16', 'S17', 'S18', 'S19', 'S20'].every((i) => META[i].kind === 'self') && SHELLS.self013 === SHELLS.self && SHELLS.ls14 === SHELLS.self && SHELLS.dual === SHELLS.self));

  /* 2. nav: GV sidebar + HV tab bar (5 tabs) still fit — phone frame narrowed to 360 px */
  ok('wire GV sidebar (V15): Dashboard | Lớp học | Giáo trình | Bài thi | Học viên | Kho tự học | Tài khoản', (await g.locator('.gv-nav button').allInnerTexts()).map(norm).join('|') === 'Dashboard|Lớp học|Giáo trình|Bài thi|Học viên|Kho tự học|Tài khoản');
  await hub('hv');
  const tabs = await h.evaluate((fr) => { const w0 = fr.style.width; fr.style.width = '360px'; const bar = fr.querySelector('.hv-tabbar');
    const r = [...bar.querySelectorAll('button')].map((b) => { const s = b.querySelector('span'); const cs = getComputedStyle(b); return { t: s.textContent, fits: getComputedStyle(s).whiteSpace === 'nowrap' && s.scrollWidth <= b.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), w: b.clientWidth }; });
    const barFits = bar.scrollWidth <= bar.clientWidth && bar.clientWidth <= 360; fr.style.width = w0; return { r, barFits }; });
  ok('wire HV tab bar at 360 px: “Lớp của tôi | Bài thi | Tự học | Xếp hạng | Tài khoản”, every label on one line inside its tab', tabs.r.map((x) => x.t).join('|') === 'Lớp của tôi|Bài thi|Tự học|Xếp hạng|Tài khoản' && tabs.r.every((x) => x.fits) && tabs.barFits, JSON.stringify(tabs));

  /* 3. 012 → 013: “Luyện viết” on a word (S14 detail) and on a personal deck → S16; “Quay lại” → the 012 screen (013 · AC-4.1, AC-4.2, AC-4.6) */
  await p.evaluate(() => { enterRole('hv', 'S14'); const f = FRAMES.hv; f.st.ui.word = 'w11'; render(f); }); await p.waitForTimeout(120);
  await h.getByRole('button', { name: 'Luyện viết', exact: true }).click(); await p.waitForTimeout(150);
  const w1 = await T(h.locator('.hw-word'));
  ok('wire 012 word 妈妈 → “Luyện viết” → S16 practice of 妈 with the word header “妈妈 mā ma mẹ, má” (013 · AC-4.1)', (await scr(h)) === 'S16' && /妈妈 mā ma mẹ, má/.test(w1), w1);
  await h.getByRole('button', { name: 'Quay lại' }).first().click(); await p.waitForTimeout(120);
  ok('wire S16 “Quay lại” → back on the 012 word detail (013 · AC-4.6)', (await scr(h)) === 'S14' && (await T(h.locator('.hv-head'))).includes('Chi tiết từ') && (await T(h.locator('.th-det-h'))) === '妈妈');
  await p.evaluate(() => { const f = FRAMES.hv; f.st.ui.word = null; f.st.ui.tab = 'decks'; f.st.ui.deck = 'd1'; render(f); }); await p.waitForTimeout(120);
  await h.getByRole('button', { name: 'Luyện viết', exact: true }).click(); await p.waitForTimeout(150);
  const dk = await T(h.locator('.hw-phone'));
  ok('wire 012 deck “Từ bài 3” → “Luyện viết” → S16 list of its characters (skips those without stroke data) (013 · AC-4.2, AC-4.5)', (await scr(h)) === 'S16' && dk.includes('Bỏ qua 4 chữ chưa có dữ liệu nét: 我 再 见 爸') && (await T(h.locator('.hw-kn'))) === 'Chữ 1/3', dk.slice(0, 160));

  /* 4. 015 → 012: “Thêm từ sai vào bộ từ” writes the learner’s 012 deck → visible in S14 “Bộ từ của tôi” */
  await p.evaluate(() => { enterRole('hv', 'S20'); openInProto('S20', 'hv', null, { att: 'h-m1b' }); }); await p.waitForTimeout(150);
  await h.getByRole('button', { name: 'Thêm từ sai vào bộ từ' }).click();
  await h.locator('.sheet').getByRole('radio', { name: 'Tạo bộ mới' }).click(); await h.locator('.sheet').getByRole('button', { name: 'Thêm vào bộ' }).click();
  const tw = norm(await p.locator('[data-toasts="hv"]').innerText()); const n = +((/Đã thêm (\d+) từ/.exec(tw) || [])[1] || 0);
  ok('wire 015 S20 “Thêm từ sai vào bộ từ” → new deck “Từ sai · HSK 1” → “Đã thêm n từ …”', n >= 1 && tw.includes('vào bộ Từ sai · HSK 1.'), tw);
  await p.evaluate(() => openInProto('S13', 'hv', null, {})); await p.waitForTimeout(100);
  await h.locator('.th-card-link', { hasText: 'Từ vựng' }).click(); await h.getByRole('tab', { name: 'Bộ từ của tôi' }).click();
  const row = h.locator('.th-dkrow', { hasText: 'Từ sai · HSK 1' });
  ok('wire 012 S14 “Bộ từ của tôi” lists “Từ sai · HSK 1” first with “n từ”', (await row.count()) === 1 && (await T(h.locator('.th-dkrow').first())).startsWith('Từ sai · HSK 1') && (await T(row)).includes(`${n} từ`), await T(h.locator('.th-list')));
  await row.locator('.th-row-main').click(); await p.waitForTimeout(100);
  const words = await h.locator('.th-row').count(); const deckTxt = await T(h.locator('.hv-body'));
  ok('wire the deck opened in 012 shows the words added in 015 (老师, 朋友 …) and can be studied (“Học”)', words === n && deckTxt.includes('老师') && deckTxt.includes('朋友') && (await h.getByRole('button', { name: 'Học' }).first().isEnabled()), `${words} rows · ${deckTxt.slice(0, 160)}`);
  await p.evaluate(() => { enterRole('hv', 'S20'); openInProto('S20', 'hv', null, { att: 'h-m1b' }); }); await p.waitForTimeout(150);
  await h.getByRole('button', { name: 'Thêm từ sai vào bộ từ' }).click();
  ok('wire 015 deck picker now lists the 012 deck “Từ sai · HSK 1” (no duplicate deck on the next add)', (await h.locator('.sheet').getByRole('radio', { name: /Từ sai · HSK 1/ }).count()) === 1);
  await p.close();
}

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  /* web fonts are served locally as empty CSS so a flaky network (e.g. ERR_NO_BUFFER_SPACE) never fails the run */
  const watch = (p) => { p.route(/fonts.(googleapis|gstatic).com/, (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' })); p.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); }); p.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); };
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(6000); watch(page);
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  const gv = page.locator('[data-frame="gv"]'); const hv = page.locator('[data-frame="hv"]');
  const scr = (fid) => page.locator(`[data-frame="${fid}"]`).getAttribute('data-screen');
  const expectScreen = async (fid, id, label) => { const s = await scr(fid); ok(`${label ? label + ': ' : ''}${fid} → ${id}`, s === id, 'got ' + s); };
  const confirmOk = async (fr, name) => { const c = fr.locator('.confirm'); await c.getByRole('button', { name, exact: true }).click(); };
  const confirmText = async (fr) => ((await fr.locator('.confirm').count()) ? norm(await fr.locator('.confirm').innerText()) : '');
  const toastTxt = async (fid) => norm(await page.locator(`[data-toasts="${fid}"]`).innerText());
  const crumb = (name) => gv.locator('nav button', { hasText: name }).first();

  /* ---------- 0. Role picker ---------- */
  await STEP('picker', async () => {
    ok('picker: 2 role cards', (await page.locator('.role-card').count()) === 2);
    const gvCard = norm(await page.locator('.role-card[data-role="gv"]').innerText()); const hvCard = norm(await page.locator('.role-card[data-role="hv"]').innerText());
    ok('picker: “Giáo viên” card = desktop + one-line description', gvCard.startsWith('Giáo viên') && /desktop/i.test(gvCard), gvCard);
    ok('picker: “Học viên” card = mobile + one-line description', hvCard.startsWith('Học viên') && /mobile/i.test(hvCard), hvCard);
    ok('picker: no flow map / screen table / catalogue / TOC / state gallery / tokens / Mermaid', (await page.locator('#flow-map, #screen-table, #catalogue, .cat-item, .toc, #states-body, #tokens-body, pre.mermaid, script[src*="mermaid"]').count()) === 0);
    ok('picker: role views hidden until a role is chosen', !(await page.locator('#view-gv').isVisible()) && !(await page.locator('#view-hv').isVisible()) && !(await page.locator('#fab').isVisible()));
    await page.locator('.role-card[data-role="gv"]').click();
    ok('GV role: full-viewport desk frame visible, picker hidden', (await page.locator('#view-gv').isVisible()) && !(await page.locator('#landing').isVisible()));
    const box = await page.locator('#view-gv .scaler').boundingBox();
    ok('GV role: 1280×800 frame scaled to fit the viewport', box && box.width <= 1440 && box.height <= 1000 && box.width > 1000, JSON.stringify(box));
    await expectScreen('gv', 'A01', 'GV role starts at login');
    ok('GV role: floating “Đổi vai trò” + “Hướng dẫn”', (await page.getByRole('button', { name: 'Đổi vai trò' }).isVisible()) && (await page.getByRole('button', { name: 'Hướng dẫn' }).isVisible()));
    await page.getByRole('button', { name: 'Hướng dẫn' }).click();
    ok('Hướng dẫn: checklist (≥ 5 steps) + Kịch bản buttons', (await page.locator('#guide .guide-list li').count()) >= 5 && (await page.locator('#guide [data-scn]').count()) >= 5);
    await page.locator('#guide [data-proto="guide"]').click();
    ok('Hướng dẫn closes', !(await page.locator('#guide').isVisible()));
  });

  /* ---------- 1. GV: login → create Bài → manual ---------- */
  let baiName = '';
  await STEP('gv manual', async () => {
    await gv.getByRole('button', { name: 'Đăng nhập', exact: true }).click(); await expectScreen('gv', 'T01', 'GV login');
    ok('T01: no exam / grading KPIs (content area; the sidebar has “Bài thi”)', (await gv.locator('.gv-content').getByText(/bài thi|chờ chấm/i).count()) === 0);
    await gv.locator('.gv-nav').getByRole('button', { name: 'Giáo trình' }).click(); await expectScreen('gv', 'T05', 'sidebar');
    await gv.locator('.cur-tile', { hasText: 'HSK1 Chuẩn' }).getByRole('button', { name: /HSK1 Chuẩn/ }).click(); await expectScreen('gv', 'T06', 'curriculum');
    ok('T06: single “Thêm bài” (no “Tạo bằng AI từ PDF”)', (await gv.getByRole('button', { name: 'Thêm bài', exact: true }).count()) === 1 && (await gv.getByText('Tạo bằng AI từ PDF').count()) === 0);
    ok('T06: badges “AI · Chờ duyệt” (Bài 6) and “AI · Tạo thất bại” (Bài 7)', (await gv.locator('.chip', { hasText: 'AI · Chờ duyệt' }).count()) >= 1 && (await gv.locator('.chip', { hasText: 'AI · Tạo thất bại' }).count()) >= 1);
    await gv.getByRole('button', { name: 'Thêm bài', exact: true }).click();
    baiName = await gv.locator('[data-bind="modal.v.name"]').inputValue();
    ok('Thêm bài: name prefilled “Bài 16”', baiName === 'Bài 16', baiName);
    await gv.locator('[data-bind="modal.v.name"]').fill('Bài 16 – 你好 (AI)'); baiName = 'Bài 16 – 你好 (AI)';
    await gv.locator('.modal-foot').getByRole('button', { name: 'Thêm bài' }).click(); await expectScreen('gv', 'T18', 'new Bài');
    ok('T18: 2 panels “Thủ công” + “Tạo bằng AI”', (await gv.locator('.editor-grid > .panel-card').count()) === 2 && (await gv.locator('.panel-head', { hasText: 'Thủ công' }).count()) === 1 && (await gv.locator('.ai-head', { hasText: 'Tạo bằng AI' }).count()) === 1);
    ok('T18: Thủ công = compact summary of both sections + ONE “Soạn thủ công” button; no “Xem như học viên” on T18', (await gv.locator('.man-sum-row').count()) === 2 && (await gv.locator('.sec-card').count()) === 0 && (await gv.getByRole('button', { name: 'Soạn thủ công' }).count()) === 1 && (await gv.getByRole('button', { name: /Xem như học viên/ }).count()) === 0);
    const frame = gv.locator('.rv-frame'); const mode = () => frame.getAttribute('data-mode');
    const realName = (k, i) => page.evaluate(([n, k0, i0]) => Object.values(D.bai).flat().find((b) => b.name === n).items.filter((x) => x.k === k0)[i0].name, [baiName, k, i]);
    await gv.getByRole('button', { name: 'Soạn thủ công' }).click(); await expectScreen('gv', 'T07', '“Soạn thủ công” → T07');
    ok('T07 “Soạn bài thủ công”: tabs Bài học | Bài tập (Bài học open), edit-only — no Xem trước / Chỉnh sửa / Xong / Web-Mobile / Xem như học viên', (await gv.locator('[role="tab"]').allInnerTexts()).map((t) => norm(t).replace(/\s*\d+.*$/, '')).join('|') === 'Bài học|Bài tập' && (await gv.locator('[role="tab"][aria-selected="true"]').innerText()).startsWith('Bài học') && (await mode()) === 'edit' && (await gv.getByRole('button', { name: /^(Chỉnh sửa|Xong|Mobile|Web)$|Xem như học viên/ }).count()) === 0 && (await gv.getByRole('switch', { name: /Hiện đáp án/ }).count()) === 0);
    await gv.locator('.rv-bar').getByRole('button', { name: 'Thêm bước học' }).click();
    ok('“+ Thêm bước học” takes effect immediately (Nháp, “Đã lưu”)', (await gv.locator('.rvseg').count()) === 1 && (await toastTxt('gv')).includes('Đã lưu') && (await gv.locator('.rv-bar').innerText()).includes('1 Nháp'));
    ok('empty fields shown as “Chưa hoàn chỉnh” (item tag + inline hint)', (await gv.locator('.rvseg[data-key="L|0"] .chip', { hasText: 'Chưa hoàn chỉnh' }).count()) === 1 && (await gv.locator('.rvseg .inc-txt', { hasText: 'Chưa hoàn chỉnh: Vui lòng nhập tên bước học' }).count()) === 1);
    await gv.locator('[data-rk="L|0|name"]').fill('Khởi động: chào hỏi'); await gv.locator('[data-rk="L|0|blocks.0.html"]').fill('Chào cả lớp!');
    ok('inline edit → item shows “Chưa lưu”, bar “1 mục chưa lưu”', await gv.locator('.rvseg[data-key="L|0"] .us-chip').isVisible() && (await gv.locator('[data-savestate]').innerText()) === '1 mục chưa lưu');
    await gv.locator('.rvseg[data-key="L|0"]').getByRole('button', { name: 'Thêm sau' }).click();
    await gv.locator('[data-rk="L|1|name"]').fill('Ôn lại thanh điệu'); await gv.locator('[data-rk="L|1|blocks.0.html"]').fill('Bốn thanh và thanh nhẹ.');
    await gv.locator('.rvseg[data-key="L|1"]').getByRole('button', { name: 'Lên trên' }).click();
    ok('“Thêm sau” + move ▲ take effect immediately (“Đã lưu”), unsaved edits follow the item', (await toastTxt('gv')).includes('Đã chuyển tới vị trí 1/2 · Đã lưu') && (await gv.locator('[data-rk="L|0|name"]').inputValue()) === 'Ôn lại thanh điệu' && (await realName('L', 0)) === '');
    await gv.locator('.rvseg[data-key="L|1"]').getByRole('button', { name: 'Thêm khối' }).click(); await gv.getByRole('menuitem', { name: /Từ vựng/ }).click();
    await gv.locator('[data-rk="L|1|blocks.1.words.0.1"]').fill('ni3');
    await gv.locator('.rvseg[data-key="L|1"]').getByRole('button', { name: 'Lưu nháp' }).click();
    ok('saving an item is blocked by an invalid value (pinyin “ni3”) with the inline error', (await toastTxt('gv')).includes('Chưa lưu được: Pinyin không hợp lệ') && (await gv.locator('.rvseg .err-txt', { hasText: 'Pinyin không hợp lệ' }).count()) === 1 && (await realName('L', 1)) === '');
    await gv.locator('[data-rk="L|1|blocks.1.words.0.0"]').fill('你'); await gv.locator('[data-rk="L|1|blocks.1.words.0.1"]').fill('nǐ'); await gv.locator('[data-rk="L|1|blocks.1.words.0.3"]').fill('bạn');
    await gv.locator('.rvseg[data-key="L|1"]').getByRole('button', { name: 'Lưu nháp' }).click();
    // Wait for the save toast instead of a fixed delay (toast/chip transitions vary in timing).
    await page.locator('[data-toasts="gv"]', { hasText: 'Đã lưu lúc' }).waitFor({ timeout: 2000 }).catch(() => {});
    ok('per-item “Lưu nháp” saves only that step', (await toastTxt('gv')).includes('Đã lưu lúc') && (await realName('L', 1)) === 'Khởi động: chào hỏi' && (await realName('L', 0)) === '' && !(await gv.locator('.rvseg[data-key="L|1"] .us-chip').isVisible()) && await gv.locator('.rvseg[data-key="L|0"] .us-chip').isVisible());
    await gv.getByRole('tab', { name: /Bài tập/ }).click();
    ok('switching to tab Bài tập keeps the unsaved step (tab Bài học shows “1 chưa lưu”)', (await gv.getByRole('tab', { name: /Bài học/ }).innerText()).includes('1 chưa lưu') && (await gv.locator('[data-savestate]').innerText()) === '1 mục chưa lưu');
    await gv.locator('.rv-bar').getByRole('button', { name: 'Thêm bộ bài tập' }).click();
    await gv.locator('[data-rk="E|0|name"]').fill('Ôn tập nhanh');
    ok('Nhân bản disabled while the set has unsaved changes', (await gv.locator('.rvseg[data-key="E|0"]').getByRole('button', { name: 'Nhân bản' }).getAttribute('aria-disabled')) === 'true');
    await gv.locator('.rvseg[data-key="E|0"]').getByRole('button', { name: 'Xuất bản', exact: true }).click();
    ok('Xuất bản refused while “Chưa hoàn chỉnh”', (await toastTxt('gv')).includes('Không thể xuất bản — Chưa hoàn chỉnh'));
    await gv.locator('[data-rk="Q|0|0|text"]').fill('Chọn nghĩa của 你好'); await gv.locator('[data-rk="Q|0|0|opts.0"]').fill('Xin chào'); await gv.locator('[data-rk="Q|0|0|opts.1"]').fill('Tạm biệt');
    await gv.locator('.rvseg[data-key="E|0"]').getByRole('button', { name: 'Thêm câu hỏi' }).click();
    const types = await gv.locator('.popover [role="menuitem"]').count(); await page.keyboard.press('Escape');
    ok('Bài tập tab: question stem/options inline; auto-graded types menu', types >= 8, String(types));
    await gv.locator('.rvseg[data-key="E|0"]').getByRole('button', { name: 'Lưu nháp' }).click();
    ok('set saved per item', (await realName('E', 0)) === 'Ôn tập nhanh' && !(await gv.locator('.rvseg[data-key="E|0"] .us-chip').isVisible()));
    await gv.getByRole('tab', { name: /Bài học/ }).click();
    ok('back on Bài học: the unsaved step is still there with “Chưa lưu”', (await gv.locator('[data-rk="L|0|name"]').inputValue()) === 'Ôn lại thanh điệu' && await gv.locator('.rvseg[data-key="L|0"] .us-chip').isVisible());
    await crumb(baiName).click();
    ok('leaving with unsaved items: one warning with the count', (await confirmText(gv)).includes('Có 1 mục chưa lưu'));
    await gv.locator('.confirm').getByRole('button', { name: 'Ở lại' }).click();
    await gv.locator('.rvseg[data-key="L|0"]').getByRole('button', { name: 'Lưu nháp' }).click();
    ok('save the last unsaved step → “Đã lưu lúc …”, nothing unsaved', (await realName('L', 0)) === 'Ôn lại thanh điệu' && (await gv.locator('[data-savestate]').innerText()).startsWith('Đã lưu lúc'));
    await crumb(baiName).click(); await expectScreen('gv', 'T18', 'crumb back');
    ok('T18 summary: Bài học 2 bước học · 2 Nháp; Bài tập 1 bộ bài tập', (await gv.locator('.man-sum-row[data-sec="L"]').innerText()).includes('2 bước học') && (await gv.locator('.man-sum-row[data-sec="L"]').innerText()).includes('2 Nháp') && (await gv.locator('.man-sum-row[data-sec="E"]').innerText()).includes('1 bộ bài tập'));
  });

  /* ---------- 2. GV: AI flow ---------- */
  await STEP('gv ai', async () => {
    const ai = gv.locator('.ai-card');
    await ai.getByRole('button', { name: 'Tạo bằng AI' }).click();
    ok('AI: start without file → “Hãy tải lên ít nhất một tài liệu PDF hoặc Word.”', (await ai.getByText('Hãy tải lên ít nhất một tài liệu PDF hoặc Word.').count()) === 1);
    await ai.getByRole('button', { name: 'Chọn tệp' }).click(); await gv.getByRole('menuitem', { name: /slide-bai-1\.pptx/ }).click();
    ok('AI: .pptx rejected “Chỉ nhận tệp PDF (.pdf) hoặc Word (.docx).”', (await ai.getByText('Chỉ nhận tệp PDF (.pdf) hoặc Word (.docx).').count()) === 1);
    await ai.getByRole('button', { name: 'Chọn tệp' }).click(); await gv.getByRole('menuitem', { name: /HSK1_GiaoTrinh_TongHop\.pdf/ }).click();
    await page.waitForTimeout(3300);
    ok('AI: 120-page PDF → “Tổng: 120/30 trang” + page-range inputs', (await ai.getByText('120/30 trang').count()) === 1 && (await ai.locator('[data-bind="docs.0.from"]').count()) === 1);
    await ai.locator('[data-bind="docs.0.from"]').fill('1'); await ai.locator('[data-bind="docs.0.to"]').fill('8');
    ok('AI: page range 1–8 → “Tổng: 8/30 trang”', (await ai.getByText('8/30 trang').count()) === 1);
    await ai.locator('.doc-card').getByRole('button', { name: /Gỡ/ }).click();
    await ai.getByRole('button', { name: 'Chọn tệp' }).click(); await gv.getByRole('menuitem', { name: /HSK1_Bai01_NiHao\.pdf/ }).click();
    await page.waitForTimeout(3300);
    ok('AI: PDF uploaded “PDF · 3,4 MB · 8 trang”', (await ai.getByText(/PDF · 3,4 MB · 8 trang/).count()) === 1);
    await ai.locator('[data-bind="desc"]').fill('HSK1, người mới học. Tập trung chào hỏi.');
    await ai.getByRole('button', { name: 'Tạo bằng AI' }).click();
    ok('AI: rights checkbox required', (await ai.getByText('Vui lòng xác nhận quyền sử dụng tài liệu trước khi tạo.').count()) === 1);
    await ai.getByRole('checkbox').click();
    const before = await page.evaluate((n) => Object.values(D.bai).flat().find((b) => b.name === n).items.length, baiName);
    await ai.getByRole('button', { name: 'Tạo bằng AI' }).click();
    ok('AI: run starts — progress panel with stage + %', (await gv.locator('.ai-card[data-ai="running"]').count()) === 1 && /\d+%/.test(await gv.locator('.ai-card').innerText()));
    await crumb('HSK1 Chuẩn').click(); await expectScreen('gv', 'T06', 'leave during run');
    ok('T06: badge “AI · Đang tạo x%” on the new Bài', (await gv.locator('.chip', { hasText: /AI · Đang tạo \d+%/ }).count()) === 1);
    await page.waitForTimeout(14000);
    ok('AI done → in-app notice “… nội dung AI đã sẵn sàng để duyệt”', (await gv.getByRole('button', { name: /Thông báo \(1 mới\)/ }).count()) === 1);
    ok('T06: badge “AI · Chờ duyệt” on the new Bài', (await gv.locator('.bai-row, tr', { hasText: baiName }).locator('.chip', { hasText: 'AI · Chờ duyệt' }).count()) >= 1);
    await gv.getByRole('button', { name: /Thông báo/ }).click();
    await gv.locator('.popover[aria-label="Thông báo"] .row', { hasText: 'sẵn sàng để duyệt' }).first().getByRole('button', { name: 'Mở' }).click(); await expectScreen('gv', 'T20', 'notice → review');
    ok('T20: nothing saved into the Bài before Duyệt', (await page.evaluate((n) => Object.values(D.bai).flat().find((b) => b.name === n).items.length, baiName)) === before);
    ok('T20: tabs per section Bài học · Bài tập', norm((await gv.locator('[role="tab"]').allInnerTexts()).join('|')).replace(/ ?\d+ ?· Chờ duyệt/g, '') === 'Bài học|Bài tập', (await gv.locator('[role="tab"]').allInnerTexts()).join('|'));
    const qsum = async () => norm(await gv.locator('.rv-bar .qual-sum').innerText());
    const frame = gv.locator('.rv-frame'); const mode = () => frame.getAttribute('data-mode');
    ok('T20 opens in “Xem trước”: header bar “Lỗi 1 · Cảnh báo 1” + Chỉnh sửa · Bỏ · Duyệt', (await mode()) === 'preview' && (await qsum()) === 'Lỗi 1 · Cảnh báo 1' && (await gv.locator('.rv-bar').getByRole('button', { name: 'Chỉnh sửa' }).count()) === 1 && (await gv.locator('.rv-bar').getByRole('button', { name: 'Bỏ' }).count()) === 1 && (await gv.locator('.rv-bar').getByRole('button', { name: 'Duyệt' }).count()) === 1, await qsum());
    ok('T20 Xem trước: web layout by default', (await frame.getAttribute('data-vp')) === 'web');
    await gv.locator('.rv-bar').getByRole('button', { name: 'Mobile' }).click();
    ok('T20 Web / Mobile switch → 375 px phone frame', (await frame.getAttribute('data-vp')) === 'mobile' && (await page.evaluate(() => document.querySelector('[data-frame="gv"] .rv-frame-in').clientWidth)) === 375);
    await gv.locator('.rv-bar').getByRole('button', { name: 'Web' }).click();
    ok('Xem trước Bài học: whole section as HV sees it (3 steps, all blocks), nothing editable', (await gv.locator('.rv-frame .pv-step').count()) === 3 && (await gv.locator('.rv-frame input, .rv-frame textarea').count()) === 0 && (await gv.locator('.rv-frame .voc-row').count()) >= 7 && (await gv.locator('.rv-frame .dlg-line').count()) >= 4);
    ok('Xem trước: no per-item review list / per-item accept', (await gv.locator('.rv-item, .rv-list').count()) === 0 && (await gv.locator('.rv-frame').getByRole('button', { name: /^Duyệt|^Xem$/ }).count()) === 0);
    const fc = gv.locator('.rv-frame .fc-mini').first(); await fc.click();
    ok('Xem trước: flashcards flip in place', (await fc.getAttribute('aria-pressed')) === 'true' && (await fc.locator('.py').count()) === 1);
    const pyN = await gv.locator('.rv-frame .dlg-line .py').count(); await gv.locator('.rv-frame').getByRole('switch', { name: 'Pinyin' }).first().click();
    ok('Xem trước: pinyin toggle works like S03', pyN > 0 && (await gv.locator('.rv-frame .dlg-line .py').count()) === 0);
    await gv.locator('.rv-frame').getByRole('switch', { name: 'Pinyin' }).first().click();
    ok('quality marker on the affected block + “Duyệt” blocked', (await gv.locator('.rv-frame .q-mark.is-err').count()) === 1 && (await gv.locator('.rv-bar button[aria-disabled="true"]', { hasText: 'Duyệt' }).count()) === 1);
    await gv.locator('.rv-frame .q-mark.is-err').click();
    ok('marker click → edit mode focused on that block', (await mode()) === 'edit' && /^L\|2\|b\d+$/.test(await gv.locator('.rv-frame .is-focus').getAttribute('data-key')) && (await gv.locator('.rv-frame .is-focus .err-txt', { hasText: 'Pinyin không hợp lệ' }).count()) === 1);
    ok('edit mode: button reads “Xong”, Duyệt waits for Xong, source labels shown', (await gv.locator('.rv-bar').getByRole('button', { name: 'Xong' }).count()) === 1 && (await gv.locator('.rv-bar button[aria-disabled="true"]', { hasText: 'Duyệt' }).getAttribute('title')) === 'Bấm “Xong” trước khi duyệt' && (await gv.locator('.src-chip', { hasText: 'Theo tài liệu: HSK1_Bai01_NiHao.pdf · trang' }).count()) === 3);
    await gv.locator('.rv-frame .is-focus .inp.is-err').fill('Nín hǎo!');
    const t0 = gv.locator('.rvseg[data-key="L|0"] .rvseg-h input'); await t0.fill('Từ mới: 你好 · 您好');
    await gv.locator('.rvseg[data-key="L|1"] .rvseg-h input').fill('');
    await gv.locator('.rv-bar').getByRole('button', { name: 'Xong' }).click();
    ok('Xong refused while a field is invalid (stays in edit mode, warning)', (await mode()) === 'edit' && (await toastTxt('gv')).includes('Còn 1 trường chưa hợp lệ. Hãy sửa trước khi bấm “Xong”.'));
    ok('inline validation “Vui lòng nhập tên bước học…” under the field', (await gv.locator('.rvseg[data-key="L|1"] .err-txt', { hasText: 'Vui lòng nhập tên bước học' }).count()) === 1);
    await gv.locator('.rvseg[data-key="L|1"] .rvseg-h input').fill('Mẫu câu chào hỏi và xin lỗi');
    await gv.locator('.rvseg[data-key="L|0"]').getByRole('button', { name: 'Xuống dưới' }).click();
    ok('move ▼: step 1 → position 2', (await toastTxt('gv')).includes('Đã chuyển tới vị trí 2/3') && (await gv.locator('.rvseg[data-key="L|1"] .rvseg-h input').inputValue()) === 'Từ mới: 你好 · 您好');
    await gv.locator('.rvseg[data-key="L|1"]').getByRole('button', { name: 'Lên trên' }).click();
    await gv.locator('.rv-bar').getByRole('button', { name: 'Xong' }).click();
    ok('Xong → preview shows the edits, Lỗi gone → “Lỗi 0 · Cảnh báo 1”', (await mode()) === 'preview' && (await gv.locator('.rv-frame .pv-step-h').first().innerText()).includes('Từ mới: 你好 · 您好') && (await qsum()) === 'Lỗi 0 · Cảnh báo 1', await qsum());
    ok('edits stay in the review draft — Bài unchanged', (await page.evaluate((n) => Object.values(D.bai).flat().find((b) => b.name === n).items.length, baiName)) === before);
    await gv.locator('.rv-bar').getByRole('button', { name: 'Duyệt' }).click();
    let dlg = norm(await gv.locator('.modal').innerText());
    ok('T20 Duyệt: replace dialog “Thay thế toàn bộ phần Bài học của … bằng 3 bước học mới?” + “Đã xuất bản”', dlg.includes(`Thay thế toàn bộ phần Bài học của "${baiName}" bằng 3 bước học mới?`) && dlg.includes('Nội dung mới được lưu ở trạng thái Đã xuất bản.'), dlg.slice(0, 160));
    ok('T20 Duyệt: lists “Sẽ bị xóa (2) — không khôi phục được” = the manual steps', dlg.includes('Sẽ bị xóa (2) — không khôi phục được') && (await gv.locator('.modal .rp-grp.is-del li', { hasText: 'Khởi động: chào hỏi' }).count()) === 1);
    ok('T20 Duyệt: draft Bài → “Bài đang ở trạng thái Nháp — học viên chỉ thấy nội dung khi Bài được xuất bản.”', dlg.includes('Bài đang ở trạng thái Nháp — học viên chỉ thấy nội dung khi Bài được xuất bản.'));
    ok('T20 Duyệt: Cảnh báo listed, button “Duyệt dù có cảnh báo”', dlg.includes('Còn 1 cảnh báo chất lượng') && (await gv.locator('.modal-foot').getByRole('button', { name: 'Duyệt dù có cảnh báo' }).count()) === 1);
    await gv.locator('.modal-foot').getByRole('button', { name: 'Duyệt dù có cảnh báo' }).click();
    ok('T20: toast “Đã duyệt và xuất bản 3 mục vào phần Bài học. Đã xóa 2 mục cũ · Đã lưu trữ 0 bộ bài tập.”', (await toastTxt('gv')).includes('Đã duyệt và xuất bản 3 mục vào phần Bài học. Đã xóa 2 mục cũ · Đã lưu trữ 0 bộ bài tập.'), await toastTxt('gv'));
    ok('T20: switched to tab Bài tập (Xem trước)', (await gv.locator('[role="tab"][aria-selected="true"]').innerText()).startsWith('Bài tập') && (await mode()) === 'preview');
    ok('Xem trước Bài tập: “Lỗi 1 · Cảnh báo 2”, 4 sets / 26 questions interactive', (await qsum()) === 'Lỗi 1 · Cảnh báo 2' && (await gv.locator('.rv-frame .pv-set').count()) === 4 && (await gv.locator('.rv-frame .pv-q').count()) === 26, await qsum());
    const ld0 = await page.evaluate(() => JSON.stringify(D.ld).length);
    const opt0 = gv.locator('.rv-frame .pv-q').first().locator('.opt').first(); await opt0.click();
    ok('GV can try answering; nothing is recorded', (await opt0.getAttribute('aria-checked')) === 'true' && (await page.evaluate(() => JSON.stringify(D.ld).length)) === ld0);
    ok('answer keys hidden by default', (await gv.locator('.rv-frame .key-line').count()) === 0);
    await gv.locator('.rv-bar').getByRole('switch', { name: 'Hiện đáp án' }).click();
    ok('“Hiện đáp án” reveals the key on every question', (await gv.locator('.rv-frame .key-line').count()) === 26 && (await gv.locator('.rv-frame .key-line').first().innerText()).includes('Đáp án:'));
    await gv.locator('.rv-frame .q-mark.is-err').first().click();
    ok('Bài tập marker → edit mode on question “Q|1|1”', (await mode()) === 'edit' && (await gv.locator('.rv-frame .is-focus').getAttribute('data-key')) === 'Q|1|1');
    ok('edit mode: “AI bổ sung” label + per-question actions', (await gv.locator('.src-chip', { hasText: 'AI bổ sung' }).count()) >= 1 && (await gv.locator('.rvseg-q[data-key="Q|1|1"]').getByRole('button', { name: 'Tạo lại' }).count()) === 1);
    await gv.locator('.rvseg-q[data-key="Q|1|1"]').getByRole('button', { name: 'Tạo lại' }).click();
    await gv.locator('[data-bind="modal.instr"]').fill('Chỉ giữ một đáp án đúng');
    await gv.locator('.modal-foot').getByRole('button', { name: /Tạo lại/ }).click();
    ok('Tạo lại (with instruction) → “Đang tạo lại…”', (await gv.getByText('Đang tạo lại…').count()) >= 1);
    await page.waitForTimeout(2600);
    ok('regenerated question fixes the Lỗi → “Lỗi 0 · Cảnh báo 2”', (await qsum()) === 'Lỗi 0 · Cảnh báo 2', await qsum());
    await gv.locator('.rvseg-q[data-key="Q|3|5"]').getByRole('button', { name: 'Xóa' }).click(); await confirmOk(gv, 'Xóa');
    ok('Xóa a question → “Cảnh báo 1”, 25 questions', (await qsum()) === 'Lỗi 0 · Cảnh báo 1' && (await gv.locator('.rvseg-q').count()) === 25, await qsum());
    await gv.locator('[data-rk="Q|0|0|text"]').fill('Chọn nghĩa đúng của từ sau');
    await gv.locator('.rvseg[data-key="E|3"]').getByRole('button', { name: 'Lên trên' }).first().click();
    ok('move ▲ a set → position 3/4', (await toastTxt('gv')).includes('Đã chuyển tới vị trí 3/4'));
    await gv.locator('.rvseg[data-key="E|2"]').getByRole('button', { name: 'Xuống dưới' }).first().click();
    await gv.locator('.rv-bar').getByRole('button', { name: 'Xong' }).click();
    ok('Xong → preview with the edited stem', (await mode()) === 'preview' && (await gv.locator('.rv-frame .pv-q').first().innerText()).includes('Chọn nghĩa đúng của từ sau'));
    await gv.locator('.rv-bar').getByRole('button', { name: 'Duyệt' }).click();
    dlg = norm(await gv.locator('.modal').innerText());
    ok('T20 Duyệt Bài tập: “… bằng 4 bộ bài tập mới (25 câu hỏi)?” + “Sẽ bị xóa (1)” = the manual set', dlg.includes('bằng 4 bộ bài tập mới (25 câu hỏi)?') && (await gv.locator('.modal .rp-grp.is-del li', { hasText: 'Ôn tập nhanh' }).count()) === 1, dlg.slice(0, 160));
    await gv.locator('.modal-foot').getByRole('button', { name: 'Duyệt dù có cảnh báo' }).click();
    ok('T20: both sections approved → “Hoàn tất”', (await gv.locator('.page-head .chip', { hasText: 'Hoàn tất' }).count()) === 1);
    await gv.getByRole('button', { name: 'Mở trong Soạn bài' }).click(); await expectScreen('gv', 'T18', 'review → Soạn bài');
    const cL = await gv.locator('.man-sum-row[data-sec="L"]').innerText(); const cE = await gv.locator('.man-sum-row[data-sec="E"]').innerText();
    ok('T18 summary after approval: 3 bước học · 3 Đã xuất bản · 3 AI tạo · 0 Nháp; 4 bộ bài tập · 4 Đã xuất bản', cL.includes('3 bước học') && cL.includes('3 Đã xuất bản') && cL.includes('3 AI tạo') && cL.includes('0 Nháp') && cE.includes('4 bộ bài tập') && cE.includes('4 Đã xuất bản'), cL + ' / ' + cE);
    await gv.getByRole('button', { name: 'Soạn thủ công' }).click(); await expectScreen('gv', 'T07', '→ T07');
    ok('T07 after approval: 3 AI steps Đã xuất bản, manual steps replaced', (await gv.locator('.rvseg').count()) === 3 && (await gv.locator('[data-rk$="|name"]').evaluateAll((els) => els.map((e) => e.value))).every((x) => x !== 'Khởi động: chào hỏi') && (await gv.locator('.rvseg .chip', { hasText: 'Đã xuất bản' }).count()) === 3 && (await gv.locator('.rvseg .chip', { hasText: /^Nháp$|Đã chỉnh sửa/ }).count()) === 0);
    await crumb(baiName).click(); await expectScreen('gv', 'T18', 'back');
    ok('T18: AI panel back to the upload form', (await gv.locator('.ai-card[data-ai="form"]').count()) === 1);
    await crumb('HSK1 Chuẩn').click(); await expectScreen('gv', 'T06', 'T18 → T06');
    ok('T06: per-Bài action “Xem như học viên” (no curriculum-level button)', (await gv.getByRole('button', { name: /^Xem như học viên: / }).count()) >= 15 && (await gv.locator('.page-head').getByRole('button', { name: /Xem như học viên/ }).count()) === 0);
    await gv.getByRole('button', { name: `Xem như học viên: ${baiName}` }).click(); await expectScreen('gv', 'T21', 'T06 → T21');
    const f21 = gv.locator('.rv-frame');
    ok('T21: the whole Bài — tabs Bài học / Bài tập, Web by default, steps rendered like S03', (await gv.getByRole('tab').allInnerTexts()).map((t) => norm(t).replace(/\s*\d+$/, '')).join('|') === 'Bài học|Bài tập' && (await f21.getAttribute('data-vp')) === 'web' && (await gv.locator('.rv-frame .pv-step').count()) === 3);
    await gv.locator('.rv-bar').getByRole('button', { name: 'Mobile' }).click();
    ok('T21 Web / Mobile switch → 375 px', (await f21.getAttribute('data-vp')) === 'mobile' && (await page.evaluate(() => document.querySelector('[data-frame="gv"] .rv-frame-in').clientWidth)) === 375);
    await gv.locator('.rv-bar').getByRole('button', { name: 'Web' }).click();
    await gv.getByRole('tab', { name: /Bài tập/ }).click();
    const ld21 = await page.evaluate(() => JSON.stringify(D.ld).length); const o21 = gv.locator('.rv-frame .pv-q').first().locator('.opt').first(); await o21.click();
    ok('T21 Bài tập: interactive like S05, nothing recorded', (await gv.locator('.rv-frame .pv-q').count()) === 25 && (await o21.getAttribute('aria-checked')) === 'true' && (await page.evaluate(() => JSON.stringify(D.ld).length)) === ld21);
    await gv.getByRole('button', { name: 'Thoát xem trước' }).click(); await expectScreen('gv', 'T06', 'exit preview → T06');
    await gv.getByRole('button', { name: 'Xem như học viên: Bài 6 – 我会说汉语' }).click();
    ok('T21: published items only by default (Bài 6 has only a Nháp step)', (await gv.locator('.rv-frame .pv-step').count()) === 0);
    await gv.locator('.rv-bar').getByRole('switch', { name: 'Gồm cả mục Nháp' }).click();
    ok('toggle “Gồm cả mục Nháp” → the draft step with a “Nháp” marker', (await gv.locator('.rv-frame .pv-step').count()) === 1 && (await gv.locator('.rv-frame .pv-step .chip', { hasText: 'Nháp' }).count()) === 1);
    await gv.getByRole('button', { name: 'Thoát xem trước' }).click();
    await gv.locator('.bai-row', { hasText: baiName }).locator('.row-btn').first().click(); await expectScreen('gv', 'T18', 'T06 → T18');
    await gv.locator('.page-head').getByRole('button', { name: 'Xuất bản bài' }).click();
    const modal = norm(await gv.locator('.modal').innerText());
    ok('Xuất bản bài: no Nháp items left (approved = published)', modal.includes('Không có mục Nháp nào.'), modal.slice(0, 120));
    await gv.locator('.modal-foot').getByRole('button', { name: 'Xuất bản bài' }).click();
    ok('Bài published “Đã xuất bản bài”', (await toastTxt('gv')).includes('Đã xuất bản bài') && (await gv.locator('.page-head .chip', { hasText: 'Đã xuất bản' }).count()) >= 1);
  });

  /* ---------- 3. GV: Bỏ, AI failure, class (hide), progress ---------- */
  await STEP('gv more', async () => {
    await page.getByRole('button', { name: 'Hướng dẫn' }).click(); await page.locator('#guide [data-scn]', { hasText: 'Review có lỗi chất lượng' }).click();
    await expectScreen('gv', 'T20', 'Kịch bản review');
    const n0 = await page.evaluate(() => baiById('b8').items.length);
    await gv.locator('.rv-bar').getByRole('button', { name: 'Bỏ' }).click();
    ok('T20 “Bỏ”: “Bỏ toàn bộ nội dung AI của phần Bài học? Không khôi phục được.”', (await confirmText(gv)).includes('Bỏ toàn bộ nội dung AI của phần Bài học? Không khôi phục được.'));
    await confirmOk(gv, 'Bỏ');
    ok('T20 “Bỏ”: section discarded, nothing added to the Bài', (await gv.getByRole('tab', { name: /Bài học/ }).innerText()).includes('Đã bỏ') && (await page.evaluate(() => baiById('b8').items.length)) === n0);
    await page.getByRole('button', { name: 'Hướng dẫn' }).click(); await page.locator('#guide [data-scn]', { hasText: 'Tạo bằng AI thất bại' }).click();
    ok('AI failure: “Không tạo được nội dung do sự cố hệ thống. Lượt này không bị tính vào hạn mức.”', (await gv.getByText('Không tạo được nội dung do sự cố hệ thống. Lượt này không bị tính vào hạn mức.').count()) === 1);
    await gv.locator('.ai-card').getByRole('button', { name: 'Thử lại' }).click();
    ok('AI failure → “Thử lại” restarts the run', (await gv.locator('.ai-card[data-ai="running"]').count()) === 1);
    await gv.locator('.gv-nav').getByRole('button', { name: 'Lớp học' }).click(); await expectScreen('gv', 'T02', 'sidebar');
    await gv.getByRole('button', { name: /K12/ }).first().click(); await expectScreen('gv', 'T04', 'class');
    const tabs = (await gv.locator('[role="tab"]').allInnerTexts()).map((t) => norm(t).replace(/\s*\d+$/, ''));
    ok('T04 tabs Tổng quan · Học viên · Nội dung · Tiến độ · Xếp hạng (no “Kết quả thi”)', tabs.join('|') === 'Tổng quan|Học viên|Nội dung|Tiến độ|Xếp hạng', tabs.join('|'));
    await gv.getByRole('tab', { name: /Nội dung/ }).click();
    ok('T04 Nội dung: 2 section columns', (await gv.locator('.content-grid thead th').count()) === 3);
    const r3 = gv.locator('.content-grid tbody tr', { hasText: 'Bài 3' });
    await r3.locator('td').nth(1).getByRole('button', { name: 'Ẩn với lớp' }).click();
    ok('T04: hide confirm “Ẩn «Bài học» của «Bài 3 …» với lớp …”', (await confirmText(gv)).includes('Ẩn «Bài học» của «Bài 3'));
    await confirmOk(gv, 'Ẩn với lớp');
    ok('T04: cell becomes “Đang ẩn”', (await r3.locator('td').nth(1).getByText('Đang ẩn').count()) === 1);
    await gv.getByRole('tab', { name: /Tiến độ/ }).click();
    ok('T04 Tiến độ: exercise-only matrix', (await gv.locator('table.matrix tbody tr').count()) >= 10 && (await gv.locator('table.matrix', { hasText: /Bài thi|Bước học/ }).count()) === 0);
    await gv.getByRole('tab', { name: /Xếp hạng/ }).click();
    ok('T04 Xếp hạng: Hạng · Họ tên · Email · TB bài tập · TB bài thi · Điểm xếp hạng · Cập nhật lần cuối (008 · AC-10.1), one-decimal comma scores', (await gv.locator('table.rank-tbl thead th').allInnerTexts()).map(norm).filter(Boolean).join('|') === 'Hạng|Họ tên|Email|TB bài tập|TB bài thi|Điểm xếp hạng|Cập nhật lần cuối' && (await gv.locator('table.rank-tbl tbody tr').count()) >= 10 && /^\d{1,3},\d$/.test(norm(await gv.locator('table.rank-tbl tbody tr').first().locator('td').nth(5).innerText())));
    await gv.locator('.gv-nav').getByRole('button', { name: 'Dashboard' }).click(); await expectScreen('gv', 'T01', 'sidebar');
  });


  /* ---------- 3b. GV: student activation by email (001) + photos (011) ---------- */
  await STEP('gv activation', async () => {
    await gv.locator('.gv-nav').getByRole('button', { name: 'Học viên' }).click(); await expectScreen('gv', 'T11', 'sidebar');
    const segs = (await gv.locator('.seg[aria-label="Lọc trạng thái"] button').allInnerTexts()).map((t) => norm(t).replace(/\s*\d+$/, ''));
    ok('T11: filters Tất cả · Chưa kích hoạt · Đã kích hoạt · Gửi email thất bại · Đã khóa', segs.join('|') === 'Tất cả|Chưa kích hoạt|Đã kích hoạt|Gửi email thất bại|Đã khóa', segs.join('|'));
    ok('T11: avatar on every row', (await gv.locator('tbody tr').count()) === (await gv.locator('tbody .av-btn .avatar').count()));
    ok('T11: banner “Có 1 học viên gửi email thất bại.”', (await gv.getByText('Có 1 học viên gửi email thất bại.').count()) === 1);
    await gv.locator('.page-head').getByRole('button', { name: 'Thêm học viên' }).click();
    ok('T12: name + email only, no password field', (await gv.locator('.modal input[type="password"]').count()) === 0 && (await gv.locator('.modal').getByText(/Mật khẩu tạm/).count()) === 0);
    await gv.locator('[data-bind="modal.v.name"]').fill('Phạm Thu Trang'); await gv.locator('[data-bind="modal.v.email"]').fill('thutrang.pham@mail.example');
    await gv.locator('.modal-foot').getByRole('button', { name: 'Thêm học viên' }).click();
    const m12 = norm(await gv.locator('.modal').innerText());
    ok('T12: “Vừa thêm (1)” · “Chưa kích hoạt” · “Học viên chỉ đăng nhập được sau khi bạn bấm Kích hoạt ở danh sách học viên.”', m12.includes('Vừa thêm (1)') && m12.includes('Chưa kích hoạt') && m12.includes('Học viên chỉ đăng nhập được sau khi bạn bấm Kích hoạt ở danh sách học viên.'));
    await gv.locator('.modal-foot').getByRole('button', { name: 'Đóng' }).click();
    const row = gv.locator('tbody tr', { hasText: 'Phạm Thu Trang' });
    ok('T11: new student first, “Chưa kích hoạt”', (await gv.locator('tbody tr').first().innerText()).includes('Phạm Thu Trang') && (await row.locator('.chip', { hasText: 'Chưa kích hoạt' }).count()) === 1);
    await row.getByRole('button', { name: 'Kích hoạt Phạm Thu Trang' }).click();
    ok('Kích hoạt → “Đang gửi email”', (await row.locator('.chip', { hasText: 'Đang gửi email' }).count()) === 1);
    await page.waitForTimeout(2600);
    ok('→ “Đã kích hoạt” + toast “Đã gửi email đăng nhập tới thutrang.pham@mail.example.”', (await row.locator('.chip', { hasText: 'Đã kích hoạt' }).count()) === 1 && (await toastTxt('gv')).includes('Đã gửi email đăng nhập tới thutrang.pham@mail.example.'));
    ok('GV never sees a student password', !(await gv.innerText()).includes('k7Rm2xQp9T') && (await gv.locator('.mono', { hasText: /^[A-Za-z0-9]{10}$/ }).count()) === 0);
    for (const n of ['Diệp Gia Phúc', 'Cao Thanh Hương', 'Lâm Quang Vinh']) await gv.getByRole('checkbox', { name: 'Chọn ' + n }).click();
    await gv.locator('.bulk-bar').getByRole('button', { name: 'Kích hoạt' }).click();
    const bc = await confirmText(gv);
    ok('bulk: “Kích hoạt 2 học viên? Hệ thống sẽ tạo tài khoản và gửi email đăng nhập tới từng học viên.” + 1 bỏ qua', bc.includes('Kích hoạt 2 học viên? Hệ thống sẽ tạo tài khoản và gửi email đăng nhập tới từng học viên.') && bc.includes('1 học viên sẽ được bỏ qua'), bc);
    await confirmOk(gv, 'Kích hoạt'); await page.waitForTimeout(2600);
    ok('bulk summary “Kích hoạt xong: 1 đã gửi email, 1 gửi email thất bại, 1 bỏ qua.”', (await gv.getByText('Kích hoạt xong: 1 đã gửi email, 1 gửi email thất bại, 1 bỏ qua.').count()) === 1);
    const rd = gv.locator('tbody tr', { hasText: 'Diệp Gia Phúc' });
    ok('failed row: “Gửi email thất bại” + reason + “Gửi lại”', (await rd.innerText()).includes('Địa chỉ email không nhận được thư. Hãy kiểm tra lại email.') && (await rd.locator('.chip', { hasText: 'Gửi email thất bại' }).count()) === 1 && (await rd.getByRole('button', { name: 'Gửi lại Diệp Gia Phúc' }).count()) === 1);
    await gv.getByText('Có 2 học viên gửi email thất bại.').locator('xpath=..').getByRole('button', { name: 'Xem' }).click();
    ok('banner “Xem” → filter Gửi email thất bại (2)', (await gv.locator('tbody tr').count()) === 2);
    await rd.getByRole('button', { name: 'Sửa Diệp Gia Phúc' }).click(); await gv.locator('[data-bind="modal.v.email"]').fill('giaphuc.diep@hocmail.example');
    await gv.locator('.modal-foot').getByRole('button', { name: 'Lưu thay đổi' }).click();
    await rd.getByRole('button', { name: 'Gửi lại Diệp Gia Phúc' }).click(); await page.waitForTimeout(2600);
    ok('fix email + “Gửi lại” → Đã kích hoạt', (await page.evaluate(() => stu('s26').status)) === 'active' && (await toastTxt('gv')).includes('Đã gửi email đăng nhập tới giaphuc.diep@hocmail.example.'));
    await gv.locator('.seg[aria-label="Lọc trạng thái"] button').first().click(); await gv.locator('[data-bind="q"]').fill('Trần Gia Bảo');
    await gv.getByRole('button', { name: 'Đặt lại mật khẩu Trần Gia Bảo' }).click();
    ok('Đặt lại mật khẩu: confirm “Học viên sẽ bị đăng xuất … Mật khẩu mới sẽ được gửi tới email của học viên.”', (await confirmText(gv)).includes('Học viên sẽ bị đăng xuất khỏi mọi thiết bị. Mật khẩu mới sẽ được gửi tới email của học viên.'));
    await confirmOk(gv, 'Đặt lại mật khẩu');
    ok('→ “Mật khẩu mới đang được gửi tới giabao.tran@mail.example.” (no password shown)', (await toastTxt('gv')).includes('Mật khẩu mới đang được gửi tới giabao.tran@mail.example.') && (await gv.locator('.modal').count()) === 0);
    await gv.getByRole('button', { name: 'Xem mẫu email' }).click();
    const dv = norm(await gv.locator('.drawer').innerText());
    ok('email preview = 001 wording, password masked', dv.includes('[SAT] Tài khoản học tập của bạn đã sẵn sàng') && dv.includes('Giáo viên Lưu Thị Lan đã tạo cho bạn một tài khoản học tập trên SAT.') && dv.includes('Bạn có thể đổi mật khẩu bất kỳ lúc nào trong mục Hồ sơ của tôi.') && dv.includes('Nếu bạn không biết giáo viên này, hãy bỏ qua thư này.') && dv.includes('Đây là thư tự động, vui lòng không trả lời.') && dv.includes('••••••••••'));
    await gv.locator('.drawer').getByRole('button', { name: 'Thư mật khẩu mới' }).click();
    ok('email preview: password-reset mail', (await gv.locator('.drawer').innerText()).includes('[SAT] Mật khẩu mới cho tài khoản của bạn'));
    await gv.locator('.drawer').getByRole('button', { name: 'Đóng' }).last().click();
    await gv.locator('.page-head').getByRole('button', { name: 'Import Excel' }).click(); await gv.locator('.modal').getByRole('button', { name: 'Chọn tệp' }).click();
    await gv.locator('.modal-foot').getByRole('button', { name: /Nhập 5 học viên hợp lệ/ }).click();
    ok('Import Excel: “Đã thêm 5 học viên ở trạng thái Chưa kích hoạt.”', (await gv.locator('.modal').innerText()).includes('Đã thêm 5 học viên ở trạng thái Chưa kích hoạt.'));
    await gv.locator('.modal-foot').getByRole('button', { name: 'Đóng' }).click();
    await gv.locator('[data-bind="q"]').fill('Minh Anh');
    await gv.getByRole('button', { name: 'Xem ảnh đại diện của Nguyễn Minh Anh' }).click();
    ok('GV photo viewer: enlarged + “Gỡ ảnh”', (await gv.locator('.modal .av-big .avatar.ph').count()) === 1 && (await gv.locator('.modal-foot').getByRole('button', { name: 'Gỡ ảnh' }).count()) === 1);
    await gv.locator('.modal-foot').getByRole('button', { name: 'Gỡ ảnh' }).click();
    ok('Gỡ ảnh: “Gỡ ảnh đại diện của Nguyễn Minh Anh? Ảnh sẽ bị xóa vĩnh viễn và học viên sẽ nhận được thông báo.”', (await confirmText(gv)).includes('Gỡ ảnh đại diện của Nguyễn Minh Anh? Ảnh sẽ bị xóa vĩnh viễn và học viên sẽ nhận được thông báo.'));
    await confirmOk(gv, 'Gỡ ảnh');
    ok('→ “Đã gỡ ảnh.” + default avatar', (await toastTxt('gv')).includes('Đã gỡ ảnh.') && (await gv.locator('tbody .avatar.ph').count()) === 0);
    await gv.locator('[data-bind="q"]').fill('Trần Gia Bảo'); await gv.locator('tbody .row-btn').first().click(); await expectScreen('gv', 'T15', 'name → T15');
    await gv.getByRole('button', { name: 'Xem ảnh bìa của Trần Gia Bảo' }).click();
    ok('T15: history = one submission per set (no “Lần” column)', (await gv.locator('table thead th', { hasText: /^Lần$/ }).count()) === 0);
    ok('T15: cover + avatar header, cover viewer with “Gỡ ảnh”', (await gv.locator('.modal').innerText()).includes('Ảnh bìa · Trần Gia Bảo') && (await gv.locator('.modal-foot').getByRole('button', { name: 'Gỡ ảnh' }).count()) === 1);
    await gv.locator('.modal-foot').getByRole('button', { name: 'Đóng' }).click();
  });


  /* ---------- 3c. GV: T01 Dashboard v7 — class list with compact tracking (009) ---------- */
  await STEP('dashboard', async () => {
    await page.keyboard.press('Escape');
    await gv.locator('.gv-nav').getByRole('button', { name: 'Dashboard' }).click(); await expectScreen('gv', 'T01', 'sidebar');
    const kp = (await gv.locator('.kpi').allInnerTexts()).map(norm);
    ok('T01: exactly 2 KPIs — “Lớp đang hoạt động 4 / 6 lớp” + “Bài đang chờ AI duyệt”', kp.length === 2 && kp[0].includes('Lớp đang hoạt động') && kp[0].includes('4 / 6 lớp') && kp[1].includes('Bài đang chờ AI duyệt'), kp.join(' | '));
    ok('T01: no HV-count / average KPIs, no global “Cần chú ý”, no “Tiến độ học viên” tab', (await gv.getByText(/Học viên đang học|Tiến độ trung bình|Tiến độ học viên/).count()) === 0 && (await gv.locator('[role="tab"]').allInnerTexts()).map((t) => norm(t).replace(/\s*\d+$/, '')).join('|') === 'Tất cả|Đang hoạt động|Đã kết thúc');
    await gv.locator('.kpi-ai').click();
    ok('KPI “Bài đang chờ AI duyệt” opens the waiting list (→ T20)', (await gv.locator('.drawer').count()) === 1 || (await gv.getAttribute('data-screen')) === 'T20');
    if ((await gv.locator('.drawer').count())) await gv.locator('.drawer').getByRole('button', { name: /Đóng|Close/ }).last().click().catch(() => page.keyboard.press('Escape'));
    const rows = gv.locator('.cls-row');
    ok('default status tab = Đang hoạt động (4 classes)', (await gv.locator('[role="tab"][aria-selected="true"]').innerText()).startsWith('Đang hoạt động') && (await rows.count()) === 4);
    await gv.getByRole('tab', { name: /Tất cả/ }).click();
    ok('class list: 6 classes (Tất cả)', (await rows.count()) === 6);
    await gv.getByRole('tab', { name: /Đã kết thúc/ }).click();
    ok('tab Đã kết thúc → 2 classes', (await rows.count()) === 2 && (await gv.locator('.cls-row .chip', { hasText: 'Đã kết thúc' }).count()) === 2);
    await gv.getByRole('tab', { name: /Đang hoạt động/ }).click();
    ok('tab Đang hoạt động → 4 (Sắp bắt đầu counts as active, with “Sắp bắt đầu dd/mm”)', (await rows.count()) === 4 && (await gv.locator('.cls-row', { hasText: 'Sắp bắt đầu 24/10' }).count()) === 1);
    await gv.getByRole('tab', { name: /Tất cả/ }).click();
    ok('each row: HSK + giáo trình, status, “Tạo dd/mm/yyyy”, sĩ số', (await gv.locator('.cls-row', { hasText: 'K12' }).innerText()).includes('Tạo 28/09/2026') && (await gv.locator('.cls-row', { hasText: 'K12' }).innerText()).includes('12 HV') && (await gv.locator('.cls-row', { hasText: 'K12' }).innerText()).includes('HSK1 Chuẩn'));
    const k12 = gv.locator('.cls-row', { hasText: '(K12)' });
    ok('K12: Top 3 with medals, avatar, name, points', (await k12.locator('.t3-i').count()) === 3 && (await k12.locator('.t3').innerText()).includes('🥇') && (await k12.locator('.t3-i .avatar').count()) === 3 && /\d{2,}/.test(await k12.locator('.t3-i').first().innerText()));
    const pop = gv.locator('.dp-pop'); const dayBtn = (d) => pop.getByRole('button', { name: d, exact: true });
    await gv.locator('[data-dpfield="from"]').click();
    ok('click “Từ ngày” → calendar popover under the field (Vietnamese: “Tháng 10, 2026”, T2…CN, weeks start Thứ Hai)', (await pop.count()) === 1 && (await pop.locator('.dp-title').innerText()) === 'Tháng 10, 2026' && (await pop.locator('.dp-wd').allInnerTexts()).join(',') === 'T2,T3,T4,T5,T6,T7,CN' && (await gv.locator('.dp-anchor', { has: page.locator('[data-dpfield="from"]') }).locator('.dp-pop').count()) === 1);
    ok('today highlighted; future days and next month disabled', (await pop.locator('.dp-day.is-today').getAttribute('aria-label')) === '20/10/2026' && (await dayBtn('21/10/2026').isDisabled()) && (await pop.getByRole('button', { name: 'Tháng sau' }).isDisabled()));
    await dayBtn('05/10/2026').click(); await page.keyboard.press('Escape');
    ok('Esc closes the popover without applying', (await pop.count()) === 0 && (await rows.count()) === 6 && (await gv.locator('[data-dpfield="from"]').innerText()).includes('dd/mm/yyyy'));
    await gv.locator('[data-dpfield="from"]').click(); await dayBtn('05/10/2026').click(); await gv.locator('.kpis').click();
    ok('outside click closes without applying', (await pop.count()) === 0 && (await rows.count()) === 6);
    await gv.locator('[data-dpfield="from"]').click();
    await pop.getByRole('button', { name: 'Tháng trước' }).click(); await pop.getByRole('button', { name: 'Tháng trước' }).click();
    ok('‹ › navigate months → “Tháng 8, 2026”', (await pop.locator('.dp-title').innerText()) === 'Tháng 8, 2026');
    await dayBtn('01/08/2026').click(); await pop.getByRole('button', { name: 'Tháng sau' }).click(); await dayBtn('30/09/2026').click();
    ok('range by two clicks, days in between highlighted', (await pop.locator('.dp-day.in-range').count()) === 29 && (await pop.locator('.dp-day.is-end').getAttribute('aria-label')) === '30/09/2026' && (await pop.locator('.dp-sel').innerText()) === '01/08/2026 – 30/09/2026');
    await pop.getByRole('button', { name: 'Áp dụng' }).click();
    ok('“Áp dụng” → fields show dd/MM/yyyy, filter 01/08–30/09/2026 → K12 + K07', (await gv.locator('[data-dpfield="from"]').innerText()).includes('01/08/2026') && (await gv.locator('[data-dpfield="to"]').innerText()).includes('30/09/2026') && (await rows.count()) === 2 && (await gv.locator('.cls-row', { hasText: '(K12)' }).count()) === 1 && (await gv.locator('.cls-row', { hasText: '(K07)' }).count()) === 1);
    await gv.locator('[data-dpfield="to"]').click(); await pop.getByRole('button', { name: '7 ngày qua' }).click();
    ok('preset “7 ngày qua” → 14/10/2026 – 20/10/2026', (await pop.locator('.dp-sel').innerText()) === '14/10/2026 – 20/10/2026');
    await page.keyboard.press('Escape');
    await gv.getByRole('button', { name: 'Theo tháng' }).click(); await gv.locator('[data-dpfield="month"]').click();
    ok('“Theo tháng”: month grid T1…T12 with year arrows; future months disabled', (await pop.locator('.dp-mon').count()) === 12 && (await pop.locator('.dp-title').innerText()) === 'Năm 2026' && (await pop.getByRole('button', { name: 'Tháng 11, 2026' }).isDisabled()) && (await pop.getByRole('button', { name: 'Năm sau' }).isDisabled()));
    await pop.getByRole('button', { name: 'Tháng 10, 2026' }).click(); await pop.getByRole('button', { name: 'Áp dụng' }).click();
    ok('month 10/2026 applied → field “10/2026” → K15 + K03', (await gv.locator('[data-dpfield="month"]').innerText()).includes('10/2026') && (await rows.count()) === 2 && (await gv.locator('.cls-row', { hasText: '(K15)' }).count()) === 1 && (await gv.locator('.cls-row', { hasText: '(K03)' }).count()) === 1);
    await gv.getByRole('button', { name: 'Mọi thời gian' }).click();
    ok('“Mọi thời gian” clears the filter', (await rows.count()) === 6 && (await gv.locator('[data-dpfield="month"]').innerText()).includes('MM/yyyy'));
    await gv.locator('[data-dpfield="month"]').click(); await pop.getByRole('button', { name: 'Năm trước' }).click();
    ok('year arrow → “Năm 2025”', (await pop.locator('.dp-title').innerText()) === 'Năm 2025');
    await pop.getByRole('button', { name: 'Năm sau' }).click(); await pop.getByRole('button', { name: 'Tháng 3, 2026' }).click(); await pop.getByRole('button', { name: 'Áp dụng' }).click();
    ok('empty result → “Không có lớp nào phù hợp với bộ lọc.”', (await rows.count()) === 0 && (await gv.getByText('Không có lớp nào phù hợp với bộ lọc.').count()) === 1);
    await gv.getByRole('button', { name: 'Xóa bộ lọc' }).click();
    ok('“Xóa bộ lọc” → back to the default tab Đang hoạt động (4)', (await rows.count()) === 4);
    ok('T01 row: no progress bar / “x%” / “Cần chú ý”; compact tracker “Luyện mẫu câu · Hạn nộp 20/10 · Đã làm 7/12”', (await gv.locator('.cr-prog, .att-btn').count()) === 0 && norm(await k12.locator('.trk-sum').innerText()) === 'Luyện mẫu câu · Hạn nộp 20/10 · Đã làm 7/12', await k12.locator('.cr-trk').innerText());
    await k12.getByRole('button', { name: /Đã làm \/ Chưa làm/ }).click();
    const trk = gv.locator('[data-trkpanel="k12"]');
    ok('tracker: exercise picker grouped by Bài with deadlines; default = nearest upcoming deadline (Luyện mẫu câu, 20/10)', (await trk.locator('select optgroup').count()) >= 3 && (await trk.locator('select').inputValue()) === 'b1e4' && (await trk.locator('select option').first().innerText()).includes('Hạn 05/10') && (await trk.locator('.trk-head').innerText()).includes('Hạn nộp 20/10'));
    ok('tracker: “Đã làm (7)” with submission times · “Chưa làm (5)”', (await trk.locator('.trk-ttl.is-done').innerText()) === 'Đã làm (7)' && (await trk.locator('.trk-ttl.is-todo').innerText()) === 'Chưa làm (5)' && /\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/.test(await trk.locator('.trk-col').first().innerText()));
    ok('“Chưa làm”: in-progress → “Đang làm”; locked HV stays, tagged “Đã khóa”', (await trk.locator('.trk-col').nth(1).locator('.trk-row', { hasText: 'Nguyễn Minh Anh' }).innerText()).includes('Đang làm') && (await trk.locator('.trk-col').nth(1).locator('.trk-row', { hasText: 'Bùi Thanh Tùng' }).innerText()).includes('Đã khóa'));
    await gv.locator('.cls-row', { hasText: '(K07)' }).getByRole('button', { name: /Đã làm \/ Chưa làm/ }).click();
    ok('only one class expanded at a time', (await gv.locator('[data-trkpanel]').count()) === 1 && (await gv.locator('[data-trkpanel="k07"]').count()) === 1);
    await k12.getByRole('button', { name: /Đã làm \/ Chưa làm/ }).click();
    await trk.locator('select').selectOption('b1e2');
    ok('pick “Luyện từ mới” (hạn 05/10): late submissions tagged “Nộp muộn”', (await trk.locator('.trk-col').first().locator('.chip', { hasText: 'Nộp muộn' }).count()) >= 1 && (await trk.locator('.trk-head').innerText()).includes('đã qua'));
    await gv.locator('[data-trkpanel="k12"] select').selectOption('b4e1');
    ok('pick “Luyện tập Bài 4” (hạn 16/10): “Chưa làm” rows tagged “Quá hạn”', (await gv.locator('[data-trkpanel="k12"] .trk-col').nth(1).locator('.chip', { hasText: 'Quá hạn' }).count()) >= 1);
    await gv.locator('[data-trkpanel="k12"] select').selectOption('b1e4');
    await gv.locator('[data-trkpanel="k12"]').getByRole('button', { name: 'Xem mẫu email nhắc' }).click();
    const rmv = norm(await gv.locator('.drawer').innerText());
    ok('reminder email preview: class, Bài, sets due today in ONE email, deadline, link', rmv.includes('[SAT] Hôm nay là hạn nộp bài tập – HSK1 – Tối 2·4·6 (K12)') && rmv.includes('Gửi lúc 08:00 ngày 20/10/2026') && (await gv.locator('.drawer .mail-list li').count()) === 2 && rmv.includes('Hạn nộp 23:59 20/10/2026') && rmv.includes('Làm bài ngay'), rmv.slice(0, 160));
    await gv.locator('.drawer').getByRole('button', { name: 'Đóng' }).last().click();
    await page.getByRole('button', { name: 'Hướng dẫn' }).click(); await page.locator('#guide [data-scn]', { hasText: 'Ngày deadline 08:00' }).click();
    ok('Kịch bản “Ngày deadline 08:00” → “Đã gửi nhắc 08:00 · 4 HV” (activated, not locked, not submitted)', (await gv.locator('[data-trkpanel="k12"] .trk-rm').innerText()).includes('Đã gửi nhắc 08:00 · 4 HV'));
    await gv.locator('[data-trkpanel="k12"] .trk-col').first().locator('.trk-row').first().click(); await expectScreen('gv', 'T15', 'tracker student → T15');
    await page.evaluate(() => openInProto('T14', 'gv'));
    ok('T14: read-only submission without the “Lượt khác” switch', (await gv.getAttribute('data-screen')) === 'T14' && (await gv.getByText(/Lượt khác|Cao nhất/).count()) === 0);
    await page.evaluate(() => openInProto('T04', 'gv', null, { cls: 'k12', tab: 'content' }));
    await gv.locator('[data-dlfield="dl|b1e7"]').click();
    ok('T04 Nội dung: “Hạn nộp” per set opens the popup date picker (future dates allowed)', (await gv.locator('.dp-pop').count()) === 1 && !(await gv.locator('.dp-pop').getByRole('button', { name: '25/10/2026', exact: true }).isDisabled()));
    await gv.locator('.dp-pop').getByRole('button', { name: '25/10/2026', exact: true }).click(); await gv.locator('.dp-pop').getByRole('button', { name: 'Áp dụng' }).click();
    ok('set deadline → 23:59 25/10/2026', (await toastTxt('gv')).includes('Đã đặt hạn nộp 23:59 25/10/2026') && (await gv.locator('[data-dlfield="dl|b1e7"]').innerText()).includes('25/10/2026'));
    await gv.locator('[data-dlfield="dl|b5e1"]').click(); await gv.locator('.dp-pop').getByRole('button', { name: '10/10/2026', exact: true }).click();
    ok('past date → warning in the picker', (await gv.locator('.dp-warn').innerText()).includes('Ngày đã qua'));
    await gv.locator('.dp-pop').getByRole('button', { name: 'Áp dụng' }).click();
    ok('past date applied with a warning toast', (await toastTxt('gv')).includes('ngày đã qua'));
    await gv.locator('[data-dlfield="dlb|b3"]').click(); await gv.locator('.dp-pop').getByRole('button', { name: '30/10/2026', exact: true }).click(); await gv.locator('.dp-pop').getByRole('button', { name: 'Áp dụng' }).click();
    ok('bulk “Đặt hạn cho mọi bộ của bài” → 2 sets of Bài 3', (await toastTxt('gv')).includes('cho 2 bộ bài tập') && (await gv.locator('[data-dlfield="dl|b3e2"]').innerText()).includes('30/10/2026'));
    await gv.locator('[data-dlfield="dl|b3e2"]').click(); await gv.locator('.dp-pop').getByRole('button', { name: 'Xóa' }).click();
    ok('clear a deadline → “Đặt hạn”', (await gv.locator('[data-dlfield="dl|b3e2"]').innerText()).includes('Đặt hạn'));
    ok('deadlines are per class (K07 unaffected)', (await page.evaluate(() => [dlOf('k07', 'b1e7'), dlOf('k12', 'b1e7')].join(','))) === ',2026-10-25');
    await gv.getByRole('tab', { name: /Tiến độ/ }).click();
    ok('T04 Tiến độ: same picker + Đã làm / Chưa làm + HV × set matrix (✓ / ✓ muộn / — / Quá hạn)', (await gv.locator('.trk select').count()) === 1 && (await gv.locator('table.matrix td.mx-late').count()) >= 1 && (await gv.locator('table.matrix td.mx-over').count()) >= 1 && (await gv.locator('table.matrix td.mx-ok').count()) >= 1);
    ok('T04 Tiến độ: class summary, then picker sharing the T01 selection (Luyện mẫu câu)', (await gv.locator('.t04-sum').innerText()).includes('Học viên') && (await gv.locator('.trk select').inputValue()) === 'b1e4');
    ok('“Bảng theo dõi”: one Bài at a time (Bài 1 → 4 sets)', (await gv.locator('[data-bind="mxBai"]').inputValue()) === 'b1' && (await gv.locator('table.matrix thead th.mx-h').count()) === 4 && (await gv.locator('table.matrix', { hasText: /Hoạt động gần nhất|Hạng/ }).count()) === 0);
    await gv.locator('[data-bind="mxBai"]').selectOption('b3');
    ok('Bài selector → Bài 3 columns: only sets with a deadline (b3e2 was just cleared — 009 · AC-1.8)', (await gv.locator('table.matrix thead th.mx-h').count()) === 1);
    await gv.locator('.trk select').selectOption('b5e1');
    ok('“Chưa làm”: overdue + in-progress → only “Quá hạn”', (await gv.locator('.trk-col').nth(1).locator('.trk-row', { hasText: 'Nguyễn Minh Anh' }).innerText()).includes('Quá hạn') && !(await gv.locator('.trk-col').nth(1).locator('.trk-row', { hasText: 'Nguyễn Minh Anh' }).innerText()).includes('Đang làm'));
    await gv.locator('.trk select').selectOption('b1e4');
    await gv.locator('.gv-nav').getByRole('button', { name: 'Dashboard' }).click();
    await gv.getByRole('tab', { name: /Đã kết thúc/ }).click();
    await gv.locator('.cls-row', { hasText: '(K09)' }).locator('.cr-name').click(); await expectScreen('gv', 'T04', 'class row → T04');
    await page.evaluate(() => openInProto('T01', 'gv', null, { fresh: true }));
    ok('new workspace: onboarding kept', (await gv.getByText('Bắt đầu sử dụng').count()) === 1);
    await gv.locator('.gv-nav').getByRole('button', { name: 'Dashboard' }).click();
  });

  /* ---------- 4. HV ---------- */
  await STEP('hv', async () => {
    await page.getByRole('button', { name: 'Đổi vai trò' }).click();
    ok('“Đổi vai trò” returns to the picker', (await page.locator('#landing').isVisible()) && !(await page.locator('#view-gv').isVisible()));
    await page.locator('.role-card[data-role="hv"]').click();
    ok('HV role: centred phone', (await page.locator('#view-hv').isVisible()) && await page.evaluate(() => { const r = document.querySelector('#view-hv .scaler').getBoundingClientRect(); return Math.abs(r.left + r.width / 2 - innerWidth / 2) < 30; }));
    await expectScreen('hv', 'A01', 'HV role starts at login');
    await hv.getByRole('button', { name: 'Đăng nhập', exact: true }).click(); await expectScreen('hv', 'S01', 'emailed password → straight to S01 (A04 removed)');
    ok('S01: 3 classes; cards show “Bài tập đã làm x/y”', (await hv.locator('.class-card').count()) === 3 && (await hv.locator('.class-card', { hasText: 'Bài tập đã làm' }).count()) === 2);
    await hv.locator('.class-card', { hasText: 'K12' }).click(); await expectScreen('hv', 'S02', 'HV');
    ok('S02: 6 Bài incl. the Bài just published by GV', (await hv.locator('.lrow:not(.mem-entry):not(.exam-entry)').count()) === 6 && (await hv.locator('.lrow', { hasText: 'Bài 16' }).count()) === 1);
    ok('S02: Bài 1 “1/4 bộ bài tập”; Bài 2 “Chưa có bài tập”', (await hv.locator('.lrow', { hasText: 'Bài 1 –' }).innerText()).includes('1/4 bộ bài tập') && (await hv.locator('.lrow', { hasText: 'Bài 2' }).innerText()).includes('Chưa có bài tập'));
    ok('S02: no lộ trình wording; one exam entry “Bài thi của lớp (N)” (003 · AC-13.8)', (await hv.locator('.hv-body').getByText(/lộ trình|Lộ trình/).count()) === 0 && (await hv.locator('.exam-entry', { hasText: /Bài thi của lớp \(\d+\)/ }).count()) === 1);
    await hv.locator('.lrow', { hasText: 'Bài 1 –' }).click(); await expectScreen('hv', 'S11', 'HV');
    ok('S11: tabs Bài học · Bài tập only', (await hv.locator('[role="tab"]').allInnerTexts()).map((t) => norm(t).replace(/\s*\d+$/, '')).join('|') === 'Bài học|Bài tập');
    ok('S11: step rows have no status chips', (await hv.locator('.path-row .chip').count()) === 0);
    await hv.locator('.path-row', { hasText: 'Hội thoại: Xin chào' }).click(); await expectScreen('hv', 'S03', 'HV');
    ok('S03: pure viewer — “Bước 3/3”, no “Đánh dấu đã học”', (await hv.getByText(/Bước 3\/3/).count()) === 1 && (await hv.getByText(/Đánh dấu đã học|Đã học/).count()) === 0);
    const py = await hv.locator('.dlg-line .py').count(); await hv.getByRole('switch', { name: 'Pinyin' }).click();
    ok('S03: Pinyin switch', py > 0 && (await hv.locator('.dlg-line .py').count()) === 0); await hv.getByRole('switch', { name: 'Pinyin' }).click();
    ok('S03: last step → “Về trang bài”', (await hv.locator('.hv-foot').getByRole('button', { name: 'Về trang bài' }).count()) === 1);
    await hv.locator('.hv-foot').getByRole('button', { name: /Trước/ }).click();
    ok('S03: “Trước” stays inside Bài học → Bước 2/3', (await hv.getByText(/Bước 2\/3/).count()) === 1);
    await hv.locator('.hv-foot').getByRole('button', { name: /Trước/ }).click();
    await hv.getByRole('button', { name: 'Học flashcard' }).first().click(); await expectScreen('hv', 'S04', 'flashcards');
    await hv.getByRole('button', { name: /Lật thẻ/ }).click(); await hv.getByRole('button', { name: /Đã thuộc/ }).click();
    ok('S04: flip + “Đã thuộc” advances', (await hv.getByText(/Thẻ \d+\/\d+/).count()) >= 1);
    await hv.locator('.hv-head button').first().click(); await expectScreen('hv', 'S03', 'back');
    await hv.locator('.hv-foot').getByRole('button', { name: /Tiếp/ }).click(); await hv.locator('.hv-foot').getByRole('button', { name: /Tiếp/ }).click();
    ok('S03: “Tiếp” → Bước 3/3', (await hv.getByText(/Bước 3\/3/).count()) === 1);
    ok('S03: “Luyện tập: …” button', (await hv.getByRole('button', { name: /Luyện tập:/ }).count()) >= 1);
    await hv.locator('.hv-foot').getByRole('button', { name: 'Về trang bài' }).click(); await expectScreen('hv', 'S11', 'HV');
    await hv.getByRole('tab', { name: /Bài tập/ }).click();
    ok('S11 Bài tập: set rows with status', (await hv.locator('.path-row .chip', { hasText: 'Đang làm' }).count()) === 1 && (await hv.locator('.path-row .chip', { hasText: 'Đã hoàn thành' }).count()) === 1);
    ok('S11: deadline labels “Hạn hôm nay” ×2, “Hạn nộp 25/10”, and “Nộp muộn” on a late submission', (await hv.locator('.path-row .dl-chip', { hasText: 'Hạn hôm nay' }).count()) === 2 && (await hv.locator('.path-row .dl-chip', { hasText: 'Hạn nộp 25/10' }).count()) === 1 && (await hv.locator('.path-row .late-chip').count()) === 1);
    await hv.locator('.path-row', { hasText: 'Luyện mẫu câu' }).click(); await expectScreen('hv', 'S05', 'HV');
    ok('S05: “Hạn hôm nay” + “Hạn nộp 23:59 20/10/2026”', (await hv.locator('.dl-chip', { hasText: 'Hạn hôm nay' }).count()) === 1 && (await hv.getByText(/Hạn nộp 23:59 20\/10\/2026/).count()) === 1);
    await hv.getByRole('button', { name: 'Tiếp tục làm' }).click();
    ok('S05: resumes at question 4', (await hv.locator('.q-meta').innerText()).includes('Câu 4/6'));
    for (const p of ['你们', '好', '！']) await hv.locator('.order-bank .tile', { hasText: p }).click();
    await hv.getByRole('button', { name: 'Câu sau ›' }).click(); await hv.locator('.cloze-in').fill('您');
    await hv.getByRole('button', { name: 'Câu sau ›' }).click(); await hv.locator('.opt').first().click();
    await hv.locator('.q-nav .qn').nth(1).click(); await hv.locator('.opt').nth(1).click();
    await hv.locator('.hv-head').getByRole('button', { name: 'Nộp bài' }).click();
    ok('S05: submit confirm “Bạn đã hoàn thành tất cả câu hỏi”', (await confirmText(hv)).includes('Bạn đã hoàn thành tất cả câu hỏi'));
    await confirmOk(hv, 'Nộp bài'); await expectScreen('hv', 'S06', 'submitted');
    ok('S06 “Xem lại bài làm” right after submitting: 6 / 6 điểm, every question with the HV answer, Đúng/Sai + points, correct answer; no “Làm lại”', (await hv.locator('.hv-head h1').innerText()) === 'Xem lại bài làm' && norm(await hv.locator('.res-score').innerText()).includes('6 / 6 điểm (100%)') && (await hv.locator('.rv-key').count()) === 6 && (await hv.getByText('Bạn trả lời:').count()) === 6 && (await hv.getByRole('button', { name: /Làm lại/ }).count()) === 0 && (await hv.getByText(/Lượt|lượt/).count()) === 0);
    ok('S06: on-time submission has no “Nộp muộn”', (await hv.locator('.late-chip').count()) === 0);
    await hv.locator('.hv-foot').getByRole('button', { name: 'Về trang bài' }).click(); await expectScreen('hv', 'S11', 'HV');
    ok('S11: progress now “2/4 bộ bài tập”, row “Đã hoàn thành · 6/6”', (await hv.getByText('2/4 bộ bài tập').count()) === 1 && (await hv.locator('.path-row', { hasText: 'Luyện mẫu câu' }).innerText()).includes('Đã hoàn thành · 6/6'));
    await hv.locator('.path-row', { hasText: 'Luyện mẫu câu' }).click(); await expectScreen('hv', 'S06', 'S11 “Đã hoàn thành” → S06');
    ok('S11 “Đã hoàn thành” opens the review (answers + explanations always shown)', (await hv.locator('.hv-head h1').innerText()) === 'Xem lại bài làm' && (await hv.locator('.rv-key').count()) === 6);
    await hv.locator('.hv-foot').getByRole('button', { name: 'Về trang bài' }).click(); await expectScreen('hv', 'S11', 'back to S11');
    await hv.getByRole('button', { name: 'Quay lại' }).click(); await expectScreen('hv', 'S02', 'back');
    await hv.locator('.lrow', { hasText: 'Bài 3' }).click();
    ok('GV hid Bài học of Bài 3 → HV S11 shows only “Bài tập”', (await hv.locator('[role="tab"]').allInnerTexts()).map((t) => norm(t).replace(/\s*\d+$/, '')).join('|') === 'Bài tập');
    await hv.getByRole('button', { name: 'Quay lại' }).click();
    await hv.locator('.lrow', { hasText: 'Bài 16' }).click(); await expectScreen('hv', 'S11', 'AI Bài');
    ok('S11 (AI Bài): Bài học 3 · Bài tập 4 published, no AI labels for HV', norm((await hv.locator('[role="tab"]').allInnerTexts()).join('|')) === 'Bài học 3|Bài tập 4' && (await hv.locator('.chip.ai, .chip.ai-soft').count()) === 0 && (await hv.getByText(/AI tạo/).count()) === 0, (await hv.locator('[role="tab"]').allInnerTexts()).join('|'));
    await hv.getByRole('button', { name: 'Quay lại' }).click(); await expectScreen('hv', 'S02', 'back');
    ok('S02: entry “Thành viên (12)”', (await hv.locator('.mem-entry', { hasText: 'Thành viên (12)' }).count()) === 1);
    await hv.locator('.mem-entry').click();
    const mrows = hv.locator('.mem-row');
    ok('Thành viên: 12 rows, own row first with “Bạn”, only avatar + name', (await mrows.count()) === 12 && (await mrows.first().innerText()).includes('Nguyễn Minh Anh') && (await mrows.first().locator('.chip', { hasText: 'Bạn' }).count()) === 1 && !(await hv.innerText()).includes('@'));
    await hv.locator('.mem-row', { hasText: 'Lê Thu Hà' }).click(); await expectScreen('hv', 'S12', 'member → S12');
    const p12 = await hv.innerText();
    ok('S12: cover + avatar + name, “Lớp học chung (2)” only (K12 + K09)', p12.includes('Lê Thu Hà') && p12.toLowerCase().includes('lớp học chung (2)') && (await hv.locator('.pc-card').count()) === 2 && (await hv.locator('.pcover').count()) === 1);
    ok('S12: progress, points and rank per shared class', (await hv.locator('.pc-card', { hasText: /\d+ điểm/ }).count()) === 2 && /Hạng \d+\/\d+|Chưa có hạng/.test(p12));
    ok('S12: no email / phone / non-shared class', !p12.includes('@') && !/09\d{8}/.test(p12) && !p12.includes('K03'));
    await hv.getByRole('button', { name: 'Quay lại' }).click();
    ok('S12 “Quay lại” → member list', (await hv.locator('.hv-head h1').innerText()).includes('Thành viên (12)'));
    await mrows.first().click(); await expectScreen('hv', 'S10', 'own row → S10');
    await hv.getByRole('button', { name: 'Quay lại' }).click(); await hv.getByRole('button', { name: 'Quay lại' }).click(); await expectScreen('hv', 'S02', 'back');
    await hv.getByRole('button', { name: 'Quay lại' }).click(); await expectScreen('hv', 'S01', 'back to Lớp của tôi');
    await hv.getByRole('button', { name: 'Xếp hạng' }).click(); await expectScreen('hv', 'S09', 'tab bar');
    ok('S09: pinned “Vị trí của tôi”', (await hv.locator('.pinned-me').count()) === 1);
    ok('S09: avatars on rows', (await hv.locator('.podium .avatar').count()) === 3);
    await hv.locator('.podium .pod').first().click(); await expectScreen('hv', 'S12', 'S09 row → S12');
    await hv.getByRole('button', { name: 'Quay lại' }).click(); await expectScreen('hv', 'S09', 'back');
    await hv.locator('.pinned-me').click(); await expectScreen('hv', 'S10', '“Vị trí của tôi” → S10');
    await hv.getByRole('button', { name: 'Quay lại' }).click();
    await hv.getByRole('button', { name: 'Điểm của tôi' }).click();
    const mine = norm(await hv.locator('.sc-hero').innerText());
    ok('S09 Điểm của tôi: Điểm xếp hạng, hạng, TB bài tập, TB bài thi, “Bộ bài tập đã nộp x/y”, formula (008 · AC-11.2, AC-13.5)', mine.includes('Điểm xếp hạng') && mine.includes('TB bài tập') && mine.includes('TB bài thi') && /Bộ bài tập đã nộp \d+\/\d+/.test(mine) && /30% × \d+,\d \+ 70% × \d+,\d = \d+,\d/.test(mine), mine);
    ok('S09: only “Xếp hạng” and “Điểm của tôi” (no “Lịch sử điểm”), no retry action', (await hv.locator('.seg[aria-label="Mục"] button').allInnerTexts()).map(norm).join('|') === 'Xếp hạng|Điểm của tôi' && (await hv.getByText(/Làm lại/).count()) === 0);
    await hv.locator('.lrow', { hasText: 'Đã có điểm' }).first().click(); await expectScreen('hv', 'S06', 'Điểm của tôi row → S06');
    ok('“Điểm của tôi” row opens “Xem lại bài làm”', (await hv.locator('.hv-head h1').innerText()) === 'Xem lại bài làm');
    await hv.getByRole('button', { name: 'Quay lại' }).click(); await expectScreen('hv', 'S09', 'back to S09');
    await hv.getByRole('button', { name: 'Tài khoản' }).click(); await expectScreen('hv', 'S10', 'tab bar');
    ok('S10 “Hồ sơ của tôi”: notice “Giáo viên đã gỡ ảnh đại diện của bạn vì không phù hợp. Bạn có thể chọn ảnh khác.” + tab dot', (await hv.getByText('Giáo viên đã gỡ ảnh đại diện của bạn vì không phù hợp. Bạn có thể chọn ảnh khác.').count()) === 1 && (await hv.locator('.tab-dot').count()) === 1);
    await hv.getByRole('button', { name: 'Đã hiểu' }).click();
    ok('“Đã hiểu” clears the notice and the dot', (await hv.locator('.tab-dot').count()) === 0 && (await hv.getByText(/Giáo viên đã gỡ/).count()) === 0);
    ok('S10: hint “Bạn đang dùng mật khẩu được gửi qua email. Hãy đổi sang mật khẩu của riêng bạn.”', (await hv.getByText('Bạn đang dùng mật khẩu được gửi qua email. Hãy đổi sang mật khẩu của riêng bạn.').count()) === 1);
    const s10 = await hv.innerText();
    ok('S10: name, email, phone (self only) + “Liên hệ giáo viên nếu cần thay đổi thông tin.”', s10.includes('minhanh.nguyen@mail.example') && s10.includes('Số điện thoại') && s10.includes('Liên hệ giáo viên nếu cần thay đổi thông tin.'));
    ok('S10: “Lớp đang học” 3 classes with progress, points, rank; upcoming shows start date', (await hv.locator('.pc-card').count()) === 3 && (await hv.locator('.pc-card', { hasText: 'Bắt đầu ngày 07/11/2026' }).count()) === 1 && (await hv.locator('.pc-card', { hasText: /Hạng \d+\/\d+/ }).count()) >= 1);
    await hv.getByRole('button', { name: 'Đổi ảnh đại diện' }).click(); await hv.locator('.sheet').getByRole('button', { name: /anh-nho\.png/ }).click();
    ok('avatar: too small → “Ảnh đại diện cần tối thiểu 200 × 200 px.”', (await hv.getByText('Ảnh đại diện cần tối thiểu 200 × 200 px.').count()) === 1);
    await hv.locator('.sheet').getByRole('button', { name: /bai-tap\.pdf/ }).click();
    ok('avatar: PDF → “Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.”', (await hv.getByText('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.').count()) === 1);
    await hv.locator('.sheet').getByRole('button', { name: /chan-dung-moi\.jpg/ }).click();
    ok('crop: 1:1 circle preview + zoom 1–3 + Đặt lại / Hủy / Lưu', (await hv.locator('.crop-stage.is-av').count()) === 1 && (await hv.locator('input[type="range"][data-bind="fsd.zoom"]').count()) === 1 && (await hv.locator('.fsd').getByRole('button', { name: 'Đặt lại' }).count()) === 1);
    await hv.locator('input[type="range"][data-bind="fsd.zoom"]').fill('2');
    ok('crop: zoom 2.0×', (await hv.locator('.fsd').innerText()).includes('2.0×'));
    await hv.locator('.fsd').getByRole('button', { name: 'Lưu', exact: true }).click();
    ok('“Đã cập nhật ảnh đại diện.” + new photo', (await toastTxt('hv')).includes('Đã cập nhật ảnh đại diện.') && (await hv.locator('.prof-av .avatar.ph').count()) === 1);
    await hv.getByRole('button', { name: 'Đổi ảnh bìa' }).click(); await hv.locator('.sheet').getByRole('button', { name: 'Gỡ ảnh bìa' }).click();
    ok('remove cover: “Gỡ ảnh bìa? Ảnh mặc định sẽ được hiển thị thay thế.”', (await confirmText(hv)).includes('Gỡ ảnh bìa? Ảnh mặc định sẽ được hiển thị thay thế.'));
    await confirmOk(hv, 'Gỡ ảnh');
    ok('→ default cover', (await hv.locator('.prof-head .pcover.is-default').count()) === 1);
    await hv.locator('.callout').getByRole('button', { name: 'Đổi mật khẩu' }).click();
    await hv.locator('[data-bind="fsd.v.cur"]').fill('k7Rm2xQp9T'); await hv.locator('[data-bind="fsd.v.n1"]').fill('MinhAnh2026'); await hv.locator('[data-bind="fsd.v.n2"]').fill('MinhAnh2026');
    await hv.locator('.fsd').getByRole('button', { name: 'Lưu mật khẩu' }).click();
    ok('Đổi mật khẩu → “Đã đổi mật khẩu thành công.”, hint gone', (await toastTxt('hv')).includes('Đã đổi mật khẩu thành công.') && (await hv.getByText(/Bạn đang dùng mật khẩu được gửi qua email/).count()) === 0);
    await hv.locator('.pc-card', { hasText: 'K12' }).getByRole('button', { name: /Xem xếp hạng/ }).click(); await expectScreen('hv', 'S09', '“Xem xếp hạng” → S09');
    await page.evaluate(() => openInProto('S11', 'hv', null, { cls: 'k12', bai: 'b4', tab: 'E' }));
    ok('S11 Bài 4: “Quá hạn” on a set not submitted after its deadline', (await hv.locator('.path-row .chip', { hasText: 'Quá hạn' }).count()) === 1);
    await page.evaluate(() => openInProto('S11', 'hv', null, { cls: 'k12', bai: 'b5', tab: 'E' }));
    ok('precedence: unfinished attempt past its deadline shows only “Quá hạn” (no “Đang làm”)', (await hv.locator('.path-row .chip', { hasText: 'Quá hạn' }).count()) === 1 && (await hv.locator('.path-row .chip', { hasText: 'Đang làm' }).count()) === 0);
    await hv.locator('.path-row').first().click();
    ok('S05 still offers “Tiếp tục làm” when Quá hạn', (await hv.getByRole('button', { name: 'Tiếp tục làm' }).count()) === 1 && (await hv.locator('.chip', { hasText: 'Quá hạn' }).count()) >= 1);
    await page.evaluate(() => openInProto('S06', 'hv', null, { cls: 'k12', set: 'b1e2' }));
    ok('S06: late submission tagged “Nộp muộn” (still fully counted)', (await hv.locator('.late-chip').count()) === 1 && (await hv.getByText(/vẫn được tính điểm đầy đủ/).count()) === 1);
    await page.getByRole('button', { name: 'Hướng dẫn' }).click(); await page.locator('#guide [data-scn]', { hasText: 'Nội dung không còn khả dụng' }).click();
    ok('Kịch bản HV: A05 “Không tìm thấy nội dung bạn yêu cầu.”', (await hv.getByText('Không tìm thấy nội dung bạn yêu cầu.').count()) === 1);
    await page.getByRole('button', { name: 'Hướng dẫn' }).click(); await page.locator('#guide [data-scn]', { hasText: 'Lớp đã kết thúc' }).click();
    ok('Kịch bản HV: ended class banner', (await hv.getByText(/Lớp đã kết thúc ngày/).count()) === 1);
    await page.locator('#view-hv').screenshot({ path: SP + '/v6-hv.png' });
  });


  /* ---------- 5b. AI approve = full replace with archive (b1 has submissions) ---------- */
  await STEP('replace archive', async () => {
    const p3 = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); watch(p3); p3.setDefaultTimeout(6000);
    await p3.goto(URL + '#T01', { waitUntil: 'load' }); await p3.waitForTimeout(300);
    const g3 = p3.locator('[data-frame="gv"]'); const pts0 = await p3.evaluate(() => ptsBreak('k12', ME).total);
    await p3.getByRole('button', { name: 'Hướng dẫn' }).click(); await p3.locator('#guide [data-scn]', { hasText: 'Duyệt nội dung AI (thay thế)' }).click();
    ok('Kịch bản “Duyệt nội dung AI (thay thế)” → T20 Bài 1, tab Bài tập', (await g3.getAttribute('data-screen')) === 'T20' && (await g3.locator('[role="tab"][aria-selected="true"]').innerText()).startsWith('Bài tập'));
    await g3.locator('.rv-frame .q-mark.is-err').first().click(); await g3.locator('.rvseg-q[data-key="Q|1|1"]').getByRole('button', { name: 'Tạo lại' }).click(); await g3.locator('.modal-foot').getByRole('button', { name: /Tạo lại/ }).click(); await p3.waitForTimeout(2600);
    await g3.locator('.rv-bar').getByRole('button', { name: 'Xong' }).click(); await g3.locator('.rv-bar').getByRole('button', { name: 'Duyệt' }).click();
    const t = norm(await g3.locator('.modal').innerText());
    ok('dialog: “Sẽ được lưu trữ — giữ bài nộp và điểm (4)” with submission counts', t.includes('Sẽ được lưu trữ — giữ bài nộp và điểm (4)') && (await g3.locator('.modal .rp-grp.is-arch li', { hasText: 'bài nộp' }).count()) === 4 && !t.includes('Sẽ bị xóa'), t.slice(0, 200));
    ok('dialog: “Bài làm và điểm của học viên được giữ lại.” + “Học viên của 2 lớp sẽ thấy nội dung mới ngay …”', t.includes('Bài làm và điểm của học viên được giữ lại.') && t.includes('Học viên của 2 lớp sẽ thấy nội dung mới ngay (trừ lớp đã ẩn phần này)'));
    await g3.locator('.modal-foot').getByRole('button', { name: /Duyệt/ }).click();
    ok('toast “Đã duyệt và xuất bản 4 mục vào phần Bài tập. Đã xóa 0 mục cũ · Đã lưu trữ 4 bộ bài tập.”', norm(await p3.locator('[data-toasts="gv"]').innerText()).includes('Đã duyệt và xuất bản 4 mục vào phần Bài tập. Đã xóa 0 mục cũ · Đã lưu trữ 4 bộ bài tập.'));
    await g3.locator('nav button', { hasText: 'Bài 1 – 你好' }).first().click();
    await g3.getByRole('button', { name: 'Soạn thủ công' }).click(); await g3.getByRole('tab', { name: /Bài tập/ }).click();
    const bar3 = await g3.locator('.rv-bar').innerText();
    ok('T07 › Bài tập (Bài 1): 4 new sets Đã xuất bản shown, 4 archived hidden by default', (await g3.locator('.rvseg').count()) === 4 && bar3.includes('4 Đã xuất bản') && bar3.includes('4 Lưu trữ'), bar3);
    await g3.locator('.rv-bar').getByRole('switch', { name: /Hiện mục lưu trữ/ }).click();
    ok('toggle “Hiện mục lưu trữ (4)” shows the archived sets after the new ones', (await g3.locator('.rvseg').count()) === 8 && (await g3.locator('.rvseg.is-arch').count()) === 4 && (await g3.locator('.rvseg').nth(4).getAttribute('class')).includes('is-arch'));
    ok('ranking points kept after the replace', (await p3.evaluate(() => ptsBreak('k12', ME).total)) === pts0, String(pts0));
    await p3.evaluate(() => { enterRole('hv', 'S11'); openInProto('S11', 'hv', null, { cls: 'k12', bai: 'b1', tab: 'E' }); });
    const chips = await p3.locator('[data-frame="hv"] .path-row .chip').allInnerTexts();
    ok('HV S11 Bài 1: only the 4 new sets (archived ones hidden), “Chưa mở” until the GV sets deadlines (003 · AC-22.4)', chips.length === 4 && chips.every((c) => c.includes('Chưa mở')), chips.join('|'));
    await p3.close();
  });

  /* ---------- 5c. Bài thi (006): T10 → T22 (tạo + lên lịch) → T16 → T14 · HV S02 → S07 → sảnh → S08 → nộp → kết quả ---------- */
  await STEP('exams', async () => {
    const p4 = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); watch(p4); p4.setDefaultTimeout(6000);
    await p4.goto(URL + '#T10', { waitUntil: 'load' }); await p4.waitForTimeout(300);
    const g = p4.locator('[data-frame="gv"]'); const h = p4.locator('[data-frame="hv"]'); const T = async (fr) => norm(await fr.innerText());
    const rows = () => g.locator('table.tbl tbody tr'); const toast4 = async () => norm(await p4.locator('[data-toasts="gv"]').innerText());
    ok('T10: sidebar “Bài thi” is the current item', (await g.locator('.gv-nav button[aria-current="page"]').innerText()).includes('Bài thi'));
    ok('T10 “Danh sách bài thi”: 5 exams, order Đang mở → Đã lên lịch → Nháp → Đã đóng → Đã đóng', (await rows().count()) === 5 && (await rows().locator('td:nth-child(6)').allInnerTexts()).map(norm).join('|') === 'Đang mở|Đã lên lịch|Nháp|Đã đóng|Đã đóng');
    const r1 = await T(rows().first());
    ok('T10: row shows classes, open/close, duration and “đã nộp/tổng”', r1.includes('K12') && r1.includes('20/10/2026 20:00') && r1.includes('45 phút') && /\d+\/\d+/.test(await rows().first().locator('td:nth-child(7)').innerText()), r1);
    await g.getByRole('switch', { name: /Hiện bài thi lưu trữ \(1\)/ }).click();
    ok('“Hiện bài thi lưu trữ (1)” adds the archived exam after Đã đóng', (await rows().count()) === 6 && (await T(rows().last())).includes('Lưu trữ'));
    await g.getByRole('switch', { name: /Hiện bài thi lưu trữ/ }).click();
    await g.locator('.seg').getByRole('button', { name: /^Đã đóng/ }).click();
    ok('filter “Đã đóng” → 2 rows', (await rows().count()) === 2);
    await g.getByRole('textbox', { name: 'Tìm theo tên bài thi' }).fill('zzz');
    ok('no match → “Không có bài thi phù hợp”', (await g.getByText('Không có bài thi phù hợp').count()) === 1);
    await g.getByRole('button', { name: 'Xóa bộ lọc' }).click();
    await g.getByRole('button', { name: 'Tạo bài thi' }).first().click();
    ok('“Tạo bài thi” → T22 “Soạn bài thi” with empty fields', (await g.getAttribute('data-screen')) === 'T22' && (await g.locator('.page-title').innerText()) === 'Soạn bài thi' && (await g.locator('[data-bind="x.name"]').inputValue()) === '' && (await g.locator('[data-bind="x.open"]').inputValue()) === '');
    await g.locator('[data-bind="x.name"]').fill('Kiểm tra 15 phút – Bài 5');
    await g.getByRole('button', { name: 'Lên lịch', exact: true }).click();
    const iss = await T(g.locator('[data-xiss]'));
    ok('“Lên lịch” blocked: lists unmet conditions (no question, no class, no schedule)', iss.includes('Bài thi cần ít nhất 1 câu hỏi') && iss.includes('Chọn ít nhất một lớp được giao') && iss.includes('Nhập Giờ mở'), iss);
    await g.getByRole('button', { name: 'Thêm câu hỏi' }).click(); await g.getByRole('menuitem', { name: 'Trắc nghiệm', exact: true }).click();
    await g.locator('[data-rk="Q|0|0|text"]').fill('岁 nghĩa là gì?'); await g.locator('[data-rk="Q|0|0|opts.0"]').fill('tuổi'); await g.locator('[data-rk="Q|0|0|opts.1"]').fill('năm');
    ok('T22: question count + total points always visible', (await T(g.locator('[data-xsum]'))).includes('1 câu hỏi'));
    await g.getByRole('button', { name: /Chọn lớp/ }).click(); await g.getByRole('checkbox', { name: /HSK1 – Tối 2·4·6 \(K12\)/ }).click();
    await g.locator('[data-bind="x.open"]').fill('21/10/2026 08:00'); await g.locator('[data-bind="x.dur"]').fill('15'); await g.locator('[data-bind="x.close"]').fill('21/10/2026 08:10');
    await g.getByRole('button', { name: 'Lên lịch', exact: true }).click();
    ok('close < open + duration → “Giờ đóng phải sau giờ mở ít nhất bằng thời lượng làm bài (15 phút).”', (await g.getByText('Giờ đóng phải sau giờ mở ít nhất bằng thời lượng làm bài (15 phút).').count()) >= 1);
    await g.locator('[data-bind="x.close"]').fill('21/10/2026 09:00');
    await g.getByRole('button', { name: 'Lên lịch', exact: true }).click();
    ok('“Lên lịch” → “Đã lên lịch · mở lúc 08:00 21/10/2026”', (await toast4()).includes('Đã lên lịch · mở lúc 08:00 21/10/2026') && (await T(g.locator('.x22-side'))).includes('Đã lên lịch'));
    await g.getByRole('button', { name: 'Về danh sách bài thi' }).click();
    ok('T10: the new exam is listed as “Đã lên lịch”', (await rows().count()) === 6 && (await T(rows().filter({ hasText: 'Kiểm tra 15 phút – Bài 5' }))).includes('Đã lên lịch'));
    await rows().filter({ hasText: 'Kiểm tra giữa kỳ HSK1' }).getByRole('button', { name: 'Kiểm tra giữa kỳ HSK1 (Bài 1–5)', exact: true }).click();
    ok('T22 of an exam with attempts: paper locked (banner, read-only questions, no “Thêm câu hỏi”)', (await g.getByText('Đề thi đã khóa vì đã có học viên bắt đầu làm bài.', { exact: false }).count()) === 1 && (await g.locator('[data-rk="Q|0|0|text"]').getAttribute('readonly')) !== null && (await g.getByRole('button', { name: 'Thêm câu hỏi' }).count()) === 0);
    await g.locator('[data-bind="x.close"]').fill('20/10/2026 22:00'); await g.getByRole('button', { name: 'Lưu thay đổi' }).click();
    ok('locked exam: earlier close time refused (“chỉ có thể lùi giờ đóng muộn hơn”)', (await g.getByText('Khi đã có học viên làm bài, chỉ có thể lùi giờ đóng muộn hơn.').count()) >= 1);
    await g.locator('[data-bind="x.close"]').fill('20/10/2026 22:30');
    await g.locator('.x-acts-2').getByRole('button', { name: 'Xem kết quả' }).click();
    ok('T22 “Xem kết quả” → T16', (await g.getAttribute('data-screen')) === 'T16');
    const sum = await T(g.locator('.x16-sum'));
    ok('T16 K12 (default A→Z): Đã nộp 3 · Đang làm 2 · Chưa làm 7 + average', (await g.locator('.x16-cls [aria-pressed="true"]').innerText()).includes('K12') && sum.includes('Đã nộp 3') && sum.includes('Đang làm 2') && sum.includes('Chưa làm 7') && /Điểm trung bình \(Đã nộp\) \d+,\d/.test(sum), sum);
    ok('T16 rows: “Nộp tự động” on an auto-submitted attempt; “Đang làm” shows remaining time', (await g.locator('tr', { hasText: 'Lê Thu Hà' }).getByText('Nộp tự động').count()) === 1 && /còn \d\d:\d\d/.test(await g.locator('tr', { hasText: 'Phạm Quốc Huy' }).innerText()));
    await g.locator('tr', { hasText: 'Lê Thu Hà' }).getByRole('button', { name: 'Xem bài nộp' }).click();
    const t14 = await T(g.locator('.gv-content'));
    ok('T14 (exam): read-only header — HV, class, exam, start, submit, duration, “Nộp tự động”, “n / 100”', (await g.getAttribute('data-screen')) === 'T14' && t14.includes('Lê Thu Hà') && t14.includes('Kiểm tra giữa kỳ HSK1') && t14.includes('Nộp tự động') && /\d+ \/ 100/.test(t14) && t14.includes('Đáp án đúng:') && !t14.includes('Nộp muộn'));
    /* HV */
    await p4.evaluate(() => enterRole('hv', 'S02'));
    const entry = h.locator('.lrow', { hasText: 'Bài thi của lớp' });
    ok('S02 (K12): entry “Bài thi của lớp (5)” (003 · AC-13.8)', norm(await entry.innerText()).includes('Bài thi của lớp (5)'));
    await entry.click();
    ok('→ S07 “Bài thi”: open exam first with “Vào thi”; scheduled exam counts down “Mở sau hh:mm:ss”', (await h.getAttribute('data-screen')) === 'S07' && (await T(h.locator('.x7-row').first())).includes('Đang mở · đóng lúc 22:30 20/10/2026') && /Mở sau \d\d:\d\d:\d\d/.test(await T(h.locator('.x7-row', { hasText: 'Ôn tập HSK1' }))));
    ok('S07: “Đã nộp · n/100” and “Đã đóng · Không làm bài” rows', /Đã nộp · \d+\/100/.test(await T(h.locator('.x7-row', { hasText: 'Chào hỏi – Cảm ơn' }))) && (await T(h.locator('.x7-row', { hasText: 'Kiểm tra Bài 3' }))).includes('Đã đóng · Không làm bài'));
    await h.locator('.x7-row', { hasText: 'Kiểm tra Bài 3' }).getByRole('button', { name: 'Xem kết quả' }).click();
    ok('no-show result: “Bạn đã không làm bài thi này.” + 0/100', (await h.getByText('Bạn đã không làm bài thi này.').count()) === 1 && (await T(h.locator('.res-score'))) === '0/100');
    await h.getByRole('button', { name: 'Quay lại' }).click();
    await h.locator('.x7-row', { hasText: 'giữa kỳ' }).getByRole('button', { name: 'Vào thi' }).click();
    const lob = await T(h);
    ok('Vào thi → lobby: 10 câu, 45 phút, giờ đóng, the two rules, no question content', lob.includes('Bạn chỉ được làm bài thi này một lần.') && lob.includes('Đồng hồ chạy liên tục kể cả khi bạn thoát ra hoặc mất kết nối.') && lob.includes('45 phút') && lob.includes('22:30 20/10/2026') && (await h.locator('.q-card').count()) === 0);
    await h.getByRole('button', { name: 'Bắt đầu làm bài' }).click();
    ok('“Bắt đầu làm bài” → S08 at Câu 1/10 with a running timer (≤ 45:00)', (await h.getAttribute('data-screen')) === 'S08' && (await T(h.locator('.x8-bar'))).includes('Câu 1/10') && /^4[45]:\d\d$/.test((await h.locator('[data-tt]').innerText()).trim()));
    await h.locator('.opt').nth(1).click(); await p4.waitForTimeout(2300);
    ok('autosave “Đã lưu lúc HH:mm:ss”; no answer key while taking the exam', /Đã lưu lúc \d\d:\d\d:\d\d/.test(await h.locator('[data-save]').innerText()) && (await h.getByText('Đáp án đúng').count()) === 0);
    await h.getByRole('button', { name: 'Câu sau ›' }).click();
    ok('“Câu sau” → Câu 2/10; navigator marks Câu 1 answered', (await T(h.locator('.x8-bar'))).includes('Câu 2/10') && (await h.locator('.qn').first().getAttribute('class')).includes('ans'));
    await h.locator('.x8-bar').getByRole('button', { name: 'Nộp bài' }).click();
    const cf = await confirmText(h);
    ok('“Nộp bài” confirm: unfinished questions + “Sau khi nộp bạn không thể làm lại.” + Nộp bài / Làm tiếp', cf.includes('Còn 9 câu chưa hoàn thành') && cf.includes('Sau khi nộp bạn không thể làm lại.') && (await h.locator('.confirm').getByRole('button', { name: 'Làm tiếp' }).count()) === 1, cf);
    await confirmOk(h, 'Nộp bài');
    const res = await T(h);
    ok('result at once: “Đã nộp lúc …”, n/100, “đạt / 14 điểm”, one-attempt line', /\d+\/100/.test(await T(h.locator('.res-score'))) && res.includes('Đã nộp lúc') && /\d+(,\d)? \/ 14 điểm/.test(res) && res.includes('Bạn chỉ làm bài thi này một lần.'), res);
    ok('answers hidden until close: “Đáp án và giải thích sẽ hiển thị sau khi bài thi đóng lúc 22:30 20/10/2026.”', res.includes('Đáp án và giải thích sẽ hiển thị sau khi bài thi đóng lúc 22:30 20/10/2026.') && !res.includes('Đáp án đúng:'));
    await h.getByRole('button', { name: 'Về danh sách bài thi' }).click();
    ok('S07: the exam now reads “Đã nộp · n/100”', /Đã nộp · \d+\/100/.test(await T(h.locator('.x7-row', { hasText: 'giữa kỳ' }))));
    await p4.evaluate(() => openInProto('T16', 'gv', null, { exam: 'x1' }));
    ok('GV T16 picks up the HV submission (Đã nộp 4)', (await g.locator('[data-x16="sub"] .v').textContent()).trim() === '4');
    await p4.getByRole('button', { name: 'Hướng dẫn' }).click(); await p4.locator('#guide [data-scn]', { hasText: 'Bài thi: tua qua giờ đóng' }).click();
    const after = await T(h);
    ok('after close (all attempts submitted): “Từng câu · đáp án và giải thích” with “Bạn trả lời:” / “Đáp án đúng:”', after.toLowerCase().includes('từng câu · đáp án và giải thích') && after.includes('Đáp án đúng:') && after.includes('Bạn trả lời:'));
    await p4.locator('#view-hv .scaler').screenshot({ path: SP + '/v13-s08-result.png' });
    await p4.close();
  });

  /* ---------- 4c. Wave 2 (v13b): sets open only with a deadline · Điểm xếp hạng 30/70 · T07 full scope ---------- */
  await STEP('v13b deadlines', async () => {
    const p5 = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); watch(p5); p5.setDefaultTimeout(6000);
    await p5.goto(URL + '#S02', { waitUntil: 'load' }); await p5.waitForTimeout(300);
    const h = p5.locator('[data-frame="hv"]'); const g = p5.locator('[data-frame="gv"]'); const T = async (l) => norm(await l.innerText());
    const open = (id, fid, params, ui) => p5.evaluate(([a, b, c, d]) => { enterRole(b, a); openInProto(a, b, null, c, d); }, [id, fid, params, ui || null]);
    const toast5 = async (fid) => norm(await p5.locator(`[data-toasts="${fid}"]`).innerText());
    await open('S02', 'hv', { cls: 'k12' });
    ok('S02: a Bài whose sets have no deadline shows “Bài tập chưa mở” instead of progress; others “x/y bộ bài tập”', (await h.locator('.lrow', { hasText: 'Bài 3' }).innerText()).includes('Bài tập chưa mở') && /\d+\/4 bộ bài tập/.test(await h.locator('.lrow', { hasText: 'Bài 1 –' }).innerText()));
    await h.locator('.lrow', { hasText: 'Bài 3' }).click(); await h.getByRole('tab', { name: /Bài học/ }).click();
    ok('S11 Bài học: every step opens, in any order (no lock)', (await h.locator('button.path-row').count()) === 2 && (await h.locator('.path-row.is-closed').count()) === 0);
    await h.getByRole('tab', { name: /Bài tập/ }).click();
    const closed = h.locator('.path-row.is-closed');
    ok('S11 head “Bài tập chưa mở”; the set without deadline is a disabled row “Chưa mở” + “Giáo viên chưa đặt hạn nộp”, no deadline label, “{n} câu”', (await T(h.locator('.hv-body'))).includes('Bài tập chưa mở') && (await closed.count()) === 1 && (await closed.getAttribute('aria-disabled')) === 'true' && (await T(closed)).includes('Chưa mở') && (await T(closed)).includes('Giáo viên chưa đặt hạn nộp') && (await T(closed)).includes('3 câu') && (await closed.locator('.dl-chip').count()) === 0);
    await closed.click({ force: true }); await p5.waitForTimeout(150);
    ok('tapping a “Chưa mở” set opens nothing', (await h.getAttribute('data-screen')) === 'S11');
    ok('a set submitted before its deadline was removed stays “Đã hoàn thành · 5/6” (opens S06)', (await h.locator('button.path-row', { hasText: 'Luyện hỏi tên' }).innerText()).includes('Đã hoàn thành · 5/6'));
    await open('S05', 'hv', { cls: 'k12', set: 'b3e2' });
    const s5 = await T(h);
    ok('S05 opened directly on a “Chưa mở” set: name, count, total, “Chưa mở” + “Giáo viên chưa đặt hạn nộp”; no “Bắt đầu làm” / “Tiếp tục làm”, no question', s5.includes('Chưa mở') && s5.includes('Giáo viên chưa đặt hạn nộp') && s5.includes('Số câu hỏi') && s5.includes('Tổng điểm') && (await h.getByRole('button', { name: /Bắt đầu làm|Tiếp tục làm/ }).count()) === 0 && (await h.locator('.q-card').count()) === 0);
    await open('S03', 'hv', { cls: 'k12', step: 'b3l2' });
    const pb = h.getByRole('button', { name: /Luyện tập: Đọc hiểu/ });
    ok('S03: “Luyện tập: …” of a “Chưa mở” set is disabled with “Chưa mở”', (await pb.getAttribute('aria-disabled')) === 'true' && (await T(pb)).includes('Chưa mở'));
    ok('S03 renders Tài liệu (Trang 1/y, Tải về) and Hội thoại / Bài khóa blocks', (await h.getByRole('button', { name: /Tải về/ }).count()) >= 1 && /Trang 1\/\d+/.test(await T(h)));
    await open('S03', 'hv', { cls: 'k12', step: 'b2l1' });
    ok('S03 renders Video (play, speed) and Âm thanh blocks', (await h.getByRole('button', { name: 'Phát video' }).count()) === 1 && (await h.getByRole('combobox', { name: 'Tốc độ phát' }).count()) >= 1);
    /* GV clears and sets a deadline — HV sees it at once */
    await open('T04', 'gv', { cls: 'k12', tab: 'content' });
    const cell = g.locator('.dl-row', { has: p5.locator('[data-dlfield="dl|b3e1"]') });
    ok('T04 Nội dung: a set without deadline shows “Đặt hạn” + “Chưa mở với học viên”', (await T(cell)).includes('Đặt hạn') && (await T(cell)).includes('Chưa mở với học viên'));
    await g.locator('[data-dlfield="dl|b1e4"]').click();
    ok('popup of a set with a deadline: warning above “Xóa” — “Xóa hạn sẽ đóng bộ bài tập với học viên lớp này …”', (await T(g.locator('.dp-clear-warn'))).startsWith('Xóa hạn sẽ đóng bộ bài tập với học viên lớp này: ai chưa nộp sẽ thấy “Chưa mở”'));
    ok('deadline today after 08:00 → “Học viên sẽ không nhận email nhắc cho hạn nộp này.”', (await T(g.locator('.dp-warn'))) === 'Học viên sẽ không nhận email nhắc cho hạn nộp này.');
    await g.locator('.dp-pop').getByRole('button', { name: 'Xóa' }).click();
    ok('“Xóa” → “Đặt hạn” + “Đã xóa hạn nộp. Bộ bài tập chuyển sang “Chưa mở” với học viên.”', (await toast5('gv')).includes('Đã xóa hạn nộp. Bộ bài tập chuyển sang “Chưa mở” với học viên.') && (await T(g.locator('[data-dlfield="dl|b1e4"]'))).includes('Đặt hạn'));
    await open('S11', 'hv', { cls: 'k12', bai: 'b1', tab: 'E' });
    ok('HV: the in-progress set becomes “Chưa mở” (no “Đang làm”)', (await T(h.locator('.path-row', { hasText: 'Luyện mẫu câu' }))).includes('Chưa mở') && (await h.locator('.path-row .chip', { hasText: 'Đang làm' }).count()) === 0);
    await open('S05', 'hv', { cls: 'k12', set: 'b1e4' });
    ok('S05: “Câu trả lời đã lưu của bạn được giữ lại.” while closed', (await T(h)).includes('Câu trả lời đã lưu của bạn được giữ lại.'));
    await open('T04', 'gv', { cls: 'k12', tab: 'content' });
    await g.locator('[data-dlfield="dl|b1e4"]').click(); await g.locator('.dp-pop').getByRole('button', { name: '25/10/2026', exact: true }).click(); await g.locator('.dp-pop').getByRole('button', { name: 'Áp dụng' }).click();
    await open('S11', 'hv', { cls: 'k12', bai: 'b1', tab: 'E' });
    ok('deadline set again → “Đang làm” + “Hạn nộp 25/10”, opens S05 with “Tiếp tục làm”', (await T(h.locator('.path-row', { hasText: 'Luyện mẫu câu' }))).includes('Đang làm') && (await T(h.locator('.path-row', { hasText: 'Luyện mẫu câu' }))).includes('Hạn nộp 25/10'));
    await h.locator('.path-row', { hasText: 'Luyện mẫu câu' }).click();
    ok('…and “Tiếp tục làm” is back', (await h.getByRole('button', { name: 'Tiếp tục làm' }).count()) === 1);
    await h.getByRole('button', { name: 'Tiếp tục làm' }).click();
    ok('S05 question board legend: “Đã hoàn thành · Trả lời một phần · Chưa trả lời”', norm(await h.locator('.qn-legend').innerText()) === 'Đã hoàn thành Trả lời một phần Chưa trả lời');
    /* tracking (009) counts sets with a deadline only */
    await open('T04', 'gv', { cls: 'k12', tab: 'progress' });
    const opts = await g.locator('.trk select option').evaluateAll((els) => els.map((e) => e.value));
    ok('T04 Tiến độ: picker lists only sets with a deadline (no Bài 3 sets); note “2 bộ chưa có hạn nộp”', !opts.includes('b3e1') && !opts.includes('b3e2') && opts.length >= 6 && (await T(g.locator('.t04-sum'))).includes('2 bộ chưa có hạn nộp'));
    await open('T15', 'gv', { sid: 's1', cls: 'k12', open: 'b3' });
    ok('T15: expanded Bài 3 shows “Chưa mở” and “Đã hoàn thành 5/6”, never “Quá hạn”', (await T(g)).includes('Chưa mở') && (await T(g)).includes('Đã hoàn thành 5/6') && !(await T(g.locator('.tbl').first())).includes('Quá hạn'));
    await p5.getByRole('button', { name: 'Hướng dẫn' }).click(); await p5.locator('#guide [data-scn]', { hasText: 'Lớp chưa đặt hạn nộp' }).click();
    const t04 = await T(g);
    ok('class without any deadline: “Chưa đặt hạn nộp cho bộ bài tập nào” + “Học viên chỉ làm được bộ bài tập đã có hạn nộp.” + “Mở tab Nội dung”', t04.includes('Chưa đặt hạn nộp cho bộ bài tập nào') && t04.includes('Học viên chỉ làm được bộ bài tập đã có hạn nộp.'));
    await g.getByRole('button', { name: 'Mở tab Nội dung' }).click();
    ok('“Mở tab Nội dung” → tab Nội dung', (await g.locator('[role="tab"][aria-selected="true"]').innerText()).startsWith('Nội dung'));
    await g.locator('.gv-nav').getByRole('button', { name: 'Dashboard' }).click();
    ok('T01 row of that class: “Chưa đặt hạn nộp cho bộ bài tập nào”, no tracker toggle', (await T(g.locator('.cls-row', { hasText: '(K07)' }))).includes('Chưa đặt hạn nộp cho bộ bài tập nào') && (await g.locator('.cls-row', { hasText: '(K07)' }).getByRole('button', { name: /Đã làm \/ Chưa làm/ }).count()) === 0);
    await p5.close();
  });

  await STEP('v13b scores', async () => {
    const p6 = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); watch(p6); p6.setDefaultTimeout(6000);
    await p6.goto(URL + '#S09', { waitUntil: 'load' }); await p6.waitForTimeout(300);
    const h = p6.locator('[data-frame="hv"]'); const g = p6.locator('[data-frame="gv"]'); const T = async (l) => norm(await l.innerText());
    const open = (id, fid, params, ui) => p6.evaluate(([a, b, c, d]) => { enterRole(b, a); openInProto(a, b, null, c, d); }, [id, fid, params, ui || null]);
    const exp = await p6.evaluate(() => { const k = ptsBreak('k12', ME); const rl = rankList('k12'); const me = rl.find((r) => r.s.id === ME);
      return { tbE: f1(k.tbE), tbX: f1(k.tbX), tot: f1(k.total), ok: r1(0.3 * k.tbE + 0.7 * k.tbX) === k.total, rank: me.rank, n: rl.length, top: f1(rl[0].val), hid: k.hidden, sn: k.setsN, nE: k.nE, nX: k.nX }; });
    ok('Điểm xếp hạng = 30% × TB bài tập + 70% × TB bài thi, recomputable from the rounded averages', exp.ok && /^\d{1,3},\d$/.test(exp.tot), JSON.stringify(exp));
    await open('S09', 'hv', { cls: 'k12' }, { seg: 'mine' });
    const hero = await T(h.locator('.sc-hero'));
    ok(`S09 “Điểm của tôi”: ${exp.tot} · Hạng ${exp.rank}/${exp.n} · “30% × ${exp.tbE} + 70% × ${exp.tbX} = ${exp.tot}” · TB bài tập / TB bài thi with counts · “Bộ bài tập đã nộp ${exp.sn[0]}/${exp.sn[1]}”`, hero.includes(`Điểm xếp hạng ${exp.tot}`) && hero.includes(`Hạng ${exp.rank}/${exp.n}`) && hero.includes(`30% × ${exp.tbE} + 70% × ${exp.tbX} = ${exp.tot}`) && hero.includes(`TB bài tập ${exp.tbE} ${exp.nE} bộ được tính`) && hero.includes(`TB bài thi ${exp.tbX} ${exp.nX} bài thi được tính`) && hero.includes(`Bộ bài tập đã nộp ${exp.sn[0]}/${exp.sn[1]}`), hero);
    const body = await T(h.locator('.hv-body'));
    ok('“Điểm của tôi”: groups Bài tập (by Bài) and Bài thi; Chưa làm + Hạn nộp, Đã có điểm + “Nộp muộn” + “10/12 · 83%”, Quá hạn 0/100; Chưa thi, Không làm bài 0/100', /BÀI TẬP|Bài tập/.test(body) && body.includes('Bài 1 – 你好') && /Chưa làm Hạn nộp \d{2}\/\d{2}/.test(body) && body.includes('Nộp muộn') && body.includes('10/12 · 83%') && /Quá hạn 0\/100/.test(body) && body.includes('Chưa thi') && /Không làm bài Đóng [\d:]+ [\d/]+ 0\/100/.test(body), body.slice(0, 300));
    ok(`hidden / archived submitted sets: one line “Nội dung đã ẩn: ${exp.hid.k} bộ bài tập · ${exp.hid.S} điểm”; a set without deadline and without submission is not listed`, body.includes(`Nội dung đã ẩn: ${exp.hid.k} bộ bài tập · ${exp.hid.S} điểm`) && !body.includes('Đọc hiểu: Giới thiệu bản thân'));
    await h.locator('[data-bind="cls"]').selectOption('k09');
    ok('K09: archived exam with a submission → one line “Bài thi đã gỡ: 1 bài thi · n điểm”', /Bài thi đã gỡ: 1 bài thi · \d+ điểm/.test(await T(h.locator('.hv-body'))));
    await h.locator('[data-bind="cls"]').selectOption('k12'); await h.getByRole('button', { name: 'Xếp hạng', exact: true }).first().click();
    ok('S09 Xếp hạng: scores 0–100 with one decimal and a decimal comma', (await h.locator('.podium .p-pts').allInnerTexts()).every((t) => /^\d{1,3},\d điểm$/.test(norm(t))) && (await T(h.locator('.pinned-me'))).includes(`Hạng ${exp.rank}/${exp.n}`));
    await h.getByRole('button', { name: 'Cách tính điểm' }).click();
    const info = await T(h.locator('.sheet'));
    ok('“Cách tính điểm”: formula 30% / 70%, only sets with a deadline, rounding, worked example', info.includes('Điểm xếp hạng = 30% × TB bài tập + 70% × TB bài thi') && info.includes('bộ bài tập đã có hạn nộp') && info.includes('80,0'));
    await open('S10', 'hv', {});
    ok(`S10: K12 card “${exp.tot} điểm” · “Hạng ${exp.rank}/${exp.n}”, progress on sets with a deadline`, (await T(h.locator('.pc-card', { hasText: 'K12' }))).includes(`${exp.tot} điểm · Hạng ${exp.rank}/${exp.n}`) && (await T(h.locator('.pc-card', { hasText: 'K12' }))).includes(`Bộ bài tập ${exp.sn[0]}/${exp.sn[1]}`));
    await open('S02', 'hv', { cls: 'k12' });
    ok('S02: same score and rank', (await T(h.locator('.m-card').first())).includes(`Hạng ${exp.rank}/${exp.n} · ${exp.tot} điểm`));
    await open('T04', 'gv', { cls: 'k12', tab: 'rank' });
    const meRow = g.locator('table.rank-tbl tbody tr', { hasText: 'Nguyễn Minh Anh' });
    ok('T04 Xếp hạng: Minh Anh row = same TB bài tập · TB bài thi · Điểm xếp hạng', norm(await meRow.locator('td').nth(3).innerText()) === exp.tbE && norm(await meRow.locator('td').nth(4).innerText()) === exp.tbX && norm(await meRow.locator('td').nth(5).innerText()) === exp.tot);
    ok('T04 Xếp hạng: locked HV listed with “Đã khóa”', (await g.locator('table.rank-tbl tbody tr', { hasText: 'Bùi Thanh Tùng' }).innerText()).includes('Đã khóa'));
    await meRow.getByRole('button', { name: /Chi tiết điểm/ }).click();
    const bkt = await T(g.locator('.bk-tbl'));
    ok('expanded row: groups “Bài tập” / “Bài thi”, “Đã ẩn trong lớp”, “Đã lưu trữ”, “Không tính”, link “Xem hồ sơ học tập”', bkt.includes(`Bài tập · TB ${exp.tbE}`) && bkt.includes(`Bài thi · TB ${exp.tbX}`) && bkt.includes('Đã ẩn trong lớp') && bkt.includes('Đã lưu trữ') && bkt.includes('Không tính') && (await g.getByRole('button', { name: /Xem hồ sơ học tập/ }).count()) === 1);
    await open('T01', 'gv', {});
    ok(`T01 Top 3: Điểm xếp hạng with one decimal (top = ${exp.top})`, norm(await g.locator('.cls-row', { hasText: '(K12)' }).locator('.t3-i b').first().innerText()) === exp.top);
    await open('T15', 'gv', { sid: 's1', cls: 'k12' });
    ok('T15: “Điểm xếp hạng” card value = 008', (await T(g.locator('.cls-pick', { hasText: 'K12' }))).includes(`Điểm xếp hạng ${exp.tot}`));
    await p6.close();
  });

  await STEP('v13b T07', async () => {
    const p7 = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); watch(p7); p7.setDefaultTimeout(6000);
    await p7.goto(URL + '#T07', { waitUntil: 'load' }); await p7.waitForTimeout(300);
    const g = p7.locator('[data-frame="gv"]'); const T = async (l) => norm(await l.innerText());
    await p7.evaluate(() => openInProto('T07', 'gv', null, { bai: 'b3', tab: 'L' }));
    const s0 = g.locator('.rvseg[data-key="L|0"]');
    await s0.getByRole('button', { name: 'Thêm khối' }).click();
    ok('“Thêm khối”: 9 types in order (Văn bản … Âm thanh)', (await g.locator('.blk-menu [role="menuitem"]').allInnerTexts()).map((t) => norm(t).split(' · ')[0]).join('|') === 'Văn bản|Từ vựng|Ngữ pháp / mẫu câu|Hội thoại / Bài khóa|Bộ thẻ từ vựng|Tài liệu|Video|Hình ảnh|Âm thanh');
    await g.getByRole('menuitem', { name: /^Tài liệu/ }).click();
    const nb = await s0.locator('.rv-blk').count(); const doc = s0.locator('.rv-blk').last();
    ok('Tài liệu block: “Chưa có tệp” · PDF, DOCX, PPTX · tối đa 50 MB · “Chọn tệp” · “Chú thích”; step “Chưa lưu”', (await T(doc)).includes('Chưa có tệp') && (await T(doc)).includes('PDF, DOCX, PPTX · tối đa 50 MB') && (await doc.locator('[data-rk$=".cap"]').count()) === 1 && await s0.locator('.us-chip').isVisible());
    await doc.getByRole('button', { name: 'Chọn tệp' }).click();
    ok('“Chọn tệp” attaches a file → name · size · pages + “Thay tệp”', /\.pdf · [\d,]+ MB · \d+ trang/.test(await T(s0.locator('.rv-blk').last())) && (await s0.locator('.rv-blk').last().getByRole('button', { name: 'Thay tệp' }).count()) === 1);
    await s0.getByRole('button', { name: `Chuyển khối ${nb} lên`, exact: true }).click();
    ok('block “Lên” moves the block and renumbers', (await T(s0.locator('.rv-blk').nth(nb - 2).locator('.rv-blk-h'))).startsWith(`Khối ${nb - 1} · Tài liệu`));
    await s0.getByRole('button', { name: 'Thêm khối' }).click(); await g.getByRole('menuitem', { name: /^Video/ }).click();
    const yt = s0.locator('.rv-blk').last().getByRole('button', { name: 'Dán liên kết YouTube' });
    ok('Video block: “Dán liên kết YouTube” shown only as a flagged option (disabled, WHERE flag)', (await yt.getAttribute('aria-disabled')) === 'true');
    const vb = s0.locator('.rv-blk', { hasText: 'Từ vựng' }).first(); const w0 = await vb.locator('[data-rk$="words.0.0"]').inputValue(); const nw = await vb.locator('[data-rk$=".0"][data-rk*="words."]').count();
    await vb.getByRole('button', { name: 'Chuyển từ 1 xuống', exact: true }).click();
    ok('vocabulary words reorder (“Xuống”), with Loại từ and Ví dụ fields', (await vb.locator('[data-rk$="words.1.0"]').inputValue()) === w0 && (await vb.getByRole('combobox', { name: /Loại từ/ }).count()) >= 1 && (await vb.locator('[data-rk$="words.0.4"]').count()) === 1);
    await vb.getByRole('button', { name: 'Thêm từ' }).click();
    ok('“Thêm từ” adds a word row', (await vb.locator('[data-rk*="words."][data-rk$=".0"]').count()) === nw + 1);
    const pr = s0.locator('.prac');
    ok('step footer “Bài tập luyện tập” (read-only) lists the linked set + “Mở bộ bài tập”', (await T(pr)).includes('Bài tập luyện tập') && (await T(pr)).includes('Luyện hỏi tên') && (await pr.getByRole('button', { name: /Mở bộ bài tập/ }).count()) === 1);
    const dlg = g.locator('.rvseg[data-key="L|1"] .rv-blk', { hasText: 'Hội thoại / Bài khóa' }); const nl = await dlg.locator('[data-rk*="lines."][data-rk$=".1"]').count();
    await dlg.getByRole('button', { name: 'Thêm dòng' }).click();
    ok('Hội thoại / Bài khóa: “Thêm dòng” + per-line Lên / Xuống / Xóa', (await dlg.locator('[data-rk*="lines."][data-rk$=".1"]').count()) === nl + 1 && (await dlg.getByRole('button', { name: /Chuyển dòng 1 xuống/ }).count()) === 1);
    await pr.getByRole('button', { name: /Mở bộ bài tập/ }).click();
    ok('“Mở bộ bài tập” → tab Bài tập at that set', (await g.locator('[role="tab"][aria-selected="true"]').innerText()).startsWith('Bài tập') && (await g.locator('.rvseg.is-focus[data-key="E|0"]').count()) === 1);
    const link = g.locator('[data-rk="E|0|link"]');
    ok('set: “Bước học liên kết” = the step; options “Không liên kết” + every step with its status', (await link.inputValue()) === 'b3l1' && (await link.locator('option').first().innerText()) === 'Không liên kết' && (await link.locator('option').count()) === 3 && (await link.locator('option').nth(1).innerText()).includes('Đã xuất bản'));
    await link.selectOption('');
    ok('changing the link marks the set “Chưa lưu”', await g.locator('.rvseg[data-key="E|0"] .us-chip').isVisible());
    await g.locator('.rv-bar').getByRole('button', { name: 'Thêm bộ bài tập' }).click();
    const ns = g.locator('.rvseg[data-key="E|2"]');
    const addQ = async (name) => { await ns.getByRole('button', { name: 'Thêm câu hỏi' }).click(); await g.getByRole('menuitem', { name }).click(); };
    await addQ('Nối cặp'); await ns.getByRole('button', { name: 'Thêm cặp' }).click();
    ok('Nối cặp: pairs Cột A / Cột B editable, “Thêm cặp”', (await ns.locator('[data-rk^="Q|2|1|pairs."]').count()) === 6);
    for (const [k, a, b] of [[0, '老师', 'giáo viên'], [1, '学生', 'học sinh'], [2, '朋友', 'bạn bè']]) { await ns.locator(`[data-rk="Q|2|1|pairs.${k}.0"]`).fill(a); await ns.locator(`[data-rk="Q|2|1|pairs.${k}.1"]`).fill(b); }
    await addQ('Sắp xếp từ thành câu');
    ok('a completed Nối cặp question is no longer “Chưa hoàn chỉnh”', (await ns.locator('.rvseg-q[data-key="Q|2|1"] .chip.pending').count()) === 0 && (await ns.locator('.rvseg-q[data-key="Q|2|2"] .chip.pending').count()) === 1);
    await ns.getByRole('button', { name: 'Thêm mảnh' }).click();
    ok('Sắp xếp từ thành câu: pieces editable, “Thêm mảnh”', (await ns.locator('[data-rk^="Q|2|2|pieces."]').count()) === 3);
    await addQ('Đọc hiểu'); await ns.getByRole('button', { name: 'Thêm câu con' }).click();
    ok('Đọc hiểu: passage + sub-questions with options and key, “Thêm câu con”', (await ns.locator('[data-rk="Q|2|3|passage"]').count()) === 1 && (await ns.locator('[data-rk^="Q|2|3|subs."][data-rk$=".q"]').count()) === 2 && (await ns.getByRole('radio', { name: /Câu con 1 đáp án đúng A/ }).count()) === 1);
    await addQ('Trắc nghiệm từ vựng – Chọn nghĩa');
    ok('vocabulary multiple choice: “Từ (chữ Hán)” + “Pinyin của từ” + “Thêm phương án”', (await ns.locator('[data-rk="Q|2|4|word"]').count()) === 1 && (await ns.locator('[data-rk="Q|2|4|wpy"]').count()) === 1 && (await ns.locator('.rvseg-q[data-key="Q|2|4"]').getByRole('button', { name: /Thêm phương án/ }).count()) === 1);
    await p7.close();
  });

  /* ---------- 5. Deep links ---------- */
  await STEP('deep links', async () => {
    const p2 = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); watch(p2);
    const cases = [['T09', 'gv', 'T07'], ['T18', 'gv', 'T18'], ['S05', 'hv', 'S05'], ['T20', 'gv', 'T20'], ['A04', 'hv', 'A01'], ['S12', 'hv', 'S12'], ['S03', 'hv', 'S03'], ['T04', 'gv', 'T04'], ['A01', 'gv', 'A01'], ['T10', 'gv', 'T10'], ['T22', 'gv', 'T22'], ['T16', 'gv', 'T16'], ['S07', 'hv', 'S07'], ['S08', 'hv', 'S08']];
    for (const [h, fid, want] of cases) {
      await p2.goto(URL + '#' + h, { waitUntil: 'load' }); await p2.waitForTimeout(250);
      const s = await p2.locator(`[data-frame="${fid}"]`).getAttribute('data-screen');
      ok(`deep link #${h} opens the ${fid === 'gv' ? 'GV' : 'HV'} role at ${want}${h === 'A04' ? ' (A04 removed)' : ''}`, s === want && (await p2.locator('#view-' + fid).isVisible()) && !(await p2.locator('#landing').isVisible()), s);
    }
    await p2.goto(URL + '#T09', { waitUntil: 'load' }); await p2.waitForTimeout(200);
    ok('#T09 opens T07 on the Bài tập tab', (await p2.locator('[data-frame="gv"] [role="tab"][aria-selected="true"]').innerText()).startsWith('Bài tập'));
    await p2.evaluate(() => { location.hash = '#S09'; }); await p2.waitForTimeout(250);
    ok('hashchange #S09 → HV S09', (await p2.locator('[data-frame="hv"]').getAttribute('data-screen')) === 'S09' && (await p2.locator('#view-hv').isVisible()));
    await p2.goto(URL + '#T18', { waitUntil: 'load' }); await p2.waitForTimeout(200);
    ok('#T18 renders the 2-panel Soạn bài', (await p2.locator('[data-frame="gv"] .editor-grid > .panel-card').count()) === 2);
    ok('data-screen anchors on both frames', (await p2.locator('[data-frame][data-screen]').count()) === 2);
    await p2.close();
  });

  /* ---------- 6. Mobile 375 px ---------- */
  await STEP('mobile', async () => {
    const mob = await browser.newPage({ viewport: { width: 375, height: 812 } }); watch(mob);
    const sw = () => mob.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
    await mob.goto(URL, { waitUntil: 'load' }); await mob.waitForTimeout(400);
    ok('375px picker: no horizontal scroll', (await sw()) <= 375, String(await sw()));
    await mob.locator('.role-card[data-role="hv"]').click();
    const box = await mob.locator('#view-hv .scaler').boundingBox();
    ok('375px HV role: phone fits the width, no horizontal scroll', (await sw()) <= 375 && box.x >= 0 && box.x + box.width <= 375, JSON.stringify(box));
    await mob.getByRole('button', { name: 'Hướng dẫn' }).click();
    const g = await mob.locator('#guide').boundingBox();
    ok('375px guide panel fits', g.x >= 0 && g.x + g.width <= 375 && (await sw()) <= 375);
    await mob.goto(URL + '#T18', { waitUntil: 'load' }); await mob.waitForTimeout(300);
    ok('375px GV role (#T18): scaled, no horizontal scroll', (await sw()) <= 375, String(await sw()));
    await mob.screenshot({ path: SP + '/v6-375.png' });
    await mob.close();
  });

  /* ---------- 7. v14 Tự học (012–015, HV only since V15) + v15 Kho tự học của GV (016) — each step opens its own pages ---------- */
  await STEP("v14 012 tự học (S13–S15)", () => verify012({ browser, URL, ok, norm, watch, SP }));
  await STEP("v14 013 luyện viết (S16)", () => verify013({ browser, URL, ok, norm, watch, SP }));
  await STEP("v14 014 nghe & nói (S17–S18)", () => verify014({ browser, URL, ok, norm, watch, SP }));
  await STEP("v14 015 thi thử HSK (S19–S20)", () => verify015({ browser, URL, ok, norm, watch, SP }));
  await STEP("v15 016 kho tự học (T23–T27) + nối T24 → S14", () => verifyKho({ browser, URL, ok, norm, watch, SP }));
  await STEP("v14 tự học — nối các khối", () => verifyWire({ browser, URL, ok, norm, watch, SP }));

  const realErrors = errors.filter((e) => !/fonts\.(googleapis|gstatic)\.com/.test(e));
  ok('zero console / page errors', realErrors.length === 0, realErrors.slice(0, 6).join(' | '));
  console.log(results.join('\n'));
  console.log(`\n${results.length - fails}/${results.length} passed, ${fails} failed`);
  await browser.close();
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.log(results.join('\n')); console.error('SCRIPT ERROR', e); process.exit(2); });

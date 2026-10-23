#!/usr/bin/env node
// Regenerates per-module progress files and the project dashboard from the real sources of truth:
//   specs/modules.json (scope), spec.md frontmatter (status), tasks.md (tasks), analysis.md / verification.md
//   (verdicts), progress.md (last "## Handoff" block), test-cases.md (test case table), git (branch, commit).
// Outputs (generated — never edit by hand):
//   specs/NNN-slug/state.json   machine-readable state of one module (read by agents via /module NNN)
//   specs/dashboard.html        human dashboard: scope, waves, progress, tasks, hand-offs, tests
// Usage: node scripts/sync-state.mjs [NNN ...]   (ids limit which state.json files are rewritten; the
//        dashboard is always rebuilt from all modules)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { loadContext } from '../.sdd/scripts/lib/core.mjs';
import {
  listFeatures,
  parseSpec,
  parseTasks,
  taskSummary,
  readVerdict,
} from '../.sdd/scripts/lib/features.mjs';
import { nextPhase } from '../.sdd/scripts/lib/pipeline.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPECS = join(ROOT, 'specs');
const only = process.argv.slice(2);
const registry = JSON.parse(readFileSync(join(SPECS, 'modules.json'), 'utf8'));
const byId = new Map(registry.modules.map((m) => [m.id, m]));
const ctx = loadContext(ROOT);
const features = listFeatures(ctx);
const now = new Date();
const stamp = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  dateStyle: 'short',
  timeStyle: 'short',
}).format(now);

const git = (args) => {
  try {
    return execFileSync('git', args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
};

function lastHandoff(text) {
  if (!text) return null;
  const blocks = text.split(/^(?=## Handoff\b)/m).filter((b) => b.startsWith('## Handoff'));
  const b = blocks.at(-1);
  if (!b) return null;
  const body = b.split(/^## (?!Handoff)/m)[0].trim();
  const field = (k) =>
    (body.match(new RegExp(`^-\\s*${k}\\s*:\\s*(.+)$`, 'mi')) || [])[1]?.trim() ?? null;
  return {
    heading: body.split('\n')[0].replace(/^##\s*/, ''),
    done: field('Done this session'),
    inProgress: field('In progress'),
    next: field('Next'),
    blockers: field('Blockers(?: / questions)?'),
    verifyWith: field('Verify with'),
    raw: body.slice(0, 1500),
  };
}

function testCases(text) {
  if (!text) return null;
  const rows = text.split(/\r?\n/).filter((l) => /^\|\s*TC-\d+/.test(l));
  const status = (l) =>
    (
      l
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean)
        .at(-1) || ''
    ).toLowerCase();
  const count = (re) => rows.filter((l) => re.test(status(l))).length;
  const lastRun = (text.match(/^last_run:\s*(.+)$/m) || [])[1]?.trim() ?? null;
  return {
    total: rows.length,
    pass: count(/^pass/),
    fail: count(/^fail/),
    manual: count(/thủ công|manual/),
    notRun: count(/chưa chạy|not run/),
    blocked: count(/bị chặn|blocked/),
    lastRun,
  };
}

function nextAction(s) {
  if (!s.mvp) return 'Hoãn — không lên plan, không implement.';
  const depsLine = s.depsReady ? '' : ` (chú ý: phụ thuộc chưa xong: ${s.depsPending.join(', ')})`;
  switch (s.status) {
    case 'draft':
      return (
        (s.spec.openQuestions
          ? `Spec chưa sẵn sàng: còn ${s.spec.openQuestions} câu hỏi mở (agent viết spec xử lý)`
          : `/module ${s.id} → đánh dấu spec sẵn sàng, rồi bạn duyệt`) + depsLine
      );
    case 'clarified':
      return `Bạn duyệt trong terminal: node .sdd/scripts/sdd.mjs approve ${s.id} --by "Tên"`;
    case 'approved':
    case 'planned':
      return `/module ${s.id} → đọc spec, plan + task gọn, implement` + depsLine;
    case 'tasked':
      return `/module ${s.id} → implement ${s.tasks.next?.id ?? ''}`.trim() + depsLine;
    case 'implementing':
      if (s.tasks.blocked)
        return `${s.tasks.blocked} task bị chặn — xem Handoff; rồi /module ${s.id}`;
      if (s.tasks.total && s.tasks.done === s.tasks.total) {
        if (!s.tests?.total) return `/module ${s.id} → sinh test-cases.md`;
        if (s.tests.fail || s.tests.blocked)
          return `/module ${s.id} → sửa ${s.tests.fail + s.tests.blocked} test case lỗi, rồi /test-module ${s.id}`;
        return `/test-module ${s.id} (phiên mới) → agent QA chạy test case bằng Playwright MCP`;
      }
      return `/module ${s.id} → tiếp tục ${s.tasks.next?.id ?? ''}`.trim();
    case 'verified':
      return `/sdd-ship ${s.id}`;
    case 'shipped':
      return 'Đã ship.';
    default:
      return `/module ${s.id}`;
  }
}

const STATUS_ORDER = [
  'draft',
  'clarified',
  'approved',
  'planned',
  'tasked',
  'implementing',
  'verified',
  'shipped',
];
const states = [];
for (const f of features) {
  const reg = byId.get(f.id) ?? {
    id: f.id,
    name: f.meta.title ?? f.name,
    wave: null,
    deps: [],
    mvp: true,
    summary: '',
  };
  const spec = parseSpec(f.read('spec.md') ?? '');
  const tasks = parseTasks(f.read('tasks.md') ?? '');
  const sum = taskSummary(tasks);
  const s = {
    $generated: `Generated by scripts/sync-state.mjs at ${now.toISOString()} — do not edit; run: node scripts/sync-state.mjs ${f.id}`,
    id: f.id,
    folder: `specs/${f.name}`,
    name: reg.name,
    summary: reg.summary,
    note: reg.note ?? null,
    mvp: reg.mvp !== false,
    wave: reg.wave,
    deps: reg.deps,
    screens: reg.screens ?? [],
    status: f.status,
    statusIndex: STATUS_ORDER.indexOf(f.status),
    nextPhase: reg.mvp === false ? null : nextPhase(ctx, f),
    command: `/module ${f.id}`,
    spec: {
      stories: new Set([...(f.read('spec.md') ?? '').matchAll(/\bUS-\d+\b/g)].map((m) => m[0]))
        .size,
      requirements: spec.requirements.length,
      acceptanceCriteria: spec.criteria.length,
      nfrs: spec.nfrs.length,
      openQuestions: Math.ceil(spec.clarifications.length / 2),
    },
    tasks: {
      total: sum.total,
      done: sum.done,
      todo: sum.todo,
      inProgress: sum.inProgress,
      blocked: sum.blocked,
      next: sum.next ? { id: sum.next.id, text: sum.next.text } : null,
      list: tasks.map((t) => ({
        id: t.id,
        state: t.state,
        text: t.text,
        acs: t.acs,
        tags: t.tags,
      })),
    },
    analysis: readVerdict(f.read('analysis.md')),
    verification: readVerdict(f.read('verification.md')),
    tests: testCases(f.read('test-cases.md')),
    handoff: lastHandoff(f.read('progress.md')),
    files: [
      'spec.html',
      'spec.md',
      'plan.md',
      'tasks.md',
      'progress.md',
      'test-cases.md',
      'verification.md',
      'state.json',
    ].filter((n) => n === 'state.json' || existsSync(join(f.dir, n))),
    git: {
      branch: git(['rev-parse', '--abbrev-ref', 'HEAD']),
      lastCommit: git(['log', '-1', '--format=%h %s', '--', f.relDir]),
    },
    updatedAt: now.toISOString(),
  };
  states.push(s);
}
const statusOf = new Map(states.map((s) => [s.id, s.status]));
for (const s of states) {
  s.depsPending = s.deps.filter(
    (d) => STATUS_ORDER.indexOf(statusOf.get(d)) < STATUS_ORDER.indexOf('verified'),
  );
  s.depsReady = s.depsPending.length === 0;
  s.nextAction = nextAction(s);
}

for (const s of states) {
  if (only.length && !only.includes(s.id)) continue;
  const out = { ...s };
  writeFileSync(join(ROOT, s.folder, 'state.json'), JSON.stringify(out, null, 2) + '\n');
}

// ---------------------------------------------------------------- dashboard
// One table: every module and how far its implementation is. Rendered here (no client-side data).
const mvpStates = states.filter((s) => s.mvp);
const totals = {
  tasksDone: mvpStates.reduce((a, s) => a + s.tasks.done, 0),
  tasksTotal: mvpStates.reduce((a, s) => a + s.tasks.total, 0),
};
const VN = {
  draft: 'Nháp',
  clarified: 'Đã làm rõ',
  approved: 'Đã duyệt',
  planned: 'Có plan',
  tasked: 'Có task',
  implementing: 'Đang code',
  verified: 'Đã kiểm chứng',
  shipped: 'Đã ship',
};
const TONE = {
  draft: 'muted',
  clarified: 'warn',
  approved: 'info',
  planned: 'info',
  tasked: 'info',
  implementing: 'accent',
  verified: 'ok',
  shipped: 'ok',
};
const esc = (v) =>
  String(v ?? '').replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
  );
const ordered = [...mvpStates]
  .sort((a, b) => (a.wave ?? 99) - (b.wave ?? 99) || a.id.localeCompare(b.id))
  .concat(states.filter((s) => !s.mvp));

const row = (s) => {
  const t = s.tasks;
  const pct = t.total ? Math.round((t.done * 100) / t.total) : 0;
  const status = s.mvp
    ? `<span class="st ${TONE[s.status] ?? 'muted'}">${esc(VN[s.status] ?? s.status)}</span>`
    : '<span class="st muted">Hoãn</span>';
  const progress = !s.mvp
    ? '—'
    : t.total
      ? `<div class="bar"><div style="width:${pct}%"></div></div><span class="small">${t.done}/${t.total} task · ${pct}%${t.blocked ? ` · <b class="danger">${t.blocked} bị chặn</b>` : ''}</span>`
      : '<span class="small muted">chưa có task</span>';
  const current = t.next
    ? `<b>${esc(t.next.id)}</b> <span class="small">${esc(t.next.text.replace(/\s+—\s+files:.*$/, '')).slice(0, 80)}</span>`
    : '<span class="muted">—</span>';
  const tests = s.tests
    ? `${s.tests.pass}/${s.tests.total} đạt${s.tests.fail ? ` · <b class="danger">${s.tests.fail} lỗi</b>` : ''}`
    : '<span class="muted">—</span>';
  const next = s.mvp
    ? `${esc(s.nextAction)}<br><code>${esc(s.command)}</code>`
    : '<span class="muted">Ngoài MVP</span>';
  return `<tr class="${s.mvp ? '' : 'off'}"><td class="id">${s.id}</td><td><a href="${esc(s.folder.replace(/^specs\//, ''))}/spec.html">${esc(s.name)}</a></td><td>${status}</td><td class="prog">${progress}</td><td>${current}</td><td>${tests}</td><td class="next">${next}</td></tr>`;
};

const html = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SAT Module Progress</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="assets/spec.css">
<style>
  .wrap { max-width: 1320px; margin: 0 auto; padding: 24px; }
  .top { display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap; margin-bottom: 14px; }
  .top h1 { margin: 0; font-size: 22px; }
  .top .small { margin-left: auto; }
  .small { font-size: 12.5px; color: var(--text-muted); }
  .muted { color: var(--text-muted); }
  .danger { color: var(--danger); }
  table { background: var(--surface); }
  td { vertical-align: middle; }
  td.prog { min-width: 170px; }
  td.next { font-size: 13px; max-width: 330px; }
  td.next code { display: inline-block; margin-top: 4px; }
  .bar { height: 8px; background: var(--surface-2); border-radius: 99px; overflow: hidden; margin-bottom: 4px; }
  .bar > div { height: 100%; background: var(--ok); }
  .st { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap; }
  .st.muted { background: var(--surface-2); color: var(--text-muted); }
  .st.warn { background: var(--warn-soft); color: var(--warn); }
  .st.info { background: var(--info-soft); color: var(--info); }
  .st.accent { background: var(--accent-soft); color: var(--accent); }
  .st.ok { background: var(--ok-soft); color: var(--ok); }
  tr.off td { opacity: .55; }
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <h1>SAT — Tiến độ module</h1>
    <span class="small">${totals.tasksDone}/${totals.tasksTotal} task hoàn thành</span>
    <span class="small">Đồng bộ lúc ${esc(stamp)} · <label><input type="checkbox" id="auto"> tự làm mới 60 giây</label></span>
  </div>
  <div class="table-wrap"><table>
    <thead><tr><th class="id">ID</th><th>Module</th><th>Trạng thái</th><th>Tiến độ</th><th>Task đang làm / tiếp theo</th><th>Test case</th><th>Bước tiếp</th></tr></thead>
    <tbody>${ordered.map(row).join('')}</tbody>
  </table></div>
</div>
<script>
  (function () {
    var box = document.getElementById('auto'), key = 'sat-dash-auto', t;
    try { box.checked = localStorage.getItem(key) === '1'; } catch (e) {}
    function arm() { clearTimeout(t); if (box.checked) t = setTimeout(function () { location.reload(); }, 60000); }
    box.addEventListener('change', function () { try { localStorage.setItem(key, box.checked ? '1' : '0'); } catch (e) {} arm(); });
    arm();
  })();
</script>
</body>
</html>
`;
writeFileSync(join(SPECS, 'dashboard.html'), html);
console.log(
  `state.json: ${only.length ? only.join(', ') : 'all'} · dashboard.html rebuilt · ${states.length} modules · ${totals.tasksDone}/${totals.tasksTotal} tasks`,
);

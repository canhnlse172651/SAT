// Tests for the sdd CLI plumbing. Run: node --test .sdd/scripts/test/
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { slugify, parseFrontmatter, setFrontmatter, loadContext } from '../lib/core.mjs';
import { parseSpec, parseTasks, isEars, resolveFeature } from '../lib/features.mjs';
import { checkFeature, traceFeature, gate } from '../lib/checks.mjs';
import { newFeature, approve, setStatus, setTaskState } from '../lib/lifecycle.mjs';

const SDD_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CLI = join(SDD_DIR, 'scripts', 'sdd.mjs');

let root;
let ctx;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'sdd-'));
  cpSync(join(SDD_DIR, 'templates'), join(root, '.sdd', 'templates'), { recursive: true });
  writeFileSync(join(root, '.sdd', 'config.json'), JSON.stringify({ paths: { specs: 'specs', src: ['src'], tests: ['tests'] } }));
  process.env.SDD_ROOT = root;
  delete process.env.SDD_FEATURE;
  delete process.env.CLAUDECODE; // the suite itself may run inside a Claude Code session
  ctx = loadContext();
});

const SPEC_BODY = `
## 5. Functional Requirements

### REQ-1: Login

- AC-1.1: WHEN a user submits valid credentials THE SYSTEM SHALL create a session
- AC-1.2: IF the password is wrong THEN THE SYSTEM SHALL show an error

## 6. Non-Functional Requirements

- NFR-1: Performance: p95 login ≤ 300 ms
`;

function writeSpec(f, body = SPEC_BODY) {
  const text = readFileSync(f.path('spec.md'), 'utf8');
  writeFileSync(f.path('spec.md'), text.slice(0, text.indexOf('## 5.')) + body);
}

const TASKS = `# Tasks
- [ ] T001 [infra] Setup
- [ ] T002 [test] Tests for AC-1.1, AC-1.2
- [ ] T003 Implement login (AC-1.1, AC-1.2)
`;

function advanceToTasked() {
  const created = newFeature(ctx, 'Đăng nhập bằng email', { branch: false });
  let f = resolveFeature(ctx, created.id);
  writeSpec(f);
  setStatus(ctx, f, 'clarified');
  approve(ctx, resolveFeature(ctx, f.id), 'tester');
  f = resolveFeature(ctx, f.id);
  writeFileSync(f.path('plan.md'), '# Plan\n## 3. Constitution Check\nREQ-1 handled by AuthService.\n');
  setStatus(ctx, f, 'planned');
  f = resolveFeature(ctx, f.id);
  writeFileSync(f.path('tasks.md'), TASKS);
  setStatus(ctx, f, 'tasked');
  return resolveFeature(ctx, f.id);
}

test('slugify handles Vietnamese and punctuation', () => {
  assert.equal(slugify('Đăng nhập bằng Email!'), 'dang-nhap-bang-email');
  assert.equal(slugify('  API: v2 / users  '), 'api-v2-users');
});

test('frontmatter round-trip preserves body and CRLF', () => {
  const text = '---\r\nid: 001\r\nstatus: draft\r\n---\r\n# Title\r\n';
  const out = setFrontmatter(text, { status: 'clarified', approved_by: 'An' });
  assert.deepEqual(parseFrontmatter(out).data, { id: '001', status: 'clarified', approved_by: 'An' });
  assert.ok(out.endsWith('---\r\n# Title\r\n'));
});

test('EARS detection', () => {
  assert.ok(isEars('WHEN x happens THE SYSTEM SHALL do y'));
  assert.ok(isEars('IF x THEN THE SYSTEM SHALL y'));
  assert.ok(!isEars('The system should do y'));
});

test('parseSpec ignores examples inside HTML comments and code fences', () => {
  const spec = parseSpec(`---\nstatus: draft\n---\n<!--\n### REQ-9: example\n- AC-9.1: WHEN x THE SYSTEM SHALL y\n-->\n\`\`\`\n### REQ-8: fenced\n\`\`\`\n${SPEC_BODY}`);
  assert.deepEqual(spec.requirements.map((r) => r.id), ['REQ-1']);
  assert.deepEqual(spec.criteria.map((c) => c.id), ['AC-1.1', 'AC-1.2']);
  assert.deepEqual(spec.nfrs.map((n) => n.id), ['NFR-1']);
});

test('parseTasks reads state, tags and AC references', () => {
  const tasks = parseTasks('- [x] T001 [P] [test] a (AC-1.1, AC-1.2)\n- [!] T002 b ⛔ BLOCKED: x\n- [~] T003 c\n');
  assert.deepEqual(tasks.map((t) => t.state), ['done', 'blocked', 'in-progress']);
  assert.deepEqual(tasks[0].tags, ['p', 'test']);
  assert.deepEqual(tasks[0].acs, ['AC-1.1', 'AC-1.2']);
});

test('new feature numbers sequentially and fills the template', () => {
  const a = newFeature(ctx, 'First feature', { branch: false });
  const b = newFeature(ctx, 'Second feature', { branch: false });
  assert.equal(a.id, '001');
  assert.equal(b.name, '002-second-feature');
  const f = resolveFeature(ctx, '002');
  assert.equal(f.status, 'draft');
  assert.equal(f.meta.title, 'Second feature');
  assert.doesNotMatch(f.read('spec.md'), /\{\{[A-Z_]+\}\}/);
});

test('cannot leave draft with clarification markers or non-EARS criteria', () => {
  const f = resolveFeature(ctx, newFeature(ctx, 'X', { branch: false }).id);
  writeSpec(f, '## 5.\n### REQ-1: a\n- AC-1.1: the system should work [NEEDS CLARIFICATION: how?]\n');
  assert.throws(
    () => setStatus(ctx, resolveFeature(ctx, f.id), 'clarified'),
    (e) => /NEEDS CLARIFICATION/.test(e.message) && /not EARS/.test(e.message),
  );
});

test('approval is a human gate: refused inside an agent, only via `approve`, only from clarified', () => {
  const f = resolveFeature(ctx, newFeature(ctx, 'X', { branch: false }).id);
  writeSpec(f);
  assert.throws(() => approve(ctx, f, 'Lead'), /Only a "clarified" spec/);
  setStatus(ctx, f, 'clarified');
  process.env.CLAUDECODE = '1';
  assert.throws(() => approve(ctx, resolveFeature(ctx, f.id), 'agent'), /human gate/);
  delete process.env.CLAUDECODE;
  assert.throws(() => approve(ctx, resolveFeature(ctx, f.id)), /--by/);
  assert.throws(() => setStatus(ctx, resolveFeature(ctx, f.id), 'approved'), /sdd approve/);
  approve(ctx, resolveFeature(ctx, f.id), 'Lead');
  assert.equal(resolveFeature(ctx, f.id).meta.approved_by, 'Lead');
});

test('plan gate is closed until the spec is approved', () => {
  const f = resolveFeature(ctx, newFeature(ctx, 'X', { branch: false }).id);
  writeSpec(f);
  setStatus(ctx, f, 'clarified');
  assert.equal(gate(ctx, 'plan', resolveFeature(ctx, f.id)).ok, false);
  approve(ctx, resolveFeature(ctx, f.id), 'Lead');
  assert.equal(gate(ctx, 'plan', resolveFeature(ctx, f.id)).ok, true);
});

test('tasks must cover every acceptance criterion and cite only known ones', () => {
  const f = advanceToTasked();
  writeFileSync(f.path('tasks.md'), '- [ ] T001 Implement (AC-1.1, AC-7.7)\n');
  const { errors } = checkFeature(ctx, resolveFeature(ctx, f.id));
  assert.ok(errors.some((e) => /unknown AC-7\.7/.test(e)));
  assert.ok(errors.some((e) => /AC-1\.2 is not covered/.test(e)));
});

test('implement gate requires a passing analysis; verify gate requires all tasks done', () => {
  let f = advanceToTasked();
  assert.match(gate(ctx, 'implement', f).reasons.join(), /analysis\.md/);
  writeFileSync(f.path('analysis.md'), 'Verdict: PASS_WITH_WARNINGS\n');
  assert.equal(gate(ctx, 'implement', f).ok, true);
  setStatus(ctx, f, 'implementing');
  f = resolveFeature(ctx, f.id);
  assert.equal(gate(ctx, 'verify', f).ok, false);
  for (const t of ['T001', 'T002', 'T003']) f = setTaskState(ctx, f, t, 'done');
  assert.equal(gate(ctx, 'verify', f).ok, true);
});

test('trace finds feature-qualified AC citations in tests and blocks verified on gaps', () => {
  let f = advanceToTasked();
  writeFileSync(f.path('analysis.md'), 'Verdict: PASS\n');
  setStatus(ctx, f, 'implementing');
  f = resolveFeature(ctx, f.id);
  for (const t of ['T001', 'T002', 'T003']) f = setTaskState(ctx, f, t, 'done');
  writeFileSync(f.path('verification.md'), 'Verdict: PASS\n');

  mkdirSync(join(root, 'tests'), { recursive: true });
  writeFileSync(join(root, 'tests', 'login.test.ts'), `it('[${f.id}:AC-1.1] creates a session', () => {});`);
  assert.deepEqual(traceFeature(ctx, f).gaps, [`AC-1.2 has no test citing "${f.id}:AC-1.2"`]);
  assert.throws(() => setStatus(ctx, f, 'verified'), /trace: AC-1\.2/);

  mkdirSync(join(root, 'src', 'auth'), { recursive: true });
  writeFileSync(join(root, 'src', 'auth', 'test_login.py'), `"""${f.id}:AC-1.2"""`);
  assert.deepEqual(traceFeature(ctx, f).gaps, []);
  setStatus(ctx, f, 'verified');
  assert.equal(resolveFeature(ctx, f.id).status, 'verified');
});

test('moving backwards requires a reason and clears approval', () => {
  const f = advanceToTasked();
  assert.throws(() => setStatus(ctx, f, 'draft'), /--reason/);
  setStatus(ctx, f, 'draft', { reason: 'scope change' });
  const g = resolveFeature(ctx, f.id);
  assert.equal(g.status, 'draft');
  assert.equal(g.meta.approved_by, '');
});

test('CLI: unconfigured toolchain steps are skipped, --required fails', () => {
  const run = (...args) => spawnSync(process.execPath, [CLI, ...args], { cwd: root, encoding: 'utf8', env: { ...process.env } });
  const ok = run('run', 'lint');
  assert.equal(ok.status, 0);
  assert.match(ok.stdout, /skip lint/);
  assert.equal(run('run', 'lint', '--required').status, 1);
  assert.equal(run('ci').status, 0);
});

test('CLI: configured toolchain command runs with passthrough args', () => {
  writeFileSync(join(root, '.sdd', 'config.json'), JSON.stringify({ toolchain: { test: 'node -e "console.log(process.argv.slice(1).join(\',\'))"' } }));
  const r = spawnSync(process.execPath, [CLI, 'run', 'test', '--', 'a', 'b c'], { cwd: root, encoding: 'utf8', env: { ...process.env } });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /a,b c/);
});

# SAT

Dự án được xây dựng **100% bởi Claude agents** theo quy trình **Spec-Driven Development**:

```text
ý tưởng → spec (EARS) → ⛳ người duyệt → plan → tasks → analyze → implement (TDD) → verify → PR → CI → staging → ⛳ production
```

Agent làm toàn bộ công việc; con người giữ 2 quyết định: **duyệt spec** và **duyệt deploy production**.
Mọi "đã xong" đều được kiểm chứng bằng máy (CLI `sdd`, hooks, CI), không dựa vào lời agent.

## Bắt đầu nhanh

**Stack:** React 19 + Zustand · NestJS 12 · MongoDB (Mongoose) · TypeScript monorepo — xem [ADR-0002](docs/adr/0002-tech-stack.md), [ADR-0004](docs/adr/0004-backend-nestjs.md).

**Yêu cầu:** [Claude Code](https://code.claude.com), **Node.js 24 LTS** (`.nvmrc`; Node 20 đã EOL), Git, Docker (cho MongoDB khi dev).

```bash
git init && git add -A && git commit -m "chore: spec-driven agent harness + walking skeleton"
npm ci                                   # cài dependency (npm workspaces)
npx playwright install chromium          # 1 lần, cho e2e
node .sdd/scripts/sdd.mjs ci --e2e       # lint → typecheck → test → build → e2e (phải xanh)
claude                                   # mở Claude Code trong thư mục dự án
```

Chạy app khi phát triển:

```bash
cp .env.example .env
docker compose up -d mongo               # MongoDB 8 local
npm run dev                              # API :3000 + web :5173 (Vite proxy /api)
```

Trong Claude Code (stack đã bootstrap sẵn, bỏ qua `/sdd-init`):

```text
/sdd-spec <tính năng đầu tiên>
/sdd-clarify 001
```

Đọc `specs/001-*/spec.md`, rồi **ở terminal của bạn**: `node .sdd/scripts/sdd.mjs approve 001 --by "Tên bạn"`

```text
/sdd-auto --feature 001      # plan → tasks → analyze → implement → verify
/sdd-ship 001                # mở Pull Request
```

Chạy không giám sát: `node .sdd/scripts/sdd.mjs pipeline --feature 001`. Chạy trên GitHub: gắn label `sdd:spec` vào issue.
Chi tiết: **[docs/WORKFLOW.md](docs/WORKFLOW.md)**. Riêng cho SAT (context, thứ tự module, bàn giao giữa các phiên): **[docs/AGENT-PLAYBOOK.md](docs/AGENT-PLAYBOOK.md)**, spec tổng quan: **[specs/index.html](specs/index.html)**.

## Cấu trúc

```text
CLAUDE.md               Sổ tay vận hành cho agent (luôn được nạp)
.claude/agents/         8 agent theo vai trò: product-analyst, architect, task-planner, test-engineer,
                        implementer, reviewer, security-auditor, release-engineer
.claude/skills/         Lệnh pipeline: /sdd-init /sdd-spec /sdd-clarify /sdd-plan /sdd-tasks /sdd-analyze
                        /sdd-implement /sdd-verify /sdd-ship /sdd-auto /sdd-status
.claude/hooks/          Guardrails (chặn bypass gate, lệnh phá hoại, lộ secret, sửa test/harness)
.claude/settings.json   Permissions + nối hooks
.sdd/                   Bộ máy SDD: config.json (toolchain contract + gates), templates/, scripts/ (CLI `sdd` + tests)
docs/                   constitution.md, steering/ (product, tech, structure), adr/, runbooks/, WORKFLOW.md
specs/NNN-slug/         Mỗi feature: spec → plan → tasks → analysis → progress → verification
apps/web/               React 19 + Vite + Zustand (feature folders, test cạnh code)
apps/api/               NestJS 12 + Mongoose + Zod + pino (Nest module theo domain)
tests/e2e/              Playwright: build production + MongoDB in-memory (hermetic)
Dockerfile              1 image: API NestJS phục vụ /api + SPA; docker-compose.yml cho dev
.github/                CI, @claude, Claude review, issue→spec PR, build spec đã duyệt, deploy
```

## CLI `sdd`

```bash
node .sdd/scripts/sdd.mjs help
node .sdd/scripts/sdd.mjs status            # các feature, trạng thái, bước tiếp theo
node .sdd/scripts/sdd.mjs check --all       # lint artifact theo trạng thái
node .sdd/scripts/sdd.mjs trace 001 --write # ma trận AC → task → test
node .sdd/scripts/sdd.mjs ci                # lint → typecheck → test → build → spec gates
```

## Tham khảo

Thiết kế kết hợp các ý tưởng mạnh nhất từ (xem [ADR-0001](docs/adr/0001-adopt-spec-driven-development.md)):
[github/spec-kit](https://github.com/github/spec-kit) ·
[AWS Kiro specs](https://kiro.dev/docs/specs/) / [gotalab/cc-sdd](https://github.com/gotalab/cc-sdd) ·
[BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) ·
[obra/superpowers](https://github.com/obra/superpowers) ·
[Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) ·
[Anthropic — Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) ·
[Claude Code best practices](https://www.anthropic.com/engineering/claude-code-best-practices) ·
[anthropics/claude-code-action](https://github.com/anthropics/claude-code-action)



How AI start a module

Khi gõ /module 003 trong một phiên Claude Code mới
#	Agent làm gì	Đọc / ghi
0	Chạy node scripts/sync-state.mjs 003 để đồng bộ, rồi xem module đang ở bước nào. Nếu có Handoff dở dang thì làm tiếp từ đó.	đọc specs/003-classes/state.json
1	Đọc spec và đúng các file code sẽ sửa (tìm bằng grep). Nạp skill theo tầng: nestjs-expert, react-expert, typescript-pro.	đọc spec.md; tech.md và structure.md đã nạp sẵn
2	Lập plan gọn: mỗi REQ một task; chạy sdd check để tự kiểm tra. Trạng thái chuyển "Có plan → Có task".	ghi plan.md, tasks.md, analysis.md
3	Implement từng task: viết test trước (phải đỏ) → viết code → test xanh → đánh dấu task xong → commit feat(003): T010 … → cập nhật dashboard. Trạng thái "Đang code".	ghi code + test vào apps/, cập nhật tasks.md, progress.md
4	Sinh test case: mỗi AC có ít nhất một test case, gắn với test thật.	ghi test-cases.md
5	Chạy lint, typecheck, test và e2e một lần; ghi Pass/Fail thật. Xanh hết thì chuyển "Đã kiểm chứng".	cập nhật test-cases.md, ghi verification.md
⏹	Trước khi dừng (xong, bị chặn hoặc hết phiên): ghi Handoff, commit, cập nhật dashboard.	progress.md, state.json, dashboard.html
Phiên bị ngắt giữa chừng thì mở phiên mới và gõ lại /module 003. Agent đọc Handoff cuối và làm tiếp đúng chỗ.

AI sinh file vào đâu
1. Tài liệu và trạng thái của module: nằm trong thư mục specs/003-classes/.


specs/003-classes/
├── spec.md            ← đầu vào (agent viết spec làm); agent implement chỉ đọc, không sửa
├── spec.html          ← bản đọc cho người
├── plan.md            ← SINH: plan gọn (file/endpoint/schema/store cho từng REQ)
├── tasks.md           ← SINH: danh sách task, trạng thái [ ] [~] [x] [!]
├── analysis.md        ← SINH: kết quả sdd check (Mode: lean)
├── progress.md        ← SINH: nhật ký + các khối Handoff
├── test-cases.md      ← SINH: test case từng AC + Pass/Fail lần chạy cuối
├── verification.md    ← SINH: kết quả chạy test cuối cùng + Verdict
└── state.json         ← SINH TỰ ĐỘNG bởi sync-state (file bạn đang mở): không sửa tay
2. Code: nằm trong apps/, theo quy ước ở docs/steering/structure.md. Với module 003 (domain classes):


apps/api/src/modules/classes/          ← backend NestJS
├── classes.module.ts                  # Nest module
├── classes.controller.ts              # HTTP: validate (Zod) → gọi service → trả DTO
├── classes.service.ts                 # quy tắc nghiệp vụ
├── classes.model.ts                   # schema Mongoose + index
├── classes.schemas.ts                 # schema Zod cho request/response
└── classes.service.test.ts …          # test đi kèm, tên test có [003:AC-x.y]

apps/web/src/features/classes/         ← frontend React
├── ClassList.tsx, CreateClassWizard.tsx …   # component các màn hình T02, T03, T04, S01, S02, S11
├── classes-store.ts                   # Zustand store của domain
└── *.test.tsx                         # test component

tests/e2e/classes.spec.ts              ← test e2e Playwright (nếu module có luồng giao diện)
apps/api/src/app.module.ts             ← đăng ký module mới (sửa nhỏ)
# SAT — Hướng dẫn quản lý dự án bằng agent

Dành cho người điều phối dự án. Bổ sung cho [WORKFLOW.md](WORKFLOW.md) (quy trình SDD chung) bằng
những gì riêng cho SAT:
- theo dõi dự án ở đâu;
- mỗi module có những file gì;
- gọi agent làm tiếp một module bằng `/module`;
- agent nhớ nghiệp vụ ở đâu.

---

## 0. Tóm tắt trong 30 giây

```text
1. Mở specs/dashboard.html             → xem danh sách module, trạng thái, tiến độ task, test case
2. Chọn module, lấy lệnh ở cột "Bước tiếp" → ví dụ /module 003
3. Mở phiên Claude Code, dán /module 003 → agent đọc toàn bộ thư mục module, làm bước tiếp theo,
                                          cập nhật state.json + dashboard, ghi Handoff trước khi dừng
4. Lặp lại. Phiên sau (hoặc agent khác) gõ lại /module 003 là làm tiếp đúng chỗ.
```

Con người chỉ giữ 2 việc: **duyệt spec** (`node .sdd/scripts/sdd.mjs approve NNN --by "Tên"`) và
**duyệt deploy production**.

---

## 1. Trang theo dõi: `specs/dashboard.html`

Một bảng duy nhất: mỗi dòng một module (theo thứ tự wave, module hoãn ở cuối) với **ID, tên (link tới spec.html),
trạng thái, thanh tiến độ task (x/N, số task bị chặn), task đang làm / tiếp theo, test case đạt, bước tiếp + lệnh `/module NNN`**.
Chi tiết hơn (danh sách task, Handoff) xem trong thư mục module: `tasks.md`, `progress.md`, `state.json`.

- **Cập nhật:** trang được sinh lại bởi `node scripts/sync-state.mjs`. Agent tự chạy lệnh này sau mỗi task và trước khi dừng.
  - Bật "Tự làm mới 60 giây" để trang tự tải lại khi agent đang chạy.
  - Bạn cũng có thể tự chạy lệnh đó bất cứ lúc nào.
- **Trang liên quan:**
  - [specs/index.html](../specs/index.html): đặc tả tổng quan (quyết định, module, câu hỏi mở);
  - [specs/screen-flow-design.html](../specs/screen-flow-design.html): prototype bấm thử, mở thẳng một màn hình bằng `#T18`, `#S05`.

## 2. Thư mục của mỗi module: `specs/NNN-slug/`

| File | Nội dung | Ai viết |
|------|----------|---------|
| `spec.md` | **Spec để AI implement**: user story, REQ, tiêu chí chấp nhận (AC) dạng EARS, NFR | product-analyst; khóa sau khi duyệt |
| `spec.html` | Bản đọc cho người: flow, quy tắc, màn hình (khớp 100% với spec.md) | product-analyst |
| `plan.md`, `data-model.md`, `contracts/` | Thiết kế kỹ thuật | architect |
| `tasks.md` | Danh sách task theo thứ tự, test trước code; trạng thái `[ ] [~] [x] [!]` | task-planner; đổi trạng thái bằng `sdd task` |
| `progress.md` | Nhật ký + các khối **Handoff** (đã làm gì, dở gì, bước tiếp) | agent làm việc |
| `test-cases.md` | **Test case** cho từng AC (kịch bản người dùng) + trạng thái Pass/Fail/Bị chặn lần chạy gần nhất | `/module` viết trước khi code; `/test-module` ghi trạng thái |
| `testing/e2e/TC-###.spec.ts` | Script Playwright agent QA lưu lại từ lần chạy thật, chạy lại được không cần AI | `/test-module` |
| `testing/runs/<thời điểm>/` | Kết quả mỗi lần chạy: `report.md`, `results.json`, `screenshots/` | `/test-module`, `run test:modules` |
| `analysis.md`, `verification.md` | Bằng chứng qua cổng kiểm tra | reviewer, /sdd-verify |
| `state.json` | **File trạng thái** của module, sinh tự động từ các file trên | `node scripts/sync-state.mjs` |

Vì sao `state.json` được sinh tự động chứ không để agent tự ghi: trạng thái thật nằm ở `spec.md`
(status), `tasks.md` (task), `progress.md` (Handoff), `test-cases.md` (test) và git. Sinh từ đó thì
file trạng thái không bao giờ lệch thực tế. Phạm vi dự án (tên module, wave, phụ thuộc, màn hình)
nằm ở [specs/modules.json](../specs/modules.json); sửa file này khi phạm vi thay đổi.

## 3. Lệnh `/module NNN`

**Bản rút gọn để tiết kiệm token.** Spec do agent khác chuẩn bị sẵn; `/module` làm mọi việc trong **một phiên, không gọi
agent con**: đọc spec → sinh test case → implement theo pattern fullstack → bàn giao cho agent QA.
Module **không viết code test**; việc kiểm chứng do `/test-module NNN` (phiên khác) làm bằng Playwright MCP — xem mục kế tiếp.

| Bước | Agent làm |
|------|-----------|
| 0. Đồng bộ | `sync-state` → đọc `state.json`. Dừng nếu module hoãn, spec còn câu hỏi mở, hoặc chưa được bạn duyệt. Có Handoff dở dang thì làm tiếp từ đó. |
| 1. Đọc | Chỉ `spec.md` của module + đúng các file code sẽ sửa (tìm bằng grep). Nạp skill fullstack theo tầng: `nestjs-expert` (backend), `react-expert` (frontend), `typescript-pro`. Quy ước trong `tech.md`/`structure.md` luôn được ưu tiên. |
| 2. Plan gọn + test case | Nếu chưa có: `plan.md` ≤ 60 dòng, `tasks.md` **mỗi REQ một task**, **`test-cases.md`** (mỗi AC ≥ 1 test case E2E/API viết như người dùng thật), `analysis.md` từ `sdd check`. |
| 3. Implement | Từng task: code theo quy ước (không viết test) → lint, typecheck, test nền tảng, build xanh → `sdd task done` → commit → cập nhật dashboard. |
| 4. Bàn giao QA | Cập nhật `test-cases.md` theo đúng giao diện đã làm; Handoff với bước tiếp "`/test-module NNN` trong phiên mới". Trạng thái vẫn là Đang implement. |
| 5. Sửa lỗi | Khi lần chạy QA có test case Fail: đọc `testing/runs/<mới nhất>/report.md`, sửa code ứng dụng (không sửa script hay kết quả mong đợi), chạy lại nhanh bằng `run test:modules -- NNN TC-…`, rồi nhờ `/test-module NNN` chạy lại. |
| Luôn luôn | Trước khi dừng: Handoff, commit, `sync-state`, báo 6 dòng. |

Cần kiểm tra sâu hơn (review code, bảo mật) cho một module quan trọng: chạy thêm `/sdd-verify NNN` (bản đầy đủ, tốn token hơn).
Quy trình đầy đủ nhiều agent (`/sdd-auto`) vẫn còn nếu sau này cần.

### Lệnh `/test-module NNN` (agent QA)

Chạy trong **phiên Claude Code mới** sau khi `/module` bàn giao. Agent QA dựng app giống CI (bản build + MongoDB tạm, dữ liệu
mẫu), dùng **Playwright MCP** để mở trình duyệt và làm từng test case như người dùng thật (GV ở 1280 px, HV ở 390 px), kiểm
đúng câu chữ trong AC, chụp màn hình, xem lỗi console/API. Với mỗi test case, agent lưu một script Playwright chạy lại được
vào `testing/e2e/` (tiêu đề trích `NNN:AC-x.y` để `sdd trace` nối AC với kiểm chứng) và kết quả vào `testing/runs/<thời điểm>/`.
Tất cả Pass → `verification.md` PASS → module Đã kiểm chứng. Có lỗi → báo cáo chi tiết, quay lại `/module NNN` để sửa.
Agent QA không bao giờ sửa code ứng dụng hay spec.

Chạy lại các script đã lưu mà không cần AI (kiểm tra hồi quy): `node .sdd/scripts/sdd.mjs run test:modules -- NNN`.

### Cài đặt quy trình QA (một lần, bạn tự chạy)

Các file được hook bảo vệ nên agent chỉ soạn sẵn trong `docs/tooling/`. Chạy trong terminal ở thư mục dự án.

Git Bash:

```bash
cp docs/tooling/skills/module/SKILL.md .claude/skills/module/SKILL.md
cp docs/tooling/skills/feature/SKILL.md .claude/skills/feature/SKILL.md
mkdir -p .claude/skills/test-module && cp docs/tooling/skills/test-module/SKILL.md .claude/skills/test-module/SKILL.md
cp docs/tooling/constitution.v2.md docs/constitution.md
cp docs/tooling/CLAUDE.v2.md CLAUDE.md
claude mcp add --scope project playwright -- npx -y @playwright/mcp@0.0.83
```

PowerShell:

```powershell
Copy-Item docs\tooling\skills\module\SKILL.md .claude\skills\module\SKILL.md -Force
New-Item -ItemType Directory -Force .claude\skills\test-module | Out-Null
Copy-Item docs\tooling\skills\test-module\SKILL.md .claude\skills\test-module\SKILL.md -Force
Copy-Item docs\tooling\constitution.v2.md docs\constitution.md -Force   # constitution 2.0.0 (nguyên tắc II, III)
Copy-Item docs\tooling\CLAUDE.v2.md CLAUDE.md -Force                     # vai trò QA, quy ước test
claude mcp add --scope project playwright -- npx -y @playwright/mcp@0.0.83
```

Sau đó mở phiên Claude Code mới để skill và MCP có hiệu lực.

### Cài đặt `/module` (một lần)

Thư mục `.claude/` được hook bảo vệ, agent không tự ghi vào được. File lệnh đã soạn sẵn ở
`docs/tooling/skills/module/SKILL.md`. **Bạn** chạy trong terminal của mình:

```bash
mkdir -p .claude/skills/module && cp docs/tooling/skills/module/SKILL.md .claude/skills/module/SKILL.md
```

Sau đó mở phiên Claude Code mới, gõ `/module 001` để thử.

**Tùy chọn:** để dashboard tự cập nhật sau mỗi phiên, thêm vào `.claude/settings.json` một hook `Stop`
chạy `node scripts/sync-state.mjs`. Đây là file harness, nên bạn tự thêm hoặc cho phép tạm bằng
`SDD_ALLOW_HARNESS_EDIT=1`.

## 4. Context để agent hiểu nghiệp vụ

| Lớp | File | Khi nào được đọc |
|-----|------|------------------|
| Luôn nạp | `CLAUDE.md` → `docs/constitution.md`, `docs/steering/product.md`, `tech.md`, `structure.md` | Mọi phiên, tự động |
| Phạm vi & lộ trình | `specs/modules.json`, `docs/steering/roadmap.md` | `/module`, khi bắt đầu việc |
| Quyết định | `docs/steering/decisions.md` (cột Active) + Clarifications Log trong spec | `/module`, khi có thay đổi |
| Module | Thư mục `specs/NNN-slug/` | `/module NNN` |

Nguyên tắc: mọi hiểu biết về dự án nằm trong file của repo. Bộ nhớ riêng của Claude trên máy bạn
không chia sẻ cho người khác hay CI, nên chỉ dùng cho sở thích cá nhân.

**Khi bạn đổi yêu cầu:** gõ `/feature <mô tả nhu cầu>`. Skill tự tìm module liên quan (ví dụ việc về giáo trình vào 002) hoặc tạo module mới, cho bạn xem kế hoạch, rồi làm các bước dưới đây. Làm tay thì:
1. Cập nhật spec của module bị ảnh hưởng (`spec.md` + `spec.html`).
2. Thêm một dòng vào `decisions.md`; sửa `product.md` và `modules.json` nếu phạm vi đổi.
3. Chạy `node scripts/check-spec-html.mjs` và `node .sdd/scripts/sdd.mjs check --all`.
4. Nếu module đã duyệt: đưa về nháp bằng `sdd set-status NNN draft --reason "…"` và duyệt lại.

## 5. Thứ tự làm module

```text
Wave 1  001 Tài khoản
Wave 2  002 Giáo trình & Bài
Wave 3  003 Lớp học (lõi)
Wave 4  004 Bài học  ∥  005 Bài tập      → rồi phần hạn nộp + email nhắc của 003
Wave 5  008 Xếp hạng ∥  010 Tạo bài bằng AI
Wave 6  009 Dashboard
Wave 7  011 Hồ sơ học viên
Hoãn    006 Bài thi, 007 Chấm tự luận
```

- **Trước wave 1:**
  - khởi tạo git: `git init && git add -A && git commit -m "chore: SAT specs + harness"`;
  - trả lời các câu hỏi mở;
  - chốt các ADR nền tảng (email, lưu trữ tệp, job định kỳ, AI, hosting; xem `roadmap.md` §2).
- **Hai module chạy song song** (ví dụ 004 ∥ 005):
  - tạo một worktree cho mỗi module: `git worktree add ../sat-004 -b feat/004-lessons-flashcards`;
  - mở Claude Code ở từng thư mục và gõ `/module 004`, `/module 005`;
  - không bao giờ để 2 agent làm cùng một module.
- **Chạy không giám sát:** `node .sdd/scripts/sdd.mjs pipeline --feature NNN`. Chạy xong thì `node scripts/sync-state.mjs` và `/module NNN` để sinh test case.

## 6. Prompt mẫu

```text
/module 003
```
```text
/module 003 — chỉ làm tới hết Phase 3 trong tasks.md rồi dừng, ghi Handoff.
```
```text
Thay đổi nghiệp vụ: <mô tả>. Cập nhật spec các module bị ảnh hưởng (spec.md + spec.html),
decisions.md, modules.json nếu phạm vi đổi; chạy scripts/check-spec-html.mjs, sdd check --all,
rồi node scripts/sync-state.mjs.
```

## 7. Lệnh kiểm tra có sẵn

| Lệnh | Việc |
|------|------|
| `node scripts/sync-state.mjs [NNN]` | Sinh lại `state.json` và `specs/dashboard.html` |
| `node .sdd/scripts/sdd.mjs status` | Bảng trạng thái module trong terminal |
| `node scripts/check-spec-html.mjs [NNN]` | `spec.html` khớp `spec.md` (AC, NFR), ID màn hình, sơ đồ |
| `node scripts/check-spec-prototype.mjs [NNN] [--all-missing]` | Màn hình và câu chữ giao diện trong AC có trong prototype không |
| `node scripts/find-in-prototype.mjs "<chữ>"` | Tìm câu chữ trong prototype (xem prototype đang ghi gì) |
| `node scripts/design/verify-prototype.cjs` | Bấm thử toàn bộ prototype |
| `node .sdd/scripts/sdd.mjs trace NNN` | Ma trận AC → task → test |
| `node .sdd/scripts/sdd.mjs ci --e2e` | lint → typecheck → test → build → e2e → check |

## 8. Nền tảng (wave 0)

Wave 0 (nhánh `feat/000-foundation`, kế hoạch [docs/plans/foundation-plan.md](plans/foundation-plan.md), ADR-0005…0008) đã dựng
sẵn hạ tầng dùng chung. Module chỉ viết logic nghiệp vụ. Cách dùng chi tiết: `docs/steering/tech.md`; vị trí file: `structure.md`.

| Phần | Ở đâu | Có gì |
|------|-------|-------|
| Dùng chung api + web | `packages/shared` (`@sat/shared`) | Vai trò, bậc HSK, mã lỗi, `objectId`, phân trang, giờ Việt Nam, định dạng số/điểm, pinyin |
| Backend | `apps/api/src/common/` | Phiên + `AuthGuard` toàn cục, `@Public/@Roles/@CurrentUser`, `scoped()` theo workspace, `notFound()`, `baseSchemaOptions`, `updateWithVersion` (409), `paginate`, `parse()`, cổng `CLOCK / EMAIL_SENDER / FILE_STORAGE / JOB_SCHEDULER` |
| Endpoint hạ tầng | `apps/api/src/modules/{health,session,files}`, `common/dev` | `GET /api/session`, `GET /api/files/:id`; chỉ dev/test: `POST /api/dev/session`, `GET /api/dev/outbox`; `npm run seed -w @sat/api` |
| Frontend | `apps/web/src/{app,layouts,features/session,features/toast,components,styles}` | Bảng route theo mã màn hình (`app/screens.ts`) với trang "Đang xây dựng", khung GV/HV, `RequireRole`, `session-store`, `toast-store`, `apiRequest`, UI kit + `/dev/ui`, design tokens |
| Bộ test | `apps/api/src/test`, `apps/web/src/test`, `tests/e2e/fixtures.ts` | `createTestApp`, `loginAs`, factories; `renderWithProviders`, `stubFetch`; `loginAs(page, role)` cho e2e |

Quy tắc bắt buộc khi implement một module:

1. **Mọi truy vấn dữ liệu nghiệp vụ đi qua `scoped()` / `WorkspaceScopedRepository`**; schema có `workspaceIdField` và chỉ mục
   `workspaceIndex`. Không tìm thấy, khác workspace, sai vai trò, id hỏng → đều `notFound()` (A05). Mỗi endpoint có test truy cập chéo workspace.
2. **Mỗi controller khai báo `@Roles('GV')` hoặc `@Roles('HV')`** (route công khai dùng `@Public()`); validate mọi input bằng `parse(schema, input)`;
   thời gian lấy từ `CLOCK`, gửi email qua `EMAIL_SENDER` — không `new Date()`, không gọi dịch vụ ngoài trực tiếp.
3. **Thay placeholder bằng trang thật**: màn hình đã có trong `app/screens.ts`; cho `lazy` của mã màn hình đó trong `app/routes.tsx` import trang ở
   `features/<domain>/`. Không tự tạo đường dẫn mới, không tự viết guard/khung.
4. **Giao diện chỉ dùng UI kit (`components/index.ts`) và token trong `styles/tokens.css`**; gọi API qua `apiRequest` và store Zustand; định dạng
   ngày giờ/điểm/pinyin bằng `@sat/shared`. Thiếu component dùng chung thì thêm vào `components/` + test + `/dev/ui`.
5. **Test bằng bộ kit**: API `createTestApp` + `loginAs` + factories; web `renderWithProviders` + `stubFetch`; e2e `loginAs` trong `tests/e2e/fixtures.ts`.
   Không dùng `dev_*` cho nghiệp vụ: `common/directory` và `dev_workspaces`/`dev_users` là bản tạm, **module 001 thay bằng collection thật**
   (gắn `WORKSPACE_DIRECTORY`, sửa factories và seed).

# Foundation Plan — nền tảng backend, frontend và phần dùng chung

> Kế hoạch cho **wave 0** (trước module 001). Đây là việc `[infra]`: được phép làm khi spec module chưa được duyệt
> (CLAUDE.md, ground rule 1). Nền tảng chỉ cung cấp **cơ chế dùng chung**; mọi hành vi nghiệp vụ (đăng ký, đăng nhập,
> kích hoạt HV, giáo trình…) vẫn thuộc module của nó và chỉ làm khi spec được duyệt.
> Ngày lập: 2026-10-23 · Trạng thái: **đang thực hiện** — ADR-0005…0008 đã chấp nhận; F00–F12 và F14 xong, F13 và F15 còn lại (§8).
>
> **Khác với bản đề xuất:**
> - Frontend dùng **`react-router` v8** (`^8.5.0`, chế độ thư viện/data), không phải v7: lúc quyết định v8 là bản `latest`, v7 chỉ còn
>   nhánh bảo trì; quyết định "react-router ở chế độ thư viện" không đổi (ADR-0007). Mọi chỗ ghi "v7" bên dưới hiểu là v8.
> - **Test unit web chờ Node 24 trên máy local**: máy phát triển hiện chạy Node 20 nên chưa chạy được bộ test `apps/web` (dự án yêu cầu
>   Node ≥ 24.15: `engines`, `.nvmrc`); CI chạy Node 24. Cần chạy lại `node .sdd/scripts/sdd.mjs run test` trên Node 24 trước khi đóng F15.

## 1. Mục tiêu và tiêu chí xong

Sau wave 0, một agent mở `/module 001` (và các module sau) chỉ cần viết logic nghiệp vụ, không phải dựng hạ tầng.

Xong khi:
- `node .sdd/scripts/sdd.mjs ci --e2e` xanh trên nhánh `feat/000-foundation`.
- Có một **walking skeleton** đi qua mọi lớp: phiên đăng nhập (tạo bằng endpoint dev) → guard theo vai trò và workspace →
  `GET /api/session` → frontend hiển thị đúng khung GV (desktop) hoặc HV (mobile) với menu thật; mở sai màn hình được
  chuyển hướng đúng quy tắc 001 (xem §6.2).
- Bộ UI kit theo `docs/design/DESIGN.md` có test và một trang `/dev/ui` (chỉ dev) hiển thị mọi component.
- `tech.md` và `structure.md` được cập nhật cho các quy ước mới.

Không thuộc wave 0: luồng nghiệp vụ của 001–016, chọn nhà cung cấp email / lưu trữ / AI / hosting thật (chỉ dựng *port*
và adapter cho dev), giao diện các màn hình nghiệp vụ.

## 2. Hiện trạng (đã có)

| Phần | Đã có | Ghi chú |
|------|-------|---------|
| API | `main.ts`, `app.module.ts` (`AppModule.forRoot`), `app.ts` (`configureApp`: helmet, body 100 KB, prefix `/api`, filter, phục vụ SPA), `config.ts` (Zod env), `errors.ts` (`AppError` + `ApiExceptionFilter`), `logger.ts`, `database.module.ts`, module `health` | Theo ADR-0004 |
| Web | `main.tsx`, `App.tsx`, `lib/api-client.ts` (`apiRequest`, `ApiError`), feature `health` + store Zustand, `test/setup.ts`, `styles.css` (28 dòng) | Chưa có router, layout, design tokens |
| Test / CI | Vitest (api + web), Playwright `tests/e2e/health.spec.ts` + `server.mjs`, `.github/workflows/ci.yml` … | |
| Repo | **Chưa `git init`** | Bắt buộc trước khi làm (commit theo task) |

## 3. Quyết định cần chốt (viết thành ADR trước khi code)

| ADR | Quyết định | Đề xuất | Vì sao |
|-----|-----------|---------|--------|
| 0005 | Xác thực và phiên | **Phiên phía server lưu MongoDB + cookie `httpOnly` `Secure` `SameSite=Lax`** chứa id phiên ngẫu nhiên (≥ 256 bit, chỉ lưu bản băm). Băm mật khẩu bằng `node:crypto` **scrypt** (không thêm thư viện). Chống CSRF: cùng origin + kiểm tra header `Origin` với request ghi + `SameSite`. | 001 yêu cầu: HV hết phiên sau 30 ngày không thao tác, GV 8 giờ, nhiều phiên đồng thời, đăng xuất chỉ thiết bị hiện tại, đổi mật khẩu đăng xuất phiên khác, khóa tài khoản có hiệu lực ngay. JWT không thu hồi được tức thì nên không hợp. |
| 0006 | Tách biệt workspace và quy ước dữ liệu | Mọi tài liệu nghiệp vụ có `workspaceId`. **Ngữ cảnh request** (AsyncLocalStorage) giữ `{ userId, role, workspaceId, requestId }`. Repository dùng helper `scoped(model)` tự thêm `workspaceId` vào mọi truy vấn. Sai workspace hoặc không tồn tại → cùng một lỗi `404 NOT_FOUND` (A05). Id công khai là chuỗi ObjectId. `timestamps`, `version` cho kiểm tra xung đột (`409 CONFLICT` khi `expectedVersion` lệch). Không xóa cứng dữ liệu có học tập — lưu trữ. | Nguyên tắc "Workspace isolation" và "Never lose learning data" (product.md); 004 AC-2.3 và 016 AC-1.5 cần phát hiện sửa đồng thời. |
| 0007 | Gói dùng chung và router frontend | Thêm workspace **`packages/shared`** (`@sat/shared`): schema Zod của hợp đồng API, enum (vai trò, trạng thái, cấp HSK 7 bậc), mã lỗi, tiện ích giờ Việt Nam và pinyin. Build bằng `tsc` ra `dist` (ESM), api và web cùng import. Frontend thêm **`react-router` v7** (chế độ thư viện) — *thực tế dùng v8, xem đầu file*. | ~50 màn hình có tham số, layout lồng nhau và guard theo vai trò: tự viết router không đáng. `react-router` là MIT, phổ biến nhất; phương án khác: router tự viết (~150 dòng, thiếu lazy-load và scroll restore). |
| 0008 | Cổng hạ tầng (ports) | Định nghĩa interface `EmailSender`, `FileStorage`, `Clock`, `JobScheduler` trong API; wave 0 chỉ có adapter dev: email ghi vào collection `dev_outbox` + log, lưu tệp ra thư mục `var/uploads`, `SystemClock` / `FixedClock` cho test. Nhà cung cấp thật chọn ở các ADR đã liệt kê trong roadmap §2. | Module 001, 003, 004, 006, 012–016 cần email, tệp, đồng hồ (hạn nộp 23:59, giờ thi, SRS) — dựng cổng sớm để test không phụ thuộc dịch vụ ngoài. |

Phụ thuộc mới đề xuất (mỗi cái một dòng trong ADR): `react-router` (web). Không thêm thư viện băm mật khẩu, cookie,
CSRF hay ngày giờ — dùng `node:crypto`, header thuần, `Intl` với `timeZone: 'Asia/Ho_Chi_Minh'`.

## 4. Cấu trúc đích

```text
packages/shared/src/
├── index.ts
├── roles.ts              # 'GV' | 'HV'
├── hsk.ts                # 7 bậc: 1–6, '7-9' + nhãn "HSK 7–9"
├── errors.ts             # mã lỗi chung: VALIDATION_ERROR, UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, CONFLICT, RATE_LIMITED…
├── api/                  # schema Zod dùng chung: session, pagination, error body
├── time.ts               # giờ VN: startOfDayVN, endOfDayVN (23:59:59), formatVN (dd/MM/yyyy, HH:mm), isoUtc
├── numbers.ts            # định dạng số kiểu Việt Nam: 75,9 · 1.000
└── pinyin.ts             # số thanh → dấu (hao3 → hǎo), bỏ dấu để tìm kiếm, chuẩn hoá ü/v

apps/api/src/
├── common/
│   ├── context/          # RequestContext (AsyncLocalStorage) + middleware gắn requestId, user, workspace
│   ├── auth/             # SessionService, Session model, cookie helper, password (scrypt), AuthGuard,
│   │                     # @Public(), @Roles('GV'|'HV'), @CurrentUser(), Origin check cho request ghi
│   ├── tenancy/          # scoped(model) / WorkspaceScopedRepository, assertSameWorkspace → NOT_FOUND
│   ├── persistence/      # baseSchemaOptions (timestamps, toJSON → DTO, bỏ _id/__v), version/conflict helper,
│   │                     # pagination (?page&limit, max 100) + cursor helper
│   ├── ports/            # EmailSender, FileStorage, Clock, JobScheduler + adapter dev
│   ├── validation/       # parse(schema, input) dùng chung cho controller
│   └── dev/              # DevModule (chỉ khi NODE_ENV ≠ production): POST /api/dev/session, GET /api/dev/outbox
├── modules/session/      # GET /api/session (người dùng hiện tại + workspace + vai trò) — hạ tầng, không phải luồng 001
└── test/                 # createTestApp(), withMongo(), loginAs(role), factories (workspace, gv, hv)

apps/web/src/
├── app/                  # router.tsx (route table theo mã màn hình), providers, ErrorBoundary
├── layouts/              # AuthLayout (A01–A03), TeacherShell (sidebar), StudentShell (tab bar mobile)
├── components/           # UI kit (xem §6)
├── lib/                  # api-client (credentials, 401 → A01 kèm returnTo, ApiError), format (dùng @sat/shared)
├── features/session/     # session-store (Zustand: idle|loading|ok|error), RequireRole guard
├── pages/                # NotFoundPage (A05), dev/UiCatalog (/dev/ui), placeholder cho route chưa làm
└── styles/               # tokens.css (từ DESIGN.md), base.css, fonts
```

## 5. Backend — phần dùng chung

1. **Request context**: middleware gán `requestId` (đã có từ pino-http) và sau guard thì `user`, `role`, `workspaceId`; logger
   tự đính kèm `userId`, `workspaceId` (không email, không tên).
2. **Phiên và guard** (ADR-0005): `SessionService.create/validate/touch/revoke/revokeAllExcept`, hạn theo vai trò cấu hình
   trong `config.ts` (`SESSION_TTL_GV_HOURS=8`, `SESSION_TTL_HV_DAYS=30`), cookie `sat_sid`. `AuthGuard` toàn cục: mặc định cần
   đăng nhập, `@Public()` để mở. `@Roles()` sai vai trò ở API → `404 NOT_FOUND` (không lộ dữ liệu, 001 AC-16.x / AC-20.x); điều hướng trên giao diện xem §6.2.
   Băm mật khẩu `hashPassword/verifyPassword` (scrypt, tham số trong ADR) — chỉ là tiện ích; luồng đăng nhập thuộc 001.
3. **Workspace isolation** (ADR-0006): `scoped(Model)` bọc `find/findOne/update/delete/count/aggregate` tự thêm
   `workspaceId`; test bảo đảm không truy vấn được tài liệu của workspace khác.
4. **Quy ước persistence**: `baseSchemaOptions`, `toDto`, `withVersion` (tăng `version`, ném `CONFLICT` khi lệch),
   pagination dùng chung, chỉ mục bắt buộc có `workspaceId` đứng đầu.
5. **Ports + adapter dev** (ADR-0008): `Clock` được inject ở mọi nơi tính thời gian; `EmailSender` dev ghi outbox (để e2e đọc
   email kích hoạt sau này); `FileStorage` dev lưu đĩa, trả URL `/api/files/:id` (kiểm tra quyền qua workspace).
6. **Origin check + giới hạn**: chặn request ghi có `Origin` khác; body JSON giữ 100 KB, upload đi đường riêng sau này.
7. **Endpoint hạ tầng**: `GET /api/session` (200 với user hoặc 401), `POST /api/dev/session` + `GET /api/dev/outbox`
   (chỉ dev/test, không đăng ký module khi production — có test chứng minh).
8. **Seed dev**: `npm run seed -w @sat/api` tạo 1 workspace "Cô Lan", 1 GV, 3 HV mẫu (dữ liệu giả, không mật khẩu thật).

## 6. Frontend — phần dùng chung

1. **Design tokens**: chuyển nguyên khối token trong `docs/design/DESIGN.md` thành `styles/tokens.css` (màu, chữ, khoảng cách,
   bo góc, bóng, chuyển động, focus) + `base.css`; font Be Vietnam Pro, Newsreader, Noto Serif SC, Noto Sans SC; quy tắc pinyin
   thanh 3 (DESIGN.md: không đặt pinyin trong font serif tiêu đề, thêm font dự phòng có Latin Extended-B).
2. **Router + layout**: route table theo mã màn hình (A01–A05, T01–T27, S01–S20) — route chưa làm trỏ tới trang placeholder
   "Đang xây dựng" (chỉ dev); `TeacherShell` với sidebar đúng thứ tự Dashboard | Lớp học | Giáo trình | Bài thi | Học viên |
   Kho tự học | Tài khoản; `StudentShell` với tab bar Lớp của tôi | Bài thi | Tự học | Xếp hạng | Tài khoản (vừa 360 px);
   `AuthLayout`. Guard `RequireRole` theo đúng 001: chưa đăng nhập → A01 kèm `returnTo`; HV mở màn GV (T01–T27) → S01 (AC-16.3, AC-20.10);
   GV mở màn HV S01–S12 → T01 (AC-16.4); GV mở màn Tự học S13–S20 → A05 (AC-20.4); dữ liệu workspace khác → A05 (AC-16.2).
3. **Trạng thái và dữ liệu**: `session-store`, `toast-store`, mẫu store theo tech.md (`status: idle|loading|ok|error`);
   `api-client` thêm `credentials: 'same-origin'`, xử lý 401 toàn cục, chuẩn hoá `ApiError` dùng mã lỗi của `@sat/shared`.
4. **UI kit** (mỗi component có test theo role/label, có trong `/dev/ui`): Button (primary/outline/ghost/danger, loading),
   IconButton, StatusChip (Đã làm / Chưa làm / Nộp muộn / Quá hạn / Chưa mở / Nháp / Đã xuất bản / Lưu trữ), HskBadge (7 bậc),
   Tabs, SegmentedControl, TextField / Textarea / Select / Checkbox / Switch / FormField (lỗi + đếm ký tự), DatePicker dạng
   popup dd/MM/yyyy, Dialog + ConfirmDialog, Drawer (desktop) / BottomSheet (mobile), Toast, DataTable (sort, trạng thái rỗng),
   EmptyState, ErrorState, Skeleton, Avatar, Pagination, HanziText / PinyinText (đúng `lang`, font), AudioButton cơ bản.
5. **Tiện ích**: định dạng ngày giờ VN, số kiểu Việt Nam, đếm ngược (dùng chung cho bài thi, thi thử), `useDocumentTitle`.
6. **A05 và lỗi**: trang "Không tìm thấy nội dung" dùng chung cho 404 và sai quyền; ErrorBoundary hiển thị lỗi kèm `requestId`.

## 7. Test, công cụ và CI

- API: `createTestApp({ clock, modules })` dùng `Test.createTestingModule` + `configureApp` + mongodb-memory-server;
  `loginAs('GV'|'HV', { workspace })` tạo phiên trực tiếp; factories cho workspace / GV / HV.
- Web: `renderWithProviders(ui, { route, session })` (router bộ nhớ + reset store); fetch stub dùng chung.
- E2E: `tests/e2e/fixtures.ts` đăng nhập qua `POST /api/dev/session`; test walking skeleton GV và HV ở viewport 1280 và 390.
- Thêm `packages/shared` vào workspaces, `tsconfig` references, ESLint/Prettier phạm vi mới; CI giữ `sdd ci --e2e`.
- Cập nhật `docs/steering/tech.md` (quy ước common/, tenancy, auth decorators, ports, shared) và `structure.md`.

## 8. Danh sách task

Mã `F0x` dùng cho thư mục `specs/000-foundation/` không bắt buộc — task được theo dõi ngay trong file này và trong commit
(`chore(000): F03 …`). Kích cỡ: S ≤ 2 giờ agent, M ≤ nửa ngày, L ≤ 1 ngày.

| Task | Việc | Phụ thuộc | Cỡ | Xong khi | Trạng thái |
|------|------|-----------|----|----------|------------|
| F00 | `git init`, commit nền, tạo nhánh `feat/000-foundation` | — | S | Có commit đầu, nhánh mới | ✅ xong |
| F01 | Viết ADR-0005 … 0008 (architect), cập nhật bảng ADR trong roadmap | F00 | M | 4 ADR trạng thái *proposed* → con người chấp nhận | ✅ xong |
| F02 | `packages/shared`: cấu hình workspace, build, exports; roles, hsk, errors, time, numbers, pinyin + test | F01 | M | api và web import được; test giờ VN và pinyin xanh | ✅ xong |
| F03 | API context + auth: RequestContext, Session model/service, cookie, scrypt, AuthGuard, `@Public/@Roles/@CurrentUser`, Origin check | F02 | L | Test: thiếu phiên 401, hết hạn theo vai trò, thu hồi phiên, sai vai trò 404 | ✅ xong |
| F04 | API tenancy + persistence: `scoped()`, baseSchemaOptions, toDto, version/conflict, pagination | F02 | M | Test chéo workspace luôn NOT_FOUND; CONFLICT khi lệch version | ✅ xong |
| F05 | API ports + adapter dev: Clock, EmailSender (outbox), FileStorage (đĩa), JobScheduler (stub) | F02 | M | Inject được trong test với FixedClock; outbox đọc được | ✅ xong |
| F06 | API endpoints hạ tầng + DevModule + seed: `GET /api/session`, `POST /api/dev/session`, `GET /api/dev/outbox`, `npm run seed` | F03, F04, F05 | M | Production không đăng ký DevModule (có test); seed chạy được | ✅ xong |
| F07 | API test kit: createTestApp, withMongo, loginAs, factories | F03, F04 | S | Test mẫu dùng kit chạy xanh | ✅ xong |
| F08 | Web nền: tokens.css + base.css + font từ DESIGN.md, router v8 (ADR-0007), route table A/T/S, placeholder, A05, ErrorBoundary | F02 | M | Mọi mã màn hình có route; A05 hiển thị đúng | ✅ xong |
| F09 | Web layouts + session: TeacherShell, StudentShell (360 px), AuthLayout, session-store, RequireRole, api-client mới | F08 | M | Điều hướng sai vai trò đúng 001 (S01 / T01 / A05); chưa đăng nhập → A01 kèm returnTo | ✅ xong |
| F10 | UI kit đợt 1: Button, IconButton, StatusChip, HskBadge, Tabs, SegmentedControl, form controls, FormField | F08 | M | Test role/label; có trong `/dev/ui` | ✅ xong |
| F11 | UI kit đợt 2: Dialog/Confirm, Drawer/BottomSheet, Toast, DataTable, EmptyState/ErrorState/Skeleton, Avatar, Pagination, DatePicker, HanziText/PinyinText, AudioButton | F08 | L | Như F10; DatePicker dd/MM/yyyy giờ VN | ✅ xong |
| F12 | Web test kit: renderWithProviders, fetch stub, reset store | F09 | S | Test mẫu dùng kit chạy xanh | ✅ xong |
| F13 | Walking skeleton E2E: fixtures đăng nhập dev, GV desktop + HV mobile, các trường hợp mở sai màn hình | F06, F09 | M | Playwright xanh ở 1280 và 390 px | ✅ xong — 10 e2e xanh (578205e) |
| F14 | Tài liệu: tech.md, structure.md, AGENT-PLAYBOOK (cách dùng common), `.env.example` biến mới | F03–F13 | S | Agent module đọc là đủ dùng | ✅ xong |
| F15 | Chạy `sdd ci --e2e`, sửa lỗi, Handoff, PR | tất cả | S | CI xanh, PR mở | ⏳ gần xong — lint, typecheck, build, test API + shared (98), e2e (10), check --all đều xanh; còn chạy test web khi có Node 24 và mở PR khi repo có remote |

## 9. Thứ tự và chạy song song bằng subagent

```text
F00 → F01 → F02 ─┬─ Nhóm A (backend):  F03 → F07          (agent api-auth)
                 │                     F04                 (agent api-data)   ┐
                 │                     F05                 (agent api-ports)  ┘→ F06
                 └─ Nhóm B (frontend): F08 → F09 → F12     (agent web-shell)
                                       F10, F11            (agent web-ui, sau F08)
F06 + F09 → F13 → F14 → F15                                (điều phối)
```

- Tối đa **5 agent song song** sau F02 (api-auth, api-data, api-ports, web-shell, web-ui); mỗi agent chỉ sửa thư mục của mình,
  hợp đồng chung đi qua `packages/shared` (đã khoá ở F02 — muốn đổi phải báo điều phối).
- Ước lượng: F00–F02 ≈ nửa ngày; nhóm A và B chạy song song ≈ 1 ngày; F13–F15 ≈ nửa ngày → **khoảng 2 ngày làm việc của agent**.
- Mỗi task: test trước (theo constitution II), một commit, `node scripts/sync-state.mjs` không áp dụng (không phải module).

## 10. Rủi ro và việc cần bạn chốt

1. **Chấp nhận ADR-0005…0008** (đặc biệt: phiên server + cookie thay vì JWT; thêm `react-router`; gói `packages/shared`).
2. **Font**: dùng Google Fonts như prototype (nhanh) hay tự host (riêng tư, không phụ thuộc mạng ngoài). Đề xuất: Google Fonts
   ở MVP, tự host khi chọn hosting (ADR-0003).
3. **Endpoint dev đăng nhập** chỉ tồn tại ngoài production; phải có test chặn — nếu không yên tâm, thay bằng script tạo phiên.
4. Wave 0 **không** thay thế việc duyệt spec: sau F15, module 001 vẫn cần trả lời câu hỏi mở còn lại, `sdd approve 001`, rồi
   `/module 001`.

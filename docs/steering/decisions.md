# Decision Register — SAT product decisions

Every stakeholder decision that shapes behaviour, newest rules winning. Each one is also logged in
the Clarifications Log of the affected `specs/NNN-slug/spec.md`, which is binding for implementation.
Agents: **read the "Active" column only**. Superseded rows are kept so nobody re-introduces an old rule.
Add a row whenever a stakeholder answer changes behaviour (product-analyst / orchestrator).

| ID | Date | Decision | Status | Modules |
|----|------|----------|--------|---------|
| D1 | 2026-10-18 | Each GV is the admin of an isolated workspace; no centre / super-admin. | Active | all |
| D2 | 2026-10-18 | Curriculum has 3 fixed parts (Bài học / Bài tập / Bài thi) at curriculum level. | Superseded by D2-v2, then V3-2 | 002 |
| D2-v2 | 2026-10-19 | Giáo trình → Bài → 3 sections per Bài. | Superseded by V3-2 | 002–006 |
| D3 | 2026-10-18 | Objective questions auto-graded; Viết/Nói graded manually; no AI grading. | Superseded by D3-v2 | 005, 007 |
| D3-v2 | 2026-10-19 | MVP has auto-graded types only; speaking, listening, free writing and manual grading (007) deferred. | Active | 005, 007 |
| D4 | 2026-10-18 | GV creates HV accounts; no HV self-registration. | Active (how: V4-6) | 001 |
| D5 | 2026-10-19 | GV can hide a section of a Bài **per class**. | Active | 003, 004, 005, 008, 009 |
| D6 | 2026-10-19 | AI generates lesson content from the GV's PDF; GV reviews before students see it. | Active (refined by V3-3, V4-1…3, V5-1) | 010 |
| X1 | 2026-10-19 | Unlimited retries; ranking uses the best attempt. | Superseded by V11 | 005, 008, 009 |
| X2 | 2026-10-19 | Hidden section: invisible to that class incl. old results; earned points kept; progress excludes it. | Active | 003, 005, 008, 009 |
| X3 | 2026-10-19 | GV views a submission read-only on T14. | Active | 005, 009 |
| X4 | 2026-10-19 | Exam schedule per class. | Superseded by V13-1 (one schedule per exam) | 006 |
| X5 | 2026-10-19 | Editing an exercise answer key re-grades submissions after GV confirmation. | Active | 005, 008 |
| V3-1 | 2026-10-20 | Track **exercises only**; no lesson-completion or time tracking. | Active | 004, 009 |
| V3-2 | 2026-10-20 | Each Bài has **2 sections** (Bài học, Bài tập); no learning path; exams (006) deferred. | Active — exam part superseded by V13-1 | 002–006, 008–010 |
| V3-3 | 2026-10-20 | Content creation screen T18 has 2 panels: manual and AI (upload + short description). | Active | 002, 010 |
| V3-4 | 2026-10-20 | AI output is reviewed per section and saved only when the GV approves. | Active (see V4-2/3) | 010 |
| V3-5 | 2026-10-20 | Prototype is role-based (pick GV or HV); no TOC / flow map / screen list in it. | Active | design |
| V4-1 | 2026-10-20 | The document is the source; AI creatively builds a complete lesson + exercises; ≥ 80 % knowledge coverage, never above the document's HSK level. | Active | 010 |
| V4-2 | 2026-10-20 | AI "Duyệt" = **publish** immediately. | Active | 002, 004, 005, 010 |
| V4-3 | 2026-10-20 | AI "Duyệt" **replaces** the section's old content (sets with submissions archived, points kept). | Active | 002, 004, 005, 010 |
| V4-4 | 2026-10-20 | Curriculum edits (incl. HSK level) apply live to classes using it. | Active | 002 |
| V4-5 | 2026-10-20 | No terms/consent checkbox at GV sign-up. | Active | 001 |
| V4-6 | 2026-10-20 | HV activation by email: GV enters email (single/Excel) → "Kích hoạt" → random password emailed; no forced change at first login. | Active | 001, 003 |
| V4-7 | 2026-10-20 | Student profile (011): avatar, cover, password, classes + progress + rank; classmates' profiles show shared classes only. | Active | 011, 003, 008 |
| V5-1 | 2026-10-20 | AI review T20: "Xem trước" (student view, 2 tabs) and "Chỉnh sửa" (inline per segment); approve per section. | Active | 010 |
| V6-1 | 2026-10-21 | Manual editing section-level with preview + Web/Mobile. | Superseded by V10-1 | 004, 005 |
| V6-2 | 2026-10-21 | T20 preview defaults to Web with a Web/Mobile switch. | Active | 010 |
| V7-1 | 2026-10-21 | Dashboard = class list (Đang hoạt động / Đã kết thúc, creation-date filter), 2 KPIs (active/total classes, "Bài đang chờ AI duyệt"), top 3 per class. | Active (tracking part replaced by V8-4) | 009 |
| V7-2 | 2026-10-21 | Dashboard creation-date filter uses a popup date picker. | Active | 009 |
| V8-1 | 2026-10-21 | Deadline per exercise set **per class** (23:59 Vietnam time); late submit allowed, labelled "Nộp muộn". | Active | 003, 005 |
| V8-2 | 2026-10-21 | Reminder email at **08:00 on the deadline day** to HV who have not submitted. | Active | 003, 001 |
| V8-4 | 2026-10-21 | Dashboard tracking = pick an exercise set → lists "Đã làm" / "Chưa làm"; no % bar, no attention rules. | Active | 009 |
| V9 | 2026-10-21 | Remove Web/Mobile from T07. | Absorbed by V10-1 | 004 |
| V10-1 | 2026-10-21 | One manual editor T07 with tabs Bài học \| Bài tập, edit-only (no preview, no Web/Mobile). | Active | 002, 004, 005 |
| V10-2 | 2026-10-21 | "Xem như học viên" (T21) only from the Bài list T06; shows the whole Bài, Web/Mobile switch. | Active | 002 |
| V11 | 2026-10-22 | **One attempt per exercise set, scored once**; after submitting the HV reviews answers + explanations; no "Lịch sử điểm", no retry. | Active | 005, 008, 003, 009 |
| V12-1 | 2026-10-22 | **The prototype `specs/screen-flow-design.html` is the reference for UI wording and the behaviour it shows**; specs were aligned to it (each spec §12 "Session 2026-10-22 (đồng bộ prototype)"). Edge cases the prototype does not simulate stay as written in the specs. | Active | all MVP |
| V12-2 | 2026-10-22 | Previews never submit: T21 shows exercises read-only with "Nộp bài" disabled; T20 "Xem trước" allows answering as a try + "Hiện đáp án", no "Nộp thử". | Active | 002, 005, 010 |
| V12-3 | 2026-10-22 | Reminder email = one per HV per class per day, single "Làm bài ngay" button. | Active | 003, 001 |
| V12-4 | 2026-10-22 | Visual direction "Mực & giấy" (paper, ink, vermilion seal accent, serif Hanzi) — tokens and components in `docs/design/DESIGN.md`. | Active | all UI |
| V12-5 | 2026-10-22 | "Cứ sửa spec theo prototype" (live T07): adding a step/set saves it as Nháp at once; the 30 limit excludes archived items (toast); "Lưu trữ" is immediate without confirmation and archived items stay editable; flashcard decks are edited in a dialog of T07 (T08 = that dialog); S06 shows the question type; T15 cells have no deadline/"Quá hạn"/"Nộp muộn"; no class-list search/re-sort (009 REQ-12 removed); GV ranking tab lists activated HV only. | Active | 002, 003, 004, 005, 008, 009, 010 |
| V13-1 | 2026-10-22 | **Bài thi is back in the MVP as a standalone module (006)**: GV writes an exam by hand (auto-graded types), assigns classes, sets giờ mở + thời lượng + giờ đóng; HV start any time in the window with the full duration (never past close); score shown at once, answers after close. Supersedes D2's "3rd section" and the 2026-10-20 deferral. | Active | 006, 003, 008, 009 |
| V13-2 | 2026-10-22 | **Điểm xếp hạng = 30% × TB bài tập + 70% × TB bài thi** (0–100). An item counts once submitted or once its deadline / close time passed (= 0); no item → average 0. Replaces "sum of set points". | Active | 008, 009, 011 |
| V13-3 | 2026-10-22 | HV see and can study every lesson of the course in any order; exercise sets are all shown but **doable and scored only when the GV set a deadline** for them in the class. | Active | 003, 004, 005, 009 |
| V13-4 | 2026-10-22 | No answer-key fix or re-grade once an exam is locked (006 Q-5 closed) — the GV checks the exam before it opens. | Active | 006 |
| V13-5 | 2026-10-22 | Keep in scope what the live T07 prototype lacks (blocks Tài liệu / Video / Hình ảnh / Âm thanh, set ↔ step practice link, reordering blocks / words / lines) and add it to the prototype. For features added after V12-1 (exams, "Chưa mở", 30/70 scores) the spec leads and the prototype is brought in line with it. | Active | 004, 005, 006, 008, 009 |
| V14-1 | 2026-10-22 | **Class-independent "Tự học" for every HV and GV** (no class needed, no public self-registration): 012 Từ vựng thông minh (SRS), 013 Luyện viết chữ Hán, 014 Luyện nghe & nói, 015 Thi thử HSK. Private per user; never in class ranking or GV dashboards. | Superseded in part by V15 (HV only) | 001, 012–015 |
| V14-2 | 2026-10-22 | Shared content = **system library HSK 1–9** maintained by the new role **Quản trị nội dung** (016, screens Q01–Q05), provisioned by the operator. | Superseded by V15 | 001, 016, 012–015 |
| V14-4 | 2026-10-22 | Voice recordings in Tự học (014) never leave the device in the MVP: one take per item/line, deleted on leaving/restart/logout; learners self-assess "Giống" / "Chưa giống" (assumption, revisit with phase-2 scoring). | Active | 014 |
| V14-3 | 2026-10-22 | MVP without AI for Tự học: stroke-by-stroke checking, record & replay, scripted role-play, auto-graded mock tests. Phase 2: free-handwriting recognition, pronunciation/tone scoring, AI role-play. | Active | 013, 014, 015 |
| V14-5 | 2026-10-22 | Open questions closed with the coordinator's recommendation (stakeholder: "làm theo recommend tốt nhất"): 013 "Chữ cần luyện" stays a separate list; 014 accuracy counts only the first attempt per listening item; 015 "Kiểm tra" per question in practice mode, no daily attempt cap (log only); 016 HSK 7–9 is one band, no re-grade of old mock results (attempts keep their version), content source is a launch prerequisite (licence field mandatory); self-study data purged within 24 h of account deletion. | Active | 001, 012–016 |
| V15 | 2026-10-22 | **Two roles only (GV, HV).** The role "Quản trị nội dung" is removed. Self-study content management moves into the GV app: each workspace has its own **Kho tự học** (016, T23–T27, sidebar "Kho tự học"), pre-loaded with a starter HSK set that the GV edits/extends/hides. **Tự học (S13–S20) is for HV only**; the GV manages and previews but does not use it. | Active | 001, 012–016 |
| V16 | 2026-10-23 | 001 Q-1 closed: **e-mail is unique across the whole system** (every GV and HV, incl. not-yet-activated HV); A01 needs only e-mail + password; a person studying with two GVs uses two e-mails. | Active | 001 |
| V17-1 | 2026-10-23 | 004 Q-1 closed: **file storage quota = 10 GB per GV workspace** in the MVP, counting lesson block files, flashcard files and PDF/Word source documents uploaded for AI generation (010); YouTube videos do not count. Warn the GV from 80 % used; refuse an upload that would push usage over the quota, with a clear message. Per-file limits (video 500 MB) unchanged. | Active (extended by V18-3: exercise images count too) | 004, 005, 010 |
| V17-2 | 2026-10-23 | 004 Q-2 closed: the Tài liệu block is **viewed inline in the step for PDF, DOCX and PPTX alike** (page turning, "Trang {x}/{y}", zoom) plus a "Tải về" button. | Active | 004 |
| V17-3 | 2026-10-23 | 004 Q-3 closed: a Video block **may use a YouTube link instead of an uploaded file**; YouTube links only; priority P2; YouTube videos do not count towards storage. No feature flag. | Active | 004 |
| V18-1 | 2026-10-27 | 005 Q-1 closed: **no audio in exercise question stems or options** in the MVP — deferred with the Nghe question type; a stem has text + at most 1 image; 010 generates no audio for exercises. | Active | 005, 010 |
| V18-2 | 2026-10-27 | 005 Q-2 closed: **re-grading after an answer-key change applies to every class, including ended ("Đã kết thúc") classes**; final rankings of ended classes may change. | Active | 005, 003, 008, 009 |
| V18-3 | 2026-10-27 | **Exercise question/option images count towards the 10 GB workspace quota** (extends V17-1): same usage display, 80 % warning and refusal message as 004; each file counted once; a duplicated set (005 AC-18.5) shares the original files, so it adds nothing. 004 AC-5.5/AC-5.6 must be aligned. | Active | 005, 004 |
| V19-1 | 2026-10-28 | 005 QA B1 (decision by the agent, delegated by the user): **an HV who opens a GV screen of 005 (T09 / the T07 "Bài tập" tab, incl. a direct link; T14) is sent to S01 "Lớp của tôi"** by the foundation route guard ("HV on T* → S01"), with no content of the Bài, set or submission revealed. A05 stays for a GV who is not the workspace owner and for a missing / foreign Bài or submission; not signed in → A01. Every refused caller gets the same answer as for missing content. One rule for all T* screens (005 AC-20.5, AC-21.2, NFR-9). | Active | 005 |
| V19-2 | 2026-10-28 | 005 QA B2 (decision by the agent, delegated by the user): **class-membership refusals follow 003 AC-14.5** (003 owns membership). HV not (or no longer) a member of the class, or the class no longer exists: opening S05/S06 of that class, starting, saving or submitting is refused with "Bạn không thuộc lớp này hoặc lớp không còn tồn tại" and the HV goes to S01; the in-progress attempt and saved answers are kept (005 AC-21.9 new). 005 AC-21.3 keeps A05 for every other reason; AC-21.6 no longer covers removal. Same conflict as QA 004 B4: **004 AC-13.4 to be aligned the same way** (via 004's owner phase). | Active | 005, 003, 004 |
| V19-3 | 2026-10-28 | 005 QA B10 (confirmation, no spec change): **"Đang làm" applies as soon as an attempt is started**, even with no answer saved yet (005 AC-17.5, AC-17.6); requiring a saved answer is a code bug to fix in /module 005. | Active | 005 |
| V20-1 | 2026-10-29 | 006 plan (spec gap, decided by the implementing agent): **a T22 save refused because the exam got locked meanwhile (AC-4.3) is refused as a whole** — name and instructions changes in the same save are not stored either; the editor keeps everything the GV typed, so saving again stores the allowed fields. Name rule message: "Tên bài thi bắt buộc, tối đa 150 ký tự" (AC-2.3). | Active | 006 |
| V20-2 | 2026-10-29 | 006 plan: **auto-submit and "Không làm bài" are settled on every exam read/write and by the `exams.settle` job** (JobScheduler port); a submission recorded at or after the attempt's end time is "Nộp tự động" at that end time. Until a production scheduler adapter exists (ADR pending) results are exact for every reader, but no background process runs without a request. | Active | 006, 008 |

Open questions still waiting for the stakeholder: see `specs/index.html` §7 or each spec's §11.

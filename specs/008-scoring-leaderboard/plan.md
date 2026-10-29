---
feature: 008
mode: lean
created: 2026-10-29
---

# Plan — 008 Scoring and Leaderboard (lean)

**Where it lives.** Shared contracts `packages/shared/src/scoring.ts` (+ `scoring.test.ts`, foundation: rounding, ranking order,
response schemas, messages). API `apps/api/src/modules/scoring/` (read side only — scores are **derived on every read**, never
stored per item). Web `apps/web/src/features/scoring/` (S09 page, T04 "Xếp hạng" tab, "Cách tính điểm").

**Inputs (read through the owners' exported providers, no foreign models).** Class doc (`deadlines`, `hidden`) + members of 003
(`CLASS_MODEL`, `MEMBER_MODEL`, exported); Bài/sets in order via `CurriculumReader` (002); exercise submissions via `CLASS_LEARNING.records`
(005, + new optional `submission.regradedAt` = last regrade); exams via new `ExamResultsService.scoringData(ws, classId)` (006: settles first,
returns the class's scheduled/archived exams with name, opens/closes, phase, and the submitted attempts with score/maxScore/submittedAt and
the "Không làm bài" rows 006 records at close for activated members — AC-2.8, AC-2.9, AC-5.6, AC-5.7 for exams come from 006's own record);
account status + `activatedAt` via new `StudentDirectory.activation(ws, ids)` (001).

**Schema changes.** 003 `class_members`: `addedAt: Date` (clock time of the current addition) and `history: [{ from, to }]` (closed
membership periods, pushed on removal) — written by `members.service.ts` / class creation; legacy rows fall back to `joinedAt` (VN day).
New collection `rank_scores` (workspace): `classId`, `studentId`, `score`, `avgEx`, `avgExam`, `achievedAt` — only the "thời điểm đạt
Điểm xếp hạng hiện tại" (AC-6.6) and the before-value of the change log (NFR-8); unique `{classId, studentId}`.

**Engine (`scoring.engine.ts`, pure).** Per activated current member (§7: status ∉ {pending, failed}):
- Set rows (every exercise item of every Bài, curriculum order): submitted in this class & max > 0 → counted, % = round-half-up(score/max×100),
  "Nộp muộn" when after 23:59 VN of the deadline (REQ-1, AC-2.1–2.6, AC-1.4); else visible (published Bài/item, section not hidden) with a
  deadline whose instant passed inside a membership period and after `activatedAt` → "Quá hạn" 0 (AC-1.8, AC-2.5, AC-4.8, AC-5.2, AC-5.6,
  AC-5.7); visible with deadline otherwise → "Chưa làm" not counted; no deadline + no submission → not listed (AC-1.11); hidden / archived /
  unpublished: only submitted ones count (AC-4.1–4.7) → HV sees them only in "Nội dung đã ẩn: k · S" (AC-11.3), GV sees them labelled.
- Exam rows (scheduled + archived exams assigned to the class, opens order): 006 submission → counted (AC-1.12: same attempt in every
  assigned class); 006 "Không làm bài" and not archived → 0; scheduled & not closed → "Chưa thi"; closed without either → not listed for HV
  (AC-11.8); archived → submitted ones only, "Bài thi đã gỡ" line (AC-4.9, AC-11.10).
- TB = round1(mean) or 0; score = round1(0.3×TBex + 0.7×TBexam) (AC-1.5–1.10); ranks: score > 0 competition ranking, ties by achievedAt,
  given name (last word, vi collation), full name, e-mail; 0,0 = "—" after the ranked (REQ-6).
- `achievedAt`: compared with `rank_scores` on each read; on change = latest input event ≤ now (submission, regrade, deadline / close
  instant, `hidden[].at`, `deadlines[].at`) if newer than the stored one, else now; the change is logged `score.change` (NFR-8).

**Endpoints.** HV: `GET /api/learn/ranking/classes` (S09 picker, AC-8.1 order), `GET /api/learn/ranking/:classId` → class + status,
`N`, top 10 (`id, name, rank, score, me`), my position, my breakdown, `loadedAt` (REQ-7, 8, 9, 11, 13); not a member / malformed → 404
"Không tìm thấy lớp." (AC-9.2). GV: `GET /api/classes/:classId/ranking` (all rows with TBs, `achievedAt`, locked), `GET
/api/classes/:classId/ranking/:studentId` (breakdown, AC-10.2); foreign class → 404 (AC-9.4). No other student's breakdown is ever
served to an HV (AC-9.3, NFR-7).

**Web.** `features/scoring/`: `ranking-store.ts` (Zustand, status idle|loading|ok|error), `RankingPage.tsx` (S09: picker, segments "Xếp
hạng" / "Điểm của tôi", podium + rows, pinned "Vị trí của tôi", "Cập nhật lúc …" + "Làm mới", info sheet), `MyScore.tsx`,
`RankingTab.tsx` (T04 table, search, expandable `ScoreBreakdown.tsx`), `RankInfo.tsx`, `scoring.css`. `app/screen-pages.ts` S09 →
RankingPage; `ClassPage.tsx` tab "Xếp hạng" → RankingTab, A05 titled "Không tìm thấy lớp." on that tab; S02 link carries `?lop=`
(AC-8.3); last viewed class in `localStorage` (AC-8.2). S06 / S08 / S10 / S12 / T15 linked by their existing paths.

**REQ map.** REQ-1, REQ-2, REQ-3, REQ-4, REQ-5 → engine + data inputs (T002, T003); REQ-6 → engine ranking (T003); REQ-7, REQ-8,
REQ-9, REQ-11, REQ-13 → HV endpoints + S09 (T004–T006); REQ-10 → GV endpoints + T04 tab (T007). (REQ-12 was dropped in the spec.)

**New dependencies.** None.

## Complexity Tracking

| Choice | Why | Simpler alternative rejected |
|--------|-----|------------------------------|
| Derive on read + tiny `rank_scores` snapshot | Always exact (NFR-3), fresh (NFR-1), no event plumbing into 005/006 | Event-sourced score table: many hooks, drift risk |
| Change log and `achievedAt` detected at the next read of the class | No job runner exists yet (ADR-0008 dev scheduler) | A sweep job: no production scheduler |

Known limit: a change that is reverted before anyone opens S09 / T04 is not logged (NFR-8), and its time is the read time when the
cause has no timestamp (section shown again, deadline removed). Membership history exists only from this change on (legacy: `joinedAt`).

## Constitution Check

- I Spec: every behaviour maps to an AC of the approved spec.md; no requirement changed.
- II Verified: module → test-cases.md + QA (/test-module 008); foundation `scoring.ts` gets Vitest tests first.
- III Traceability: tasks cite every AC; TCs cite AC ids.
- IV Simplicity: read-side derivation, one small collection, no dependency.
- V Security: `@Roles`, `scoped()`, path ids → 404, HV payload limited to top-10 names/scores + own data (NFR-7).
- VI Observability: `score.change` structured log without names/e-mails (NFR-8).
- VII Small changes: one task per REQ group; 003/005/006/001 changes are additive.
- VIII Toolchain: only `node .sdd/scripts/sdd.mjs run …`.

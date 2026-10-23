# Roadmap & Hand-off — how SAT is built module by module

Read this before starting or resuming work. **Live state is never stored here** — it comes from
`node .sdd/scripts/sdd.mjs status` (feature status + task progress), each feature's `tasks.md`,
`progress.md` and git history. This file holds the plan, the order and the rules for resuming.

## 1. Build order

The MVP is built one module (feature) at a time, in dependency order. A wave starts when the
previous wave is `verified`. Modules in the same wave may run in parallel (separate branches/worktrees).

| Wave | Module(s) | Depends on | Notes |
|------|-----------|------------|-------|
| 0 | Foundation ADRs (no feature) | — | See §2. Decide while planning the first module that needs each one. |
| 1 | **001** Tài khoản & Xác thực | — | Needs the email ADR (activation, reset). |
| 2 | **002** Giáo trình & Bài | 001 | T05, T06, T18 shell, T21. |
| 3 | **003** Lớp học — core | 001, 002 | Classes, members, hide/show, S01/S02/S11. Deadline + reminder REQs (REQ-21…26) need sets from 005 → tasks for them wait for wave 4 (mark `blocked` with a note). |
| 4 | **004** Bài học & Flashcard ∥ **005** Bài tập | 002, 003 | T07 editor (one screen, two tabs, both modules). Agree the shared shell first (002 AC-7.11…7.14). Needs the file-storage ADR (004). |
| 4b | **003** deadlines + reminders | 005 | Unblock the 003 tasks; needs the scheduled-job ADR. |
| 5 | **006** Bài thi ∥ **008** Điểm & Xếp hạng ∥ **010** Tạo bài bằng AI | 001, 003, 005 (006); 005, 006 (008); 002, 004, 005 (010) | 010 needs the AI-provider ADR and the external-data decision (010 Q-3). |
| 6 | **009** Dashboard giáo viên | 003, 005, 008, 010 | |
| 7 | **011** Hồ sơ học viên | 001, 003, 008, 009 | Needs the file-storage ADR (images). |
| 8 | **016** Kho nội dung tự học (GV) | 001 | GV screens T23–T27 + starter-set copy per workspace (V15); needs the file-storage ADR (audio). **Launch prerequisite:** licensed or self-authored HSK 1–9 content (vocabulary + audio, stroke data, listening, role-play, mock tests) — every item carries "Nguồn / giấy phép" (V14-5); it becomes the starter set copied into each workspace (V15). |
| 9 | **012** Từ vựng ∥ **013** Luyện viết ∥ **014** Nghe & nói ∥ **015** Thi thử HSK | 001, 016 | Class-independent Tự học for HV only (V14, V15); 012 owns the S13 hub, build it first or stub it. |
| — | 007 Chấm tự luận | — | **Deferred. Never plan or implement.** |

Before any wave: the module's open questions are answered → `/sdd-clarify NNN` → a human runs
`node .sdd/scripts/sdd.mjs approve NNN --by "<name>"`.

## 2. Foundation decisions (ADRs in `docs/adr/`, owned by the architect)

| ADR | Decision needed | First needed by |
|-----|-----------------|-----------------|
| 0003 | Hosting / deploy target (currently undecided; `deploy:*` toolchain commands are null) | before first `/sdd-ship` |
| next free | Transactional email provider (activation, password reset, deadline reminders) | 001 |
| next free | File / object storage for uploads (video ≤ 500 MB, documents, images, avatars) | 004 |
| next free | Scheduled jobs (08:00 reminders, retention clean-ups) | 003 wave 4b |
| next free | AI provider and data handling for lesson generation (with 010 Q-1…Q-3 answers) | 010 |

New dependencies need a line in the feature's `plan.md` (constitution IV).

## 3. Per-module loop (one feature)

**Default: lean flow via `/module NNN`** (skill in `.claude/skills/module/`, source `docs/tooling/skills/module/SKILL.md`).
Specs are prepared and clarified by a separate spec agent. `/module` works in **one session, no sub-agents**:

```text
spec agent prepares spec.md (no open questions)   → status clarified
[HUMAN] sdd approve NNN                           → status approved   (only a human, in their own terminal)
/module NNN  → read spec.md → lean plan.md + tasks.md (one task per REQ) + automated analysis.md
             → implement task by task (tests first, fullstack conventions + nestjs/react/typescript skills)
             → test-cases.md (≥ 1 per AC, mapped via sdd trace) → run lint/typecheck/test/e2e → verification.md → verified
/sdd-ship NNN → PR → CI → staging → [HUMAN] production
```

Each stop writes a Handoff and runs `scripts/sync-state.mjs`; re-run `/module NNN` to continue.
Heavier options when a module needs them: `/sdd-verify NNN` (reviewer + security audit), `/sdd-auto --feature NNN`
(full multi-agent pipeline), `node .sdd/scripts/sdd.mjs pipeline --feature NNN` (unattended).

**Module folder** `specs/NNN-slug/`:

| File | What | Written by |
|------|------|------------|
| `spec.md` | Contract: stories, REQ, EARS AC, NFR (what the AI implements) | product-analyst (frozen once approved) |
| `spec.html` | Human view of spec.md with flows | product-analyst (mirror; `scripts/check-spec-html.mjs`) |
| `plan.md`, `data-model.md`, `contracts/`, `research.md` | How it is built | architect |
| `tasks.md` | Ordered test-first tasks with state | task-planner; state via `sdd task` |
| `analysis.md`, `verification.md`, `traceability.md` | Gate evidence | reviewer, /sdd-verify, `sdd trace --write` |
| `progress.md` | Append-only log + Handoff blocks | implementer / test-engineer / orchestrator |
| `test-cases.md` | Test cases per AC with Pass/Fail of the last run | test-engineer (template `specs/assets/test-cases-template.md`) |
| `state.json` | **Generated** module state for agents and the dashboard | `node scripts/sync-state.mjs` only |

**Definition of done for a module:** status `verified`; `sdd trace NNN` shows zero gaps; `sdd ci --e2e`
green; `test-cases.md` has every AC covered and no Fail; the module's screens behave like
`specs/screen-flow-design.html`; progress.md has a final Handoff; `state.json`/dashboard synced.

## 4. Where state lives (single source for each fact)

| Question | Source | Written by |
|----------|--------|------------|
| Which modules exist, their status, task counts, next task | `sdd status`, `sdd next-task NNN` | CLI only (`set-status`, `task`, `approve`) |
| What exactly must be built | `specs/NNN/spec.md` (+ plan.md, data-model.md, contracts/) | product-analyst / architect |
| Task list and per-task state | `specs/NNN/tasks.md` | task-planner; state via `sdd task T### …` |
| What happened, why, what's next | `specs/NNN/progress.md` (append-only) | implementer / test-engineer / orchestrator |
| Evidence of done | `specs/NNN/verification.md`, `traceability.md` | /sdd-verify |
| Code history | git: branch `feat/NNN-slug`, one commit per task (`feat(NNN): T012 …`) | implementer |
| Snapshot of all of the above per module | `specs/NNN/state.json` (generated) | `node scripts/sync-state.mjs` |
| Project dashboard for humans | `specs/dashboard.html` (generated) | `node scripts/sync-state.mjs` |
| Test cases and last results | `specs/NNN/test-cases.md` | test-engineer |
| Product rules and decisions | `docs/steering/product.md`, `docs/steering/decisions.md` | product-analyst / orchestrator |

Personal Claude memory (`~/.claude/...`) is per machine and per user — never the place for project facts.

## 5. Hand-off protocol (every session that touches a feature)

**When stopping** (end of session, context running out, blocked), append to `specs/NNN/progress.md`:

```markdown
## Handoff YYYY-MM-DD HH:mm — <agent/role>
- Status: <sdd status line for NNN>   Branch: feat/NNN-slug @ <short sha>
- Done this session: T010, T011 (commits …)
- In progress: T012 — <what is half-done, which test is red and why>
- Next: <exact next action, e.g. "make test 003:AC-8.2 pass in classes.service.ts">
- Blockers / questions: <none | what and who must answer>
- Verify with: node .sdd/scripts/sdd.mjs run test -- <path>
```

Leave the tree committed, then run `node scripts/sync-state.mjs NNN`. Never leave a task in `doing`
without a Handoff that explains it.

**When resuming:** type `/module NNN`. It does, in order: sync state → read `state.json`, spec, plan, tasks,
last Handoff, test cases → re-run the Handoff's "Verify with" tests → continue at the phase `state.json` names.
Manual equivalent: `sdd status`, `sdd next-task NNN`, last Handoff, `git log --oneline -10`, then `/sdd-auto --feature NNN`.

## 6. Parallel work

- One feature per branch/worktree (`git worktree add ../sat-NNN -b feat/NNN-slug`); never two agents on the same feature.
- Shared code (T07 shell, api-client, auth middleware) is owned by the earliest module that needs it;
  later modules extend it through their own tasks, never by editing another feature's spec.
- If implementation shows a spec is wrong: `sdd set-status NNN draft --reason "…"`, stop, and get it
  re-approved (constitution I). Record the decision in `decisions.md`.

## 7. Next milestone (update only when a wave finishes)

As of 2026-10-22: specs 001–005 and 008–011 are `draft` with open questions (`specs/index.html` §7).
Next: answer them → `/sdd-clarify 001` → human approval → wave 1. Per-task progress: `sdd status`, not this file.

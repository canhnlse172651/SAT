---
name: feature
description: Turn a functional need written in plain Vietnamese into spec changes - finds which SAT module(s) the need belongs to (e.g. anything about giáo trình goes to 002) and updates their spec.md + spec.html, or creates a new module when no existing module covers it; then records the decision, re-checks consistency and refreshes the dashboard. Use when the user types /feature <mô tả nhu cầu>.
argument-hint: "<mô tả nhu cầu chức năng>"
disable-model-invocation: true
---

# /feature — from a need to updated module specs

Input: `$ARGUMENTS` — the stakeholder's description of a functional need (Vietnamese, free text).
If it is empty, ask for it and stop. You act as the **product-analyst**: you write WHAT and WHY, never HOW.
Save tokens: work from the indexes below; open a module's spec.md only when it is a candidate.

## 1. Load the index (cheap)

- `specs/modules.json` — every module: name, summary, screens, wave, deps, mvp.
- Requirement index: `grep -n "^### REQ-" specs/*/spec.md` (titles only).
- `docs/steering/decisions.md` — Active rows only; `docs/steering/product.md` is already in context.
- Screen IDs: the inventory in product.md + `screens` in modules.json; UI reference `specs/screen-flow-design.html#<ID>`.

## 2. Route the need

Split the input into **change items** (one behaviour each). For each item decide:

| Case | Rule | Target |
|------|------|--------|
| Extends an existing module | Same domain / actor / screens as a module's summary, or touches its REQs (e.g. giáo trình, bài → 002; lớp, hạn nộp → 003; bài học, flashcard → 004; bài tập, câu hỏi → 005; điểm, xếp hạng → 008; dashboard GV → 009; tạo bằng AI → 010; hồ sơ HV → 011; tài khoản, đăng nhập, email → 001) | that module: add or change REQ/AC |
| Spans modules | Behaviour owned by one module, visible in others | owner module gets the REQ; others get only the reference ACs they need |
| Contradicts an Active decision | Conflicts with a row in decisions.md | ask the user before changing it (the new answer supersedes the old row) |
| Deferred module (006, 007) | Need revives exams / manual grading | ask the user whether to bring the module back into MVP |
| New | No module's scope covers it (new domain, new actor, new main screen group) | **new module** (step 4) |

Then read only the candidate modules' `spec.md` (their stories, REQ list, related ACs) to confirm and to find exact insertion points.

## 3. Confirm the plan with the user (one message)

Show a short table — change item → target module (or "module mới NNN"), new/changed REQ titles, affected screens, status impact
(modules already `approved` or later will go back to `draft` and need re-approval) — plus at most 3 questions for real
ambiguities (AskUserQuestion, each with a recommended option). Apply only after the user agrees (headless: apply the
recommended options and log them as assumptions).

## 4. Apply

**Existing module (per target):**
1. If status ≥ approved: `node .sdd/scripts/sdd.mjs set-status <NNN> draft --reason "<need, short>"`.
2. Edit `specs/<NNN>-*/spec.md` with Write/Edit (bash writes to spec.md are blocked):
   - new behaviour → new `### REQ-<next>` (append; never renumber existing REQ/AC — other modules cite them) with EARS
     `- AC-n.m:` lines; changed behaviour → edit the AC in place; add/adjust the user story, NFRs, edge cases, out-of-scope;
   - quote UI wording exactly as it should appear ("Tên nút", "Thông báo …") — this is what the prototype check compares;
   - log in §12 Clarifications Log under `### Session <YYYY-MM-DD> (feature)`: the user's need verbatim (source: stakeholder)
     and your decisions (source: assumption — rationale); mark superseded entries `[thay thế <date>]`.
3. Mirror the same REQ/AC/NFR text verbatim in `spec.html` (§5 rows `<tr id="AC-n.m">…<td class="ears">`), and update its
   flows / business rules / screens table where the change shows up.

**New module:**
1. `node .sdd/scripts/sdd.mjs new "<English title, ≤ 6 words>" --slug <short-slug>` (add `--no-branch` if git is not initialised).
2. Write `spec.md` from `.sdd/templates/spec-template.md` (stories, REQ, EARS AC, measurable NFR, out of scope, open questions)
   and `spec.html` from `specs/assets/spec-template.html` (mirrored REQ/AC + flows with Mermaid, rules, screens).
3. Add the module to `specs/modules.json`: id, name (vi), wave (after its dependencies), deps, mvp, summary, screens.
   New screens take the next free ID (T22, S13, A06…) and are listed there.
4. If it changes the product picture, add a line to the Scope table of `docs/steering/product.md`.

**Always:** add a row to `docs/steering/decisions.md` (ID `F-<YYYYMMDD>-<n>`, date, decision, Active, modules).

## 5. Check and report

1. `node .sdd/scripts/sdd.mjs check <NNN>` for every touched module — 0 errors.
2. `node scripts/check-spec-html.mjs <NNN …>` — spec.html mirrors spec.md.
3. `node scripts/check-spec-prototype.mjs <NNN …>` — list the new labels/screens the prototype does not have yet
   (prototype changes are a separate step: say which screens need updating; do not edit screen-flow-design.html here).
4. `node scripts/sync-state.mjs` — the dashboard shows the new/updated modules and their status.
5. Report in ≤ 10 lines: per module the REQ/AC ids added or changed (or the new module id), status changes that need
   `approve`, open questions, prototype screens to update, next step (`approve` → `/module <NNN>`).

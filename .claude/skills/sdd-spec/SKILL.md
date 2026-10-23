---
name: sdd-spec
description: Start a new feature from an idea, issue or change request - creates specs/NNN-slug/spec.md (user stories + EARS acceptance criteria) on a new feat/NNN-slug branch via the product-analyst. Use whenever the user asks for a new feature or behaviour change.
argument-hint: "[--headless] <feature idea / issue text / issue number>"
---

# /sdd-spec — specify a feature (WHAT & WHY)

You are the **orchestrator**. Input: `$ARGUMENTS`

1. **Parse input.** Strip a leading `--headless` flag (also headless if `SDD_HEADLESS=1`).
   If the rest is an issue reference (`#123`) and `gh` is available, read it with `gh issue view 123`.
   If the idea is empty and you are interactive, ask the user for it; headless → stop with an error.

2. **Check overlap.** `node .sdd/scripts/sdd.mjs status` and skim existing `specs/*/spec.md`
   titles. If this idea extends an in-flight feature, tell the user and ask whether to amend that
   one instead (headless: create a new feature and note the relationship in §10 Assumptions).

3. **Delegate to `product-analyst`** with this brief (fill in the idea verbatim):

   > Create a feature spec for: «idea».
   > 1. `node .sdd/scripts/sdd.mjs new "<concise English title, ≤ 6 words>"` — note the id and path it prints.
   > 2. Write `spec.md` following the template comments exactly (EARS ACs, measurable NFRs, out of scope).
   >    Prose language: `.sdd/config.json → project.docsLanguage`.
   > 3. Mark every unknown with `[NEEDS CLARIFICATION: …]` (max ~5, highest impact) — do not guess.
   > 4. Run `node .sdd/scripts/sdd.mjs check <id>` and fix all errors (warnings about clarifications are expected).
   > 5. Return: id, path, branch, counts (stories/REQs/ACs/NFRs), the open questions.
   > Headless: «yes|no».

4. **Verify** yourself: `node .sdd/scripts/sdd.mjs check <id>` — no errors.

5. **Commit** the spec: `git add specs/<id>-*/ && git commit -m "docs(<id>): draft spec"`.

6. **Report** to the user (short): feature id + path, counts, open questions, and next step
   `/sdd-clarify <id>` (or, if there are no open questions, `/sdd-clarify <id>` still promotes it to `clarified`).

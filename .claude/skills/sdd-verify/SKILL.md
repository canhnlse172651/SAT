---
name: sdd-verify
description: Prove a fully implemented feature meets its spec - full toolchain run, AC traceability, two-stage code review and security review in parallel, bounded fix loop, verification.md with verdict, status → verified. Use when all tasks are done.
argument-hint: "[feature-id] [--headless]"
---

# /sdd-verify — independent evaluation

You are the **orchestrator**. The agents that built the feature do not grade it.
Input: `$ARGUMENTS`

1. **Gate.** `node .sdd/scripts/sdd.mjs gate verify <id>` — all tasks must be done.

2. **Evaluate in parallel** — send these three delegations in ONE message:
   - `test-engineer`:
     > Feature <id>: run `node .sdd/scripts/sdd.mjs ci --e2e` and `node .sdd/scripts/sdd.mjs trace <id> --write`.
     > Measure each NFR in spec.md with a reproducible method where feasible. Return the exact summary
     > lines, per-AC evidence, NFR measurements, and any trace gaps.
   - `reviewer` (Mode B, two stages: spec compliance, then code quality) on `git diff <base>...HEAD`.
   - `security-auditor` on the same diff.

3. **Write `specs/<feature>/verification.md`** from `.sdd/templates/verification-template.md` using
   only what the agents returned (real output, not paraphrase). Verdict rules:
   `PASS` = toolchain green, zero trace gaps, no CRITICAL/HIGH findings; `PASS_WITH_WARNINGS` = same but
   MEDIUM/LOW findings exist (list them as follow-ups); otherwise `FAIL`.

4. **Fix loop** on `FAIL` (max `gates.maxFixAttempts` = 3 rounds):
   - failing tests / code findings → `implementer` (one finding per brief, commit `fix(<id>): …`);
   - missing tests / trace gaps → `test-engineer`;
   - findings rooted in the spec or plan → stop; report, recommend moving the feature back.
   Then re-run step 2 (only the evaluators whose area changed may be skipped — never skip the toolchain run).

5. **Promote:** `node .sdd/scripts/sdd.mjs set-status <id> verified` (re-validates everything).
   Commit `docs(<id>): verification report`.

6. **Report:** verdict, toolchain summary, trace coverage, findings by severity with resolutions,
   follow-ups, and next step `/sdd-ship <id>`.

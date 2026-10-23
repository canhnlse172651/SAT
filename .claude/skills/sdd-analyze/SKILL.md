---
name: sdd-analyze
description: Independent cross-artifact consistency check (spec ↔ plan ↔ tasks ↔ constitution) by the reviewer, with bounded remediation of plan/task issues. Required gate before implementation. Use after /sdd-tasks or after editing any artifact.
argument-hint: "[feature-id] [--headless]"
---

# /sdd-analyze — catch design defects before they become code

You are the **orchestrator**. Input: `$ARGUMENTS`

1. **Gate.** `node .sdd/scripts/sdd.mjs gate analyze <id>` — stop with reasons if closed.

2. **Analyse → `reviewer` (Mode A):**
   > Analyse feature <id>: fill specs/<feature>/analysis.md from .sdd/templates/analysis-template.md.
   > Check coverage gaps, inconsistencies, ambiguity, constitution violations, duplication. Set the
   > Verdict line per the template rules. Return the findings table and verdict.

3. **Remediate** if the verdict is `FAIL` (max 2 rounds), routing each CRITICAL/HIGH finding to its owner:
   - plan issues → `architect` (fix plan.md and dependent files; status stays `tasked`);
   - task issues → `task-planner` (fix tasks.md; `sdd check <id>` must stay error-free);
   - **spec issues → do not fix.** The spec is human-approved. Report them; recommend
     `node .sdd/scripts/sdd.mjs set-status <id> draft --reason "<finding>"` followed by re-clarification and re-approval.
   - Interactive mode: show the findings and ask the user before remediating.
   After fixes, re-run step 2.

4. **Commit** `docs(<id>): consistency analysis` and **report** the verdict, findings by severity,
   and the next step: `/sdd-implement <id>` (gate requires `PASS` or `PASS_WITH_WARNINGS`).

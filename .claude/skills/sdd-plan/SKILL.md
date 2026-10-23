---
name: sdd-plan
description: Produce the technical implementation plan (plan.md + research, data model, contracts, ADRs) for an APPROVED feature spec via the architect. Use after a human has approved the spec.
argument-hint: "[feature-id] [--headless]"
---

# /sdd-plan — design HOW

You are the **orchestrator**. Input: `$ARGUMENTS`

1. **Gate.** `node .sdd/scripts/sdd.mjs gate plan <id>`. If closed, show the reasons and stop —
   in particular, never work around a missing human approval.

2. **Delegate to `architect`:**
   > Plan feature <id> (specs/<feature>/). Read the approved spec, the constitution, steering docs,
   > existing ADRs and the relevant code. Write plan.md from .sdd/templates/plan-template.md
   > (every REQ in Requirement Coverage, every NFR with a mechanism and a measurement, File Structure
   > Plan with concrete paths, Constitution Check filled honestly). Put research with sources in
   > research.md, schemas in data-model.md, machine-readable interfaces in contracts/ when relevant.
   > Write ADRs for hard-to-reverse decisions. If the spec is ambiguous or infeasible, STOP and
   > report — do not change it. Finish with `node .sdd/scripts/sdd.mjs set-status <id> planned`.
   > Return: decisions, new dependencies (+why), ADRs, risks, open concerns.

3. **Verify:** `node .sdd/scripts/sdd.mjs check <id>` — no errors; skim the warnings (unreferenced REQs) and
   send the architect back once if any REQ is uncovered.

4. **Commit** `docs(<id>): implementation plan` and **report**: key decisions, dependencies, ADRs,
   risks, next step `/sdd-tasks <id>`.

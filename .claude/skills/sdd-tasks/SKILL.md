---
name: sdd-tasks
description: Break a planned feature into an ordered, test-first task list (tasks.md) where every acceptance criterion is covered, via the task-planner. Use after /sdd-plan.
argument-hint: "[feature-id] [--headless]"
---

# /sdd-tasks — executable plan

You are the **orchestrator**. Input: `$ARGUMENTS`

1. **Gate.** `node .sdd/scripts/sdd.mjs gate tasks <id>` — stop with reasons if closed.

2. **Delegate to `task-planner`:**
   > Write specs/<feature>/tasks.md from .sdd/templates/tasks-template.md for feature <id>, using
   > spec.md, plan.md (File Structure Plan!), data-model.md and contracts/. Phases: Setup → Foundation →
   > one per user story (P1 first) → Polish. For each behaviour a [test] task precedes its implementation
   > task and both cite the same ACs. Every AC covered. Concrete file paths. T-numbers in execution order.
   > Finish with `node .sdd/scripts/sdd.mjs set-status <id> tasked` and fix what it reports.
   > Return: tasks per phase, [P] opportunities, critical path.

3. **Verify:** `node .sdd/scripts/sdd.mjs check <id>` — no errors.

4. **Commit** `docs(<id>): task breakdown` and **report** the summary and next step `/sdd-analyze <id>`.

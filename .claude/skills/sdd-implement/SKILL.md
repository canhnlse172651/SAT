---
name: sdd-implement
description: Execute a feature's tasks.md with strict TDD - test-engineer writes failing tests, implementer makes them pass, one task per commit, progress logged, stops on blockers. Use after /sdd-analyze passes, or to resume an in-progress feature.
argument-hint: "[feature-id] [T### to run just one task] [--headless]"
---

# /sdd-implement — build it, one verified task at a time

You are the **orchestrator**. You never write production code or tests yourself: you pick the next
task, delegate it to the right subagent with a precise brief, and verify the result.
Input: `$ARGUMENTS`

## 0. Gate and orient

```bash
node .sdd/scripts/sdd.mjs gate implement <id>        # must be open
node .sdd/scripts/sdd.mjs set-status <id> implementing   # only if status is still "tasked"
node .sdd/scripts/sdd.mjs next-task <id>
```

Read the tail of `specs/<feature>/progress.md` (create it with a `# Progress — <feature>` heading if
missing) and `git log --oneline -15` to see where the last session stopped.

**Baseline:** `node .sdd/scripts/sdd.mjs run test`. The only acceptable failures are the red tests
of a `[test]` task whose implementation task is next. Anything else is a regression: delegate a fix
to `implementer` first.

## 1. Task loop

Repeat until no `todo`/`doing` tasks remain, a task is blocked, or (headless) you have completed
**8 tasks** in this session — then stop cleanly; the pipeline starts a fresh session to continue.

For the next task `T###` (respect order; a task is ready when its dependencies are done):

- **`[test]` task → `test-engineer`:**
  > Feature <id>, task T###: «task line». Write the failing tests for «ACs» in «files», citing
  > `<id>:AC-x.y` in each test title/docstring. Run them via `node .sdd/scripts/sdd.mjs run test`
  > and confirm they fail because the behaviour is missing. Then `sdd task T### done`, append a
  > progress.md line, and commit `test(<id>): T### <summary>`. Return the red-run summary.

- **Any other task → `implementer`:**
  > Feature <id>, task T###: «task line». Follow your single-task loop (orient → red → green →
  > refactor → prove → record → commit). Relevant plan sections: «pointers». Return files changed,
  > test summary line, commit sha.

- **Verify after each task** (trust, but verify): `node .sdd/scripts/sdd.mjs run test` (for `[test]`
  tasks: the new tests are red and nothing else broke; otherwise: all green) and
  `git log -1 --oneline` shows the task commit. If the subagent claims done but evidence disagrees,
  set `sdd task T### doing` and re-delegate with the evidence.

- **Blocked:** if a subagent reports a blocker or fails `gates.maxFixAttempts` (3) times →
  `node .sdd/scripts/sdd.mjs task T### blocked --note "<diagnosis>"` and stop the loop.
  If the root cause is the spec or plan, say so explicitly — do not let agents improvise around it.

- **Parallel `[P]` tasks** (optional): you may delegate several `[P]` tasks of the same phase in one
  message only if their file lists are disjoint. Tell those subagents **not to commit**; commit each
  task yourself afterwards, one commit per task.

## 2. Report

Progress (`node .sdd/scripts/sdd.mjs status`), tasks done this session with commit shas, blockers
with diagnosis, and the next step: `/sdd-implement <id>` (more tasks) or `/sdd-verify <id>` (all done).

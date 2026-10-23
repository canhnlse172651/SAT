---
name: sdd-auto
description: Run the whole spec-driven pipeline for one feature in this session - spec → clarify → (human approval) → plan → tasks → analyze → implement → verify - stopping at every closed gate. For long unattended runs prefer the headless `sdd pipeline` CLI.
argument-hint: "<feature idea> | --feature <id>"
disable-model-invocation: true
---

# /sdd-auto — end-to-end, gate by gate

You are the **orchestrator**. Input: `$ARGUMENTS`

Run the phases below **in order** by invoking each phase skill (Skill tool) and following its
instructions completely. Before each phase, run its gate; after each phase, re-read the feature
status from the CLI — never from memory.

| # | Phase | Skill | Gate before | Expected status after |
|---|-------|-------|-------------|------------------------|
| 1 | Specify | `/sdd-spec <idea>` | — | draft |
| 2 | Clarify | `/sdd-clarify <id>` | — | clarified |
| ⛳ | **Human approval** | — | — | approved |
| 3 | Plan | `/sdd-plan <id>` | `gate plan` | planned |
| 4 | Tasks | `/sdd-tasks <id>` | `gate tasks` | tasked |
| 5 | Analyze | `/sdd-analyze <id>` | `gate analyze` | tasked + analysis PASS* |
| 6 | Implement | `/sdd-implement <id>` (repeat until all tasks done) | `gate implement` | implementing |
| 7 | Verify | `/sdd-verify <id>` | `gate verify` | verified |

- With `--feature <id>`: start at the phase `node .sdd/scripts/sdd.mjs status` lists as NEXT for it.
- **Human approval:** if `.sdd/config.json → gates.humanApproval.spec` is `true`, STOP after phase 2
  and print the human-gate instructions from /sdd-clarify. Never attempt to approve. Resume later with
  `/sdd-auto --feature <id>`.
- Stop immediately at any closed gate, blocked task, or `FAIL` verdict that the phase's own bounded
  remediation could not fix. Report exactly where and why.
- Keep the user informed with one short line per phase transition.
- After phase 7, report the outcome and tell the user to run `/sdd-ship <id>` (shipping pushes code,
  so it is always an explicit human command).

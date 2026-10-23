---
status: accepted
date: 2026-10-15
deciders: project leads
---

# ADR-0001: Adopt agent-driven, spec-driven development

## Context and Problem Statement

The software in this repository is to be produced by Claude agents end to end (specification →
implementation → test → deployment). Unstructured "vibe coding" with agents produces code that
drifts from intent, is hard to review, and silently weakens tests. We need a process in which agent
output is predictable, reviewable and verifiable, with humans in control of the decisions that matter.

## Decision Drivers

- Intent must be explicit and reviewable before code exists.
- Every claim of "done" must be backed by machine-checked evidence.
- Agents must not be able to bypass human decisions (spec approval, production deploy).
- The process must not depend on a particular language or framework.
- Work must survive context limits and session restarts.

## Considered Options

1. Ad-hoc prompting per task.
2. Adopt an existing framework verbatim (github/spec-kit, BMAD-METHOD, cc-sdd/Kiro, OpenSpec).
3. A thin, project-owned harness combining the strongest ideas of those frameworks.

## Decision Outcome

Chosen option 3: a project-owned harness (`.sdd/`, `.claude/`), because it lets us enforce gates
deterministically (CLI + hooks + CI) rather than by prompt alone, stays stack-agnostic, and keeps
every rule in this repository where it can be reviewed and versioned.

Borrowed ideas:

| Source | Idea adopted |
|--------|--------------|
| github/spec-kit | constitution, spec → plan → tasks → analyze → implement, `[NEEDS CLARIFICATION]`, Constitution Check + Complexity Tracking, `[P]` parallel tasks, numbered feature folders |
| AWS Kiro / gotalab/cc-sdd | EARS acceptance criteria, steering docs (product/tech/structure), requirement traceability in tasks |
| BMAD-METHOD | role-specialised agents with artifact ownership, QA verdict gate |
| obra/superpowers | strict TDD (red before green), two-stage review: spec compliance then code quality |
| Anthropic engineering ("effective harnesses", "harness design") | file-based hand-offs, append-only progress log, one task per session step, skeptical separate evaluator, clean tree at session end |
| anthropics/claude-code-action | @claude, automated PR review, issue → spec PR → build automation |

### Consequences

- Good: reviewable intent, traceability REQ → AC → task → test, deterministic gates, auditable approvals.
- Good: the same commands run locally, in agents and in CI (toolchain contract).
- Bad: more ceremony than ad-hoc prompting for tiny changes. Mitigation: a small change can be a feature with one REQ.
- Follow-up: revisit the harness as models improve — remove scaffolding that no longer earns its keep.

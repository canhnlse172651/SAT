---
feature: {{FEATURE_ID}}
plan: ./plan.md
created: {{DATE}}
---

# Tasks — {{FEATURE_TITLE}}

<!--
Line format (machine-parsed by sdd):
  - [ ] T### [tags] <imperative description> (AC-x.y, AC-x.z) — files: `path/a`, `path/b`

State:  [ ] todo · [~] in progress · [x] done · [!] blocked
        Change state with: node .sdd/scripts/sdd.mjs task T### <todo|doing|done|blocked> [--note "..."]
Tags:   [test]  write the failing tests for the listed ACs (TDD red) — must precede the impl task
        [P]     parallel-safe: touches no file that another open [P] task in the same phase touches
        [infra] setup / tooling with no AC   ·   [docs] documentation only

Rules:
- Every AC in spec.md appears in ≥1 [test] task AND ≥1 implementation task (sdd check enforces coverage).
- Test titles/docstrings cite "<feature-id>:AC-x.y" (e.g. "{{FEATURE_ID}}:AC-1.2") — that is what sdd trace scans for.
- One task = one commit: ≤ ~5 files, one concern, leaves the build green.
- Order = dependency order. Phase per user story, so every phase is a shippable increment.
-->

## Phase 1: Setup

- [ ] T001 [infra] <project/tooling setup needed by this feature> — files: ``

## Phase 2: Foundation

<!-- Blocking prerequisites shared by several stories: schema, config, shared types. -->

## Phase 3: US-1 — <story title> (P1, MVP)

<!--
- [ ] T010 [test] Write failing tests for AC-1.1, AC-1.2 — files: `tests/...`
- [ ] T011 Implement <behaviour> (AC-1.1, AC-1.2) — files: `src/...`
-->

## Phase 4: Polish & Cross-cutting

<!-- e2e happy path, docs, runbook updates, performance checks for NFRs. -->

## Dependencies

<!-- Explicit edges that are not implied by phase order, e.g. "T011 → T014". -->

---
feature: {{FEATURE_ID}}
spec: ./spec.md
created: {{DATE}}
---

# Implementation Plan — {{FEATURE_TITLE}}

<!--
PLAN = HOW. Written by the architect from an APPROVED spec. Never change requirements here;
if the spec is wrong or incomplete, stop and send it back (sdd set-status <id> draft --reason "...").
Reference requirement IDs (REQ-n / AC-n.m / NFR-n) explicitly — sdd check warns on unreferenced REQs.
Long sections may move to sibling files: research.md, data-model.md, contracts/, quickstart.md.
-->

## 1. Summary

<!-- Primary requirement + chosen technical approach, 3–5 sentences. -->

## 2. Technical Context

| Item | Decision |
|------|----------|
| Language / runtime | |
| Frameworks / libraries | |
| Storage | |
| Testing (unit / integration / e2e) | |
| Target platform / deployment | |
| Performance goals | (from NFR-…) |
| Constraints | |

## 3. Constitution Check

<!-- GATE. Evaluate every article of docs/constitution.md. A ❌ needs a row in §14 or the plan is rejected. -->

| Article | Status | Notes |
|---------|--------|-------|
| I. Spec is the source of truth | ✅ | |
| II. Test-first | ✅ | |
| III. Traceability | ✅ | |
| IV. Simplicity | ✅ | |
| V. Security by default | ✅ | |
| VI. Observability | ✅ | |
| VII. Small, reversible changes | ✅ | |
| VIII. Single toolchain contract | ✅ | |

## 4. Architecture

<!-- Components and responsibilities, data flow, a mermaid diagram. Reuse existing modules (docs/steering/structure.md). -->

### File Structure Plan

<!-- Every file to create (+) or modify (~), with its responsibility. Tasks will reference these paths. -->

```text
+ src/...            # <responsibility>
~ src/...            # <what changes>
+ tests/...
```

## 5. Data Model

<!-- Entities, fields, constraints, relationships, migrations. Or link ./data-model.md -->

## 6. Interfaces & Contracts

<!-- API endpoints / events / CLI / UI routes, with request/response and error shapes. Machine-readable contracts in ./contracts/ -->

## 7. Requirement Coverage

| REQ | Approach | Components | Test level(s) |
|-----|----------|------------|---------------|
| REQ-1 | | | unit + integration |

## 8. Error Handling & Edge Cases

## 9. Security & Privacy

<!-- AuthN/AuthZ, input validation, secrets handling, PII, relevant OWASP Top 10 risks and mitigations. -->

## 10. Observability & Operations

<!-- Logs, metrics, traces, alerts, feature flags, config, data migration and rollback plan. -->

## 11. Testing Strategy

<!--
Which ACs are proven at which level, test data, what is mocked and why, how e2e runs in CI.
Correctness properties: invariants that must hold for ANY valid input ("for any cart, total = Σ line totals;
validates AC-2.3") — implement them as property-based tests where the stack supports it.
-->

## 12. Deployment & Rollback

<!-- Migrations (expand/contract), feature flags, config/secrets needed per environment, smoke test, rollback steps. -->

## 13. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|

## 14. Complexity Tracking

<!-- Only for Constitution Check deviations. -->

| Deviation | Why needed | Simpler alternative rejected because |
|-----------|------------|--------------------------------------|

## 15. Decisions (ADRs)

<!-- Significant or hard-to-reverse choices get an ADR in docs/adr/. List them here. -->

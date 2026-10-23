---
id: {{FEATURE_ID}}
slug: {{FEATURE_SLUG}}
title: {{FEATURE_TITLE}}
status: draft
branch: {{BRANCH}}
created: {{DATE}}
updated: {{DATE}}
approved_by:
approved_at:
---

# {{FEATURE_TITLE}}

<!--
SPEC = WHAT the system must do and WHY. Never HOW: no frameworks, tables, endpoints, class names.
Audience: product owner, QA, and the agents downstream. Every statement must be testable.

Machine-checked format (sdd check):
- Requirement heading:  ### REQ-<n>: <title>
- Acceptance criterion: - AC-<n>.<m>: <EARS sentence>      (n = parent REQ number)
- Non-functional:       - NFR-<n>: <category>: <measurable target with a number>
- EARS keywords stay in ENGLISH UPPERCASE even when the prose is in another language:
    Ubiquitous  THE SYSTEM SHALL <response>
    Event       WHEN <trigger> THE SYSTEM SHALL <response>
    State       WHILE <state> THE SYSTEM SHALL <response>
    Unwanted    IF <condition> THEN THE SYSTEM SHALL <response>
    Optional    WHERE <feature is included> THE SYSTEM SHALL <response>
- Every unknown → [NEEDS CLARIFICATION: <specific question>]. Never guess silently.
- Frontmatter status changes ONLY through the CLI (sdd set-status / sdd approve).
-->

## 1. Summary

<!-- 2–4 sentences: the problem, who has it, the outcome we want. -->

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
|      |        |        |

## 3. Actors & Context

<!-- Personas/actors, when and why they use this, what they do today instead. -->

## 4. User Stories

<!--
- US-1 (P1): As a <role>, I want <capability>, so that <benefit>.
  - Why this priority: <value / risk reasoning>
  - Independent test: <how this story alone can be demonstrated end-to-end>
P1 = MVP. Each story must be independently testable and shippable on its own.
-->

## 5. Functional Requirements

### REQ-1: <title>

<!-- Story: US-1 · Priority: P1 -->

- AC-1.1: WHEN <trigger> THE SYSTEM SHALL <observable response>

## 6. Non-Functional Requirements

<!-- - NFR-1: Performance: p95 response time ≤ 300 ms at 50 req/s -->

## 7. Key Entities

<!-- Domain objects in business terms (what they represent, key attributes, relationships) — no schemas. -->

## 8. Edge Cases & Error Handling

<!-- Empty/huge inputs, concurrency, permission denied, partial failure, retries, time zones, i18n. -->

## 9. Out of Scope

## 10. Assumptions & Dependencies

## 11. Open Questions

<!-- Mirror every [NEEDS CLARIFICATION] here. Must be empty once status ≥ clarified. -->

## 12. Clarifications Log

<!--
### Session YYYY-MM-DD
- Q: <question> → A: <answer> (source: stakeholder | assumption — <rationale>)
-->

---
version: 1.0.0
ratified: 2026-10-15
last_amended: 2026-10-15
---

# Project Constitution

Non-negotiable engineering principles. Every agent reads this before acting; every plan carries a
**Constitution Check** against it; the reviewer rejects work that violates it. Amendments need a
human-approved PR that bumps `version` (MAJOR: principle removed/redefined, MINOR: principle added,
PATCH: wording) and adds a line to the amendment log.

## I. The spec is the source of truth

Code serves the spec, never the reverse. No behaviour ships without an acceptance criterion in an
approved `spec.md`. If implementation reveals the spec is wrong, stop, move the feature back
(`sdd set-status <id> draft --reason ...`) and get the change re-approved. Agents never silently
"fix" requirements.

## II. Test-first (non-negotiable)

For every acceptance criterion a failing test is written **before** the implementation, and seen to
fail for the right reason. Implementation is done when that test passes and nothing else broke.
Tests are never deleted, skipped or weakened to make a build green.

## III. Traceability

Every requirement maps to tasks and to tests: `REQ-n → AC-n.m → T### → test citing <feature>:AC-n.m`.
`sdd trace` must show zero gaps before a feature is verified.

## IV. Simplicity

The simplest design that satisfies the spec wins. No speculative abstractions, no unused
configuration, no new dependency without a stated reason in the plan. Any deviation is justified in
the plan's *Complexity Tracking* table.

## V. Security by default

Validate all external input. Least privilege everywhere. Secrets only from the environment or a
secret manager — never in code, logs, specs or test fixtures. New dependencies are pinned and
reviewed. OWASP Top 10 is considered in every plan that touches I/O.

## VI. Observability

Every externally visible operation is logged with structured context (no PII/secrets). Errors are
actionable: what failed, why, and what the caller can do. Health/readiness endpoints exist for every
deployable service.

## VII. Small, reversible changes

One task = one focused commit that leaves the build green. Every deployment can be rolled back.
Database migrations are backwards compatible for at least one release. Production deploys require
human approval.

## VIII. Single toolchain contract

Humans, agents, hooks and CI run the same commands via `node .sdd/scripts/sdd.mjs run <task>`.
Nobody hard-codes `npm test` / `pytest` / `go test` in prompts or pipelines.

## Amendment log

| Version | Date | Change | Approved by |
|---------|------|--------|-------------|
| 1.0.0 | 2026-10-15 | Initial constitution | — |

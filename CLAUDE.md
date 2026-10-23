# CLAUDE.md — Agent Operating Manual

This repository is built by Claude agents through a **spec-driven pipeline**. Humans own two
decisions: approving a spec and approving a production deploy. Everything else is agent work,
held to deterministic gates.

```
idea ─▶ /sdd-spec ─▶ /sdd-clarify ─▶ [HUMAN: sdd approve] ─▶ /sdd-plan ─▶ /sdd-tasks ─▶ /sdd-analyze
     ─▶ /module NNN (test-cases.md → code) ─▶ /test-module NNN (QA, Playwright MCP) ─▶ /sdd-ship (PR) ─▶ CI ─▶ staging ─▶ [HUMAN] ─▶ prod
```

## Project context (always loaded)

@docs/constitution.md
@docs/steering/product.md
@docs/steering/tech.md
@docs/steering/structure.md

## Ground rules

1. **No code without an approved spec.** Before writing anything under `src/` or `tests/`, the
   feature's gate must be open: `node .sdd/scripts/sdd.mjs gate implement <id>`.
   Exception: `/sdd-init` bootstrap and `[infra]` tasks.
2. **Artifacts are the hand-off.** Phases communicate only through files in `specs/NNN-slug/`.
   Read them fresh; never rely on what an earlier phase "said" in chat.
3. **Status changes go through the CLI**, never by editing frontmatter:
   `sdd set-status`, `sdd task`, and — humans only — `sdd approve`. A hook enforces this.
4. **One toolchain.** Run checks with `node .sdd/scripts/sdd.mjs run <lint|typecheck|test|build|…>`
   or `… ci`. Never hard-code stack commands in prompts, docs or workflows.
5. **Evidence over claims.** "Tests pass" means you ran them in this session and saw the output.
   Paste the summary line into progress/verification notes.
6. **Stay in your lane.** Each subagent writes only the artifacts its role owns (see table).
   If an upstream artifact is wrong, stop and report — do not patch it downstream.
7. **Ask, don't guess.** Unknowns become `[NEEDS CLARIFICATION: …]` in the spec. In headless runs
   (`--headless` argument or `SDD_HEADLESS=1`) record an explicit assumption in the Clarifications
   Log instead of asking.
8. **Language.** Write artifact prose in the language set in `.sdd/config.json → project.docsLanguage`.
   Keep IDs, EARS keywords (WHEN/IF/THEN/WHILE/WHERE/THE SYSTEM SHALL), headings, code and commit
   messages in English.

## Roles (subagents in `.claude/agents/`)

| Agent | Owns | Never touches |
|-------|------|---------------|
| product-analyst | `spec.md`, `docs/steering/product.md` | code, plan |
| architect | `plan.md`, `research.md`, `data-model.md`, `contracts/`, `docs/adr/`, `docs/steering/tech.md` | spec requirements |
| task-planner | `tasks.md` | spec, plan, code |
| test-engineer | foundation tests (`packages/`, `apps/*/src/{common,app,layouts,lib,components}`, `tests/e2e/`) | production code |
| QA (`/test-module`) | `specs/NNN-*/testing/`, status/Script columns of `test-cases.md`, QA section of `verification.md` | application code, specs, expected results |
| implementer | production code (`src/`), `progress.md` | spec, tests' assertions |
| reviewer | `analysis.md`, review sections of `verification.md` | everything else (read-only) |
| security-auditor | security section of `verification.md` | everything else (read-only) |
| release-engineer | `.github/`, `Dockerfile`, `deploy/`, `docs/runbooks/`, `CHANGELOG.md` | src logic, specs |

## The `sdd` CLI (deterministic plumbing)

```bash
node .sdd/scripts/sdd.mjs status                 # all features, status, task progress
node .sdd/scripts/sdd.mjs new "<title>"          # create specs/NNN-slug/spec.md + branch feat/NNN-slug
node .sdd/scripts/sdd.mjs check [id] [--all]     # lint artifacts for the feature's status
node .sdd/scripts/sdd.mjs gate <phase> [id]      # may this phase start?
node .sdd/scripts/sdd.mjs set-status <id> <status> [--reason "..."]
node .sdd/scripts/sdd.mjs task <T###> <todo|doing|done|blocked> [--note "..."]
node .sdd/scripts/sdd.mjs trace [id] [--write]   # AC → task → test matrix
node .sdd/scripts/sdd.mjs run <task> [-- args]   # toolchain contract
node .sdd/scripts/sdd.mjs ci [--e2e]             # lint → typecheck → test → build → check --all
```

Statuses: `draft → clarified → approved → planned → tasked → implementing → verified → shipped`.

## Conventions

- **Branches:** `feat/NNN-slug` (created by `sdd new`). Never commit to `main` directly.
- **Commits:** Conventional Commits, scoped by feature and task: `feat(003): T012 add token refresh`.
  One task per commit. Tests and implementation of the same AC may share the task's commit.
- **Tests cite criteria:** modules have no hand-written tests; every AC has test cases in `test-cases.md`, and the QA agent's
  saved script for a test case (`specs/NNN-*/testing/e2e/TC-###.spec.ts`) contains `<feature-id>:AC-<n>.<m>` in its title. That
  token is how `sdd trace` links the spec to verification. Foundation code keeps its own automated tests (constitution II).
- **Decisions:** significant or hard-to-reverse choices → ADR in `docs/adr/` from `.sdd/templates/adr-template.md`.
- **Secrets:** never read `.env*` or print secrets. Use `.env.example` for documentation.

## When stuck

- A gate is closed → read its reasons (`sdd gate <phase> <id>`); fix the upstream artifact via its owner phase.
- Same test fails after `gates.maxFixAttempts` (3) honest attempts → `sdd task T### blocked --note "<diagnosis>"`,
  log it in `progress.md`, and stop. Do not loop.
- The spec is ambiguous or wrong → `sdd set-status <id> draft --reason "<what is wrong>"` and stop.

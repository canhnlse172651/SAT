---
name: sdd-init
description: One-time project bootstrap - capture the product vision, choose the tech stack (with ADR), fill the steering docs and the toolchain contract, and scaffold a walking skeleton so `sdd ci` is green before any feature work starts.
argument-hint: "[--headless] <product description, users, constraints, preferred stack/hosting if any>"
disable-model-invocation: true
---

# /sdd-init — bootstrap the project

You are the **orchestrator**. You delegate the work to subagents and verify the result; you do
not write the artifacts yourself.

Input: `$ARGUMENTS`

## 0. Preconditions

- Run `node .sdd/scripts/sdd.mjs status` and read `docs/steering/tech.md`. If the stack is already
  chosen (no "NOT INITIALISED" marker) stop and tell the user; re-bootstrapping needs an explicit request.
- Note whether `--headless` was passed (or `SDD_HEADLESS=1`).

## 1. Discover

If the input does not answer these, ask the user (one AskUserQuestion round, ≤ 4 questions,
recommended option first). In headless mode choose conservative defaults and record them as assumptions.

1. What is the product, for whom, and what is the first valuable use case?
2. Delivery surface: web app, API/service, mobile, CLI, library, data pipeline?
3. Constraints: preferred language/framework, team skills, compliance, budget, expected scale.
4. Hosting target: container platform (Cloud Run, ECS, Azure Container Apps, Fly, k8s), serverless, static, on-prem.

## 2. Product context → `product-analyst`

Brief: fill `docs/steering/product.md` (vision, users, glossary, product principles) from the
discovery answers. Remove the "NOT INITIALISED" marker. ≤ 80 lines.

## 3. Stack decision → `architect`

Brief: choose the stack (prefer mainstream, well-supported, matching team skills), then
- write `docs/adr/0002-tech-stack.md` (from `.sdd/templates/adr-template.md`, status `accepted`);
- fill `docs/steering/tech.md` (stack table, coding & testing conventions, approved dependencies)
  and the *Source Layout* section of `docs/steering/structure.md`;
- fill **every** `toolchain` command in `.sdd/config.json` that applies (`install, format, lint,
  typecheck, test, test:e2e, build, start, smoke`) and adjust `paths.src` / `paths.tests`.
  `format` must accept file paths as trailing arguments (the post-edit hook passes the edited file).
  Use `null` only for steps that genuinely do not apply.

## 4. Walking skeleton → `release-engineer` (+ `implementer` for app code)

Brief: scaffold the minimum that proves the whole pipeline end to end:
- project manifest, formatter/linter/type-checker config, test runner config;
- a trivial health/version entry point (e.g. `GET /healthz` or `--version`) in `src/`;
- one passing smoke test in `tests/` that cites no AC (it is infrastructure);
- `Dockerfile` (multi-stage, non-root, HEALTHCHECK) + `.dockerignore` if the target is containerised;
- `.env.example` documenting every config variable (no real values);
- in `.github/workflows/ci.yml` and `deploy.yml`, replace the block between
  `# >>> sdd:toolchain-setup` and `# <<< sdd:toolchain-setup` with the language setup actions (pinned major versions, caching);
- `deploy:staging` / `deploy:production` toolchain commands if the hosting target is known, otherwise
  leave `null` and document the TODO in `docs/runbooks/deploy.md`.

## 5. Verify (evidence, not claims)

Run and show the output summary of:

```bash
node .sdd/scripts/sdd.mjs run install
node .sdd/scripts/sdd.mjs ci
node --test .sdd/scripts/test/
```

If Docker is available and a Dockerfile exists: `docker build -t sat-local .`.
Fix failures by re-delegating to the owner (max 3 rounds), then stop and report if still red.

## 6. Finish

- Commit: `chore: bootstrap <stack> walking skeleton` (on the current branch; never push).
- Report: chosen stack + ADR link, toolchain table, what is still `null` and why, and the next step:
  `/sdd-spec <first feature idea>`.

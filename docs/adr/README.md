# Architecture Decision Records

One file per significant, hard-to-reverse decision: `NNNN-kebab-title.md`, created from
`.sdd/templates/adr-template.md`. Accepted ADRs are never rewritten — a new ADR supersedes them
(set the old one's status to `superseded by ADR-NNNN`).

| ADR | Title | Status |
|-----|-------|--------|
| [0001](0001-adopt-spec-driven-development.md) | Adopt agent-driven, spec-driven development | accepted |
| [0002](0002-tech-stack.md) | Tech stack — React + Zustand / Express / MongoDB, TypeScript monorepo | accepted (backend superseded by 0004) |
| 0003 | Hosting target & deployment — pending | pending |
| [0004](0004-backend-nestjs.md) | Backend framework — NestJS 12 (on Express) replaces plain Express | accepted |

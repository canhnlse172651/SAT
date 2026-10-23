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
| [0005](0005-authentication-and-sessions.md) | Authentication and sessions — server-side sessions in MongoDB, scrypt, Origin-checked writes | accepted |
| [0006](0006-workspace-isolation-and-data-conventions.md) | Workspace isolation and data conventions | accepted |
| [0007](0007-shared-package-and-frontend-routing.md) | Shared package `@sat/shared` and frontend routing with `react-router` | accepted |
| [0008](0008-infrastructure-ports.md) | Infrastructure ports — Clock, EmailSender, FileStorage, JobScheduler with dev adapters | accepted |

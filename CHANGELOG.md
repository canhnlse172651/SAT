# Changelog

All notable changes to this project are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning: [SemVer](https://semver.org/). Entries reference the feature id, e.g. `(#003)`.

## [Unreleased]

### Added

- Spec-driven, agent-built development harness: `sdd` CLI, 8 role subagents, pipeline skills, guardrail hooks, CI/CD workflows.
- Walking skeleton (ADR-0002): npm-workspaces TypeScript monorepo — `apps/web` (React 19, Vite 8, Zustand 5),
  `apps/api` (Express 5, Mongoose 9, Zod 4, pino), health/readiness endpoints, JSON error contract,
  Vitest + Playwright (hermetic, in-memory MongoDB), single Docker image, smoke test.

### Changed

- Backend framework: `apps/api` now runs on NestJS 12 (platform-express, `@nestjs/mongoose`, nestjs-pino),
  built with `tsc` instead of esbuild; entry `dist/main.js`. HTTP behaviour and error contract unchanged (ADR-0004).

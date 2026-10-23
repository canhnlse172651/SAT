# Verification — {{FEATURE_ID}}-{{FEATURE_SLUG}}

<!--
Evidence that the feature meets its spec. Assembled by /sdd-verify from real command output — never
from memory. The verdict line is machine-read by `sdd set-status <id> verified` and the ship gate.
  PASS                every check green, no open CRITICAL/HIGH review findings
  PASS_WITH_WARNINGS  green, only MEDIUM/LOW findings recorded as follow-ups
  FAIL                anything else
-->

Verdict: FAIL
Date: {{DATE}}
Commit: <git sha>

## 1. Toolchain (`sdd ci --e2e`)

| Step | Result | Evidence |
|------|--------|----------|
| lint | | |
| typecheck | | |
| test | | <passed/failed/skipped counts, coverage %> |
| build | | |
| test:e2e | | |

## 2. Traceability (`sdd trace --write`)

<!-- Link ./traceability.md and list any gaps (must be none for PASS). -->

## 3. Non-Functional Requirements

| NFR | Target | Measured | Method | Result |
|-----|--------|----------|--------|--------|

## 4. Code Review (reviewer)

| ID | Severity | File:line | Finding | Resolution |
|----|----------|-----------|---------|------------|

## 5. Security Review (security-auditor)

| ID | Severity | File:line | Finding | Resolution |
|----|----------|-----------|---------|------------|

## 6. Follow-ups

<!-- Accepted MEDIUM/LOW findings → issues to file after merge. -->

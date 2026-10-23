---
name: sdd-ship
description: Package a verified feature for delivery - final CI run, changelog/runbook updates, status → shipped, push the branch and open the pull request. Deployment itself is done by CI/CD after merge (staging automatic, production human-approved).
argument-hint: "[feature-id] [--headless]"
disable-model-invocation: true
---

# /sdd-ship — hand over to CI/CD

You are the **orchestrator**. Input: `$ARGUMENTS`

1. **Gate.** `node .sdd/scripts/sdd.mjs gate ship <id>` — must be open (status `verified`).

2. **Delegate to `release-engineer`** with its `/sdd-ship checklist` for feature <id>
   (final `sdd ci`, CHANGELOG + runbooks, `set-status shipped`, commit, push branch, open PR using
   `.github/pull_request_template.md` with: spec link, AC coverage from traceability.md, verification
   verdict, rollback notes, follow-ups).

3. **Report:** PR URL (or the prepared title/body if `gh` is unavailable), what happens next:

   ```
   PR → CI (lint/test/build/spec gates) + Claude review → human merge
      → deploy.yml: image → staging (auto) → smoke test
      → release/tag → production (requires approval in the GitHub "production" environment)
   ```

Never merge the PR, push to the base branch, or trigger a production deploy yourself.

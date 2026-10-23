# Runbook — Rollback

## Decide (≤ 5 minutes)

Roll back when a release causes user-visible errors, data corruption risk, or a security exposure
and a forward fix is not trivially safe. Rolling back is the default; debugging happens afterwards.

## Application rollback

1. GitHub → Actions → **Deploy** → *Run workflow*: `environment = production`, `ref = <last good tag>`.
2. Approve the production environment gate. Wait for the smoke step to pass.
3. If a feature flag guards the change, turning it off is an acceptable faster alternative.

## Database

Migrations follow expand/contract and stay backwards compatible for one release (constitution VII),
so the previous version runs on the current schema. Never run a down-migration under pressure
without a verified backup.

## Afterwards

- Open a bug issue citing the violated criterion (`NNN:AC-x.y`) — the fix goes through the normal pipeline
  (spec gap → reopen the spec; code defect → fix task + regression test that cites the AC).
- Blameless post-incident note in `docs/runbooks/incidents/YYYY-MM-DD-<slug>.md`.

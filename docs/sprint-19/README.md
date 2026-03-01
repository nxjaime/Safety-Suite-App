# Sprint 19 Artifact (Progress)

## Scope Started

- Established launch rehearsal automation:
  - Added `scripts/release-rehearsal.sh` to run:
    - unit tests,
    - production build,
    - smoke e2e (optional via `SKIP_SMOKE=1`).
  - Added npm entrypoint: `npm run rehearsal:launch`.
- Added operational runbook:
  - `docs/runbooks/launch-rehearsal.md`
  - Defines preconditions, execution flow, failure triage expectations, rollback/restore checks, and go/no-go output.
- Began Sprint 19 artifacting for UAT/performance/launch rehearsal readiness.
- Added UAT execution matrix:
  - `docs/sprint-19/uat-checklist.md`
  - Covers auth, fleet ops, inspections/compliance, safety, training, reporting, and admin permission validation.

## Validation

- `SKIP_SMOKE=1 npm run rehearsal:launch` passed.

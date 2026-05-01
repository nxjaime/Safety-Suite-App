# Sprint 40 — FMCSA Live Integration and Carrier Data Completion

## Scope completed
- Replaced the mock/development carrier lookup path with a live FMCSA SAFER snapshot flow backed by `/api/carrier-health`.
- Added FMCSA inspection/crash/OOS parsing, derived CSA seeding, retry handling, and a circuit breaker for lookup failures.
- Updated the FMCSA page to show live carrier health, inspection totals, crash totals, OOS rate, and configurable safety-rating threshold alerts.
- Updated the Carrier Health widget to surface live snapshot status, threshold alerts, and inspection summary cards without mock fallback behavior.
- Wired the CSA Predictor to ingest FMCSA carrier snapshots as an additional real-data source alongside inspection records.
- Added regression tests for the carrier service, FMCSA page, and CSA Predictor FMCSA-seeding workflow.

## Verification
- `npm exec vitest --run src/test/carrierService.test.ts src/test/fmcsaPage.test.tsx src/test/csaPredictor.test.tsx`
- `npm run build`
- Browser verification on the local app:
  - `/fmcsa` looked up USDOT `3114665` and rendered live carrier health, inspection totals, crash totals, OOS rate, CSA scores, and a below-threshold warning.
  - `/reporting/csa-predictor` loaded the same FMCSA carrier snapshot and appended FMCSA-derived violation seeds into the predictor table.

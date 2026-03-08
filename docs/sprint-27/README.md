# Sprint 27: Documents, FMCSA, and External Data Completion

## Summary
Sprint 27 adds document lifecycle governance (expiration, deficiency detection) and replaces the static FMCSA page's external data gap with a functional carrier health lookup backed by the existing `carrierService` with graceful fallback.

## Deliverables

### Document Service (`src/services/documentService.ts`)
- `getExpiringDocuments(docs, daysOut, todayISO)` — pure filter; returns docs whose `metadata.expirationDate` falls within the next `daysOut` days
- `getExpiredDocuments(docs, todayISO)` — returns docs already past expiration date
- `getDocumentDeficiencies(docs, todayISO)` — returns required docs (`metadata.required === true`) that are expired or missing an expiry date

### Documents Page (`src/pages/Documents.tsx`)
- Alert banner at top showing count of: expired docs, expiring within 30 days, and required document deficiencies
- Banner items are computed via `useMemo` over the loaded document list — zero additional DB calls
- Clicking "X expired documents" resets category filter for browsing

### FMCSA Page (`src/pages/FMCSA.tsx`)
- **Carrier Health Lookup panel** added above the regulation reference list
- DOT number input → calls `carrierService.fetchCarrierHealth()` which tries live `/api/carrier-health` with automatic fallback to cached DB data
- Displays: legal name, operating status (color-coded), safety rating, power units / drivers, CSA scores grid
- Shows amber warning banner when lookup fails or returns no data (graceful degradation)
- Last-updated timestamp shown on cached results

## Tests
- `src/test/documentService.test.ts` — 3 new tests:
  - `getExpiringDocuments` window filter
  - `getExpiredDocuments` past-date filter
  - `getDocumentDeficiencies` expired + missing_expiry detection, skips non-required

## Exit Criteria
- [x] Documents surface expiration warnings without manual review
- [x] Required document deficiencies computed from metadata
- [x] FMCSA page provides useful operational value (carrier lookup) beyond static references
- [x] Carrier health lookup degrades gracefully when API unavailable (uses cache)
- [x] 312 tests pass; zero TypeScript errors

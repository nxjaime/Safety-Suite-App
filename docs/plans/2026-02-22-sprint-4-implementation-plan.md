# Sprint 4 Implementation Plan — Safety Intelligence Core

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver a 0–100 driver risk score that blends Motive scores and local risk events, persists score history, and drives coaching workflows.

**Architecture:** Supabase-backed data model for risk events, score history, and coaching targets; client-side services compute composite scores (Motive + local) and update drivers; React views consume new services with banded UI.

**Tech Stack:** React 19 + Vite + Supabase JS client; TypeScript; Tailwind; Vitest.

---

### Task 1: Risk Event Schema + RLS

**Files:**
- Create: `supabase/migrations/20260222020000_risk_events_score_history.sql`

**Steps:**
1. Define `risk_events` columns: id uuid pk, driver_id uuid fk, organization_id uuid fk, source text, event_type text, severity smallint, score_delta int, occurred_at timestamptz, metadata jsonb, created_at timestamptz.
2. Add indexes: (driver_id, occurred_at desc), (organization_id), (source).
3. Create `driver_risk_scores` table: id uuid pk, driver_id, organization_id, score int, composite_parts jsonb, source_window text, as_of timestamptz default now().
4. RLS: enable RLS; add org-scoped policies (select/insert/update/delete) for both tables; drop any public policies if present.
5. Seed `system_options` risk types only if missing (no duplicates).
6. Add check constraint for severity (1–5) and score 0–100.
7. Commit migration file content.

**Tests:**
- `npm run test -- --run src/test/schemas.test.ts` (ensure migrations compile if applicable).

### Task 2: Risk Service (composite score)

**Files:**
- Create: `src/services/riskService.ts`
- Modify: `src/services/driverService.ts`
- Test: `src/test/riskService.test.ts`

**Steps:**
1. In test, write failing cases for:
   - Motive available + local events → blended score per formula (0.6 motive + 0.4 local weighted, clamp 0–100).
   - Motive missing → fallback motive=60.
   - Bands (green <50, yellow 50–79, red 80–100).
   - Score history write to `driver_risk_scores` and driver record update.
2. Implement `riskService` with:
   - `ingestEvent(event)` inserting into `risk_events` with org_id.
   - `calculateScore(driverId, window='90d')` pulling Motive scores (30d) via `motiveService.getScores`, local events windowed, computing composite, writing `driver_risk_scores`, updating `drivers.risk_score`.
   - `getScoreHistory(driverId, limit=12)`.
   - Helpers for type weights and banding.
3. Update `driverService` to call `riskService.calculateScore` where appropriate (e.g., after risk event insert) and to expose a `refreshRiskScore(driverId)` wrapper.
4. Run tests: `npm run test -- --run src/test/riskService.test.ts`.

### Task 3: UI Wiring — Safety Dashboard

**Files:**
- Modify: `src/pages/Safety.tsx`
- Modify: `src/services/motiveService.ts` (if needed for caching shapes)
- Test: `src/test/navigation.test.tsx` (ensure links untouched)

**Steps:**
1. Replace mock stats with live aggregates from `driver_risk_scores` + `risk_events` counts (use supabase queries in page).
2. Render overall risk score average with banded pill; include sparkline trend from score history (last 6–12 points).
3. Show incident count from `risk_events` last 90d; coaching count from active `coaching_plans`.
4. Ensure loading/error states and empty data fallbacks.
5. Run targeted tests: `npm run test -- --run src/test/navigation.test.tsx` (sanity) and any new UI tests if added.

### Task 4: Drivers List Banded Scores

**Files:**
- Modify: `src/pages/Drivers.tsx`
- Modify: `src/services/driverService.ts` (if additional fetch fields needed)
- Test: `src/test/maintenancePage.test.ts` (unchanged) or add `src/test/driversRiskBands.test.ts`

**Steps:**
1. Display risk score pill with band colors; default to 60 if null.
2. Add filter by band (All/Green/Yellow/Red) client-side.
3. Indicate “Plan Assigned” if active coaching plan exists.
4. Optional: column for last score date from `driver_risk_scores`.
5. Add/adjust test to verify band mapping and filter.

### Task 5: Driver Profile — Score, Events, Coaching

**Files:**
- Modify: `src/pages/DriverProfile.tsx`
- Modify: `src/services/driverService.ts` (fetch score history + events)
- Modify: `src/services/emailService.ts` (if message templates need new fields)
- Test: `src/test/DriverProfile.test.tsx` (new) focusing on rendering bands and events

**Steps:**
1. Header: show current score with band color and composite parts (Motive vs Local) read from `driver_risk_scores` last entry.
2. Add risk timeline chart (last 12 scores) using history data.
3. Add risk events table (last 90d) with source/type/severity; button to add manual event (type, severity, occurred_at) -> calls `riskService.ingestEvent` then `calculateScore`.
4. Coaching tab: add target score, due date, outcome fields; display next check-ins; badge “Plan Assigned” if active.
5. Wire “Recalculate score” action to `refreshRiskScore`.
6. Tests: render band colors, adding an event triggers recalculation stubbed/mocked.

### Task 6: RLS/Policy Fixes Cleanup

**Files:**
- Modify: `supabase/migrations/fix_rls_policies.sql` or new migration `20260222021000_fix_risk_rls.sql`

**Steps:**
1. Remove/replace any legacy `Public` policies on `risk_events` and `coaching_plans` with org-scoped policies consistent with Sprint 3 pattern.
2. Add POLICY statements for select/insert/update/delete using organization_id lookups.
3. Ensure enabling RLS on `driver_risk_scores` and `risk_events` if not already.
4. Document assumptions in migration comments.

### Task 7: Docs and Handoff

**Files:**
- Modify: `handoff.md`
- Modify: `docs/plans/2026-02-22-sprint-4-design.md` (if tweaks)
- Add: `docs/sprint-4/summary.md`, `docs/sprint-4/verification.md`

**Steps:**
1. Update `handoff.md` Sprint 4 section with status/progress once implemented.
2. Create sprint summary + verification docs (tests/build commands).
3. Note any remaining risks or follow-ons for Sprint 5.

### Task 8: Verification and Commit

**Steps:**
1. Run full test/build: `npm run test -- --run src/test` and `npm run build`.
2. `git status` to ensure only intended files staged.
3. Commit: `git commit -m "sprint-4: safety intelligence core"`.
4. Push branch and follow sprint commit protocol.

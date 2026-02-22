# Sprint 4 Design — Safety Intelligence Core (Risk + Coaching)

## Goal
Deliver a shippable driver safety core that blends Motive safety scores with in-app risk events, surfaces a 0–100 risk score, and drives coaching workflows.

## Scope (agreed order)
1) Driver risk scorecard (0–100, green/yellow/red thresholds)
2) Coaching workflow (plans, check-ins, outcomes)
3) Risk event ingestion/normalization (Motive + local `risk_events`)

## Data Model
- `risk_events` (normalize and harden)
  - `id uuid pk`, `driver_id uuid references drivers(id)`, `organization_id uuid references organizations(id)`
  - `source` enum/text (`motive`, `manual`, `import`, `inspection`)
  - `event_type` text (ref `system_options` category `risk_type`), `severity` smallint (1–5)
  - `score_delta` int (positive = risk add), `occurred_at timestamptz`, `metadata jsonb`
  - Indexes: `driver_id, occurred_at desc`, `organization_id`, `source`
  - RLS: org-scoped select/insert/update/delete + tenant-aware defaults
- `driver_risk_scores` (history)
  - `id uuid pk`, `driver_id`, `organization_id`, `score int`, `composite_parts jsonb`, `source_window` (text, e.g., `30d`), `as_of timestamptz default now()`
- `coaching_plans` (extend)
  - Add `target_score int`, `due_date date`, `outcome text`, `completed_at timestamptz`
  - Keep `weekly_check_ins jsonb` from prior migration; ensure org_id column populated

## Scoring Model (0–100)
- Baseline: Motive safety score (0–100) when available; fallback to 60.
- Local component: weighted recent `risk_events` (last 90d) by severity and type weight.
  - Type weights: `Speeding 8`, `Hard Braking 6`, `HOS Violation 7`, `Accident 15`, `Citation 5`, default `5`.
  - Local score = clamp( 20 + sum(type_weight * severity) ), max 100.
- Composite: `score = clamp( round(0.6 * motive + 0.4 * local) )`.
- Bands: Green 0–49, Yellow 50–79, Red 80–100.
- Persist the final score + parts in `driver_risk_scores`; mirror to `drivers.risk_score` for UI.

## Integrations
- Motive: reuse `motiveService.getScores(start_date, end_date)` to pull last 30d safety scores; cache in Supabase table or memory per session; fall back gracefully if API fails.
- Local ingestion: allow manual event creation (Driver Profile) and system-driven ingestion from inspections (if OOS) using `risk_events`.

## Services
- `riskService` (new):
  - `ingestEvent(event)` -> inserts into `risk_events` with org scoping.
  - `calculateScore(driverId, window='90d')` -> fetch motive + local events, produce composite, write `driver_risk_scores`, update `drivers.risk_score`.
  - `getScoreHistory(driverId, limit=12)` -> charting.
- `coachingService` (extend existing driverService/coaching flows or wrapper): create/update plans with `target_score`, generate weekly check-in tasks, close plan when score < threshold or outcome set.

## UI/UX
- Safety Dashboard (`src/pages/Safety.tsx`): replace mock stats with live aggregates; add banded badges and trend sparkline from `driver_risk_scores`.
- Drivers list (`src/pages/Drivers.tsx`): show banded score pill and “Plan Assigned” if active coaching; enable filter by band.
- Driver Profile (`src/pages/DriverProfile.tsx`):
  - Score header with composite parts (Motive vs Local) and band color.
  - Risk timeline chart from `driver_risk_scores` (last 12 points).
  - Risk events table (last 90d) with source/type/severity.
  - Create manual risk event form (type, severity, occurred_at).
  - Coaching plans tab: add target score, due date, outcome; show upcoming check-ins.

## API/Routes (if needed)
- Vite app uses Supabase client directly; no extra server routes unless Motive proxy needed. If Motive requires secret, add serverless function `api/motive/scores` with env-injected token and per-request validation.

## Security & RLS
- Tighten RLS for `risk_events`, `driver_risk_scores`, `coaching_plans` to org-only; remove legacy public policies (fix migration if needed).
- Ensure writes set `organization_id` from profile lookup in Supabase RPC or client guard.
- Validate event_type against `system_options` risk types on insert (client-side now; server-side later via check constraint or trigger).

## Testing
- Unit: scoring function (weights, clamp, bands), Motive-fallback paths, event ingestion validation.
- Integration: create risk event -> score recalculates -> driver/profile reflects; coaching plan created with target_score triggers tasks.
- UI: band rendering, filters, timeline chart with history data.

## Acceptance Criteria
- Drivers show accurate 0–100 score combining Motive + local events; missing Motive degrades gracefully.
- Risk events can be created/viewed per driver with org scoping; history visible.
- Score history persists to `driver_risk_scores` and drives charts.
- Coaching plans support target score/outcomes and show next check-ins; “Plan Assigned” badges reflect reality.
- RLS prevents cross-org access to risk/coaching data.

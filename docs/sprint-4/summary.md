# Sprint 4 Summary — Safety Intelligence Core

## Delivered
- Risk events + driver risk score history tables with org-scoped RLS and constraints.
- Risk scoring helpers (Motive + local events) with banding and fallback logic.
- Safety dashboard now shows live averages, incident counts, coaching counts, and score trend.
- Drivers list shows banded scores with band filter and plan badges.
- Driver profile shows banded score with manual recalc.

## Data/Model
- `risk_events` with severity check, org scoping, indexes.
- `driver_risk_scores` with 0–100 score constraint and composite parts.
- Seeded risk types guarded against duplicates.

## Notes
- Motive errors degrade gracefully to fallback score.
- Supabase env still needed for API calls; UI handles loading/empty states.

# Sprint 1 MVP Feature Map

## Goal
Define the MVP boundary for the Fleet Operations + Safety Intelligence release track.

## In Scope (MVP)

### A. Platform Foundation
- Authentication (email/password) with protected routes
- Organization-aware data model and tenant isolation enforcement
- Role baseline: Admin, Safety Manager, Viewer

### B. Fleet Operations (MVP)
- Equipment registry CRUD (unit, type, status, identifiers)
- Inspection capture and inspection history
- Basic defect/remediation workflow tied to equipment and tasks
- Document attachment and retrieval for equipment/driver records

### C. Safety Intelligence (MVP)
- Driver profile CRUD + status and assignment metadata
- Risk event capture and derived risk score calculation
- Coaching plan lifecycle: create, check-in, complete/terminate
- Tasking tied to risk/coaching interventions

### D. Compliance and Tasking (MVP)
- Compliance-related tasks with due date/priority/status
- Inspection/compliance queue views (open, overdue, complete)
- Core reporting cards (live data, not static placeholders)

### E. Integrations (MVP)
- Motive driver and events data ingestion path (hardened proxy)
- FMCSA carrier health lookup with cache/fallback
- Transactional outbound email notifications for critical workflows

## Deferred (Post-MVP)
- Advanced maintenance scheduling optimizer
- Complex workflow automations and policy engine
- Multi-step escalation orchestration and SLA ladders
- Deep analytics/forecasting and executive benchmarking packs
- Mobile offline-first workflow support

## Route-to-MVP Mapping
| Route | MVP Decision | Notes |
|---|---|---|
| `/` dashboard | In | Must be live data-backed |
| `/drivers` + `/drivers/:id` | In | Core safety workflow |
| `/tasks` | In | Required for intervention tracking |
| `/safety` | In | Required |
| `/compliance` | In | Required |
| `/equipment` | In | Required for fleet operations |
| `/documents` | In | Required but must replace placeholders |
| `/training` | Deferred/Partial | Keep minimal until live source exists |
| `/reporting` | In (v1) | Core KPI/report set only |
| `/reporting/csa-predictor` | Deferred/Partial | Keep as experimental behind explicit label |
| `/fmcsa` | In | Integration hardening required |
| `/settings` | In | Include role/user/system config baseline |

## MVP Success Criteria
- All in-scope routes use production data pathways.
- No placeholder workflows in in-scope routes.
- P0/P1 security and tenant-isolation issues are closed.
- Build/tests pass and release gates are green.

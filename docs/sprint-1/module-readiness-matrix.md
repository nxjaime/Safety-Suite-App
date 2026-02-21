# Sprint 1 Module Readiness Matrix

Legend: `Done` | `Partial` | `Mock` | `Blocked`

## Core App and UX Shell
| Module | Status | Notes | Owner |
|---|---|---|---|
| Auth (Login/Signup) | Partial | Basic auth flow exists; hardening and RBAC pending | Engineering |
| App Layout / Navigation | Partial | Structure exists; IA standardization needed | Engineering + Design |
| Dashboard | Mock | Static/demo data present | Engineering |
| Settings | Partial | Basic CRUD exists; governance and roles pending | Engineering |

## Fleet Operations (Fleetio-like)
| Module | Status | Notes | Owner |
|---|---|---|---|
| Equipment Registry | Partial | Basic views/forms present; lifecycle/work orders missing | Engineering |
| Maintenance Scheduling | Blocked | No production-grade workflow yet | Engineering |
| Work Orders | Blocked | Not implemented as primary workflow | Engineering |
| Inspection Defects / Remediation | Partial | Inspection scaffolding exists; remediation loop incomplete | Engineering |

## Safety Intelligence (Idelic-like)
| Module | Status | Notes | Owner |
|---|---|---|---|
| Driver Profiles | Partial | Core profile exists; consistency and type safety gaps | Engineering |
| Risk Scoring | Partial | Logic exists; validation/calibration hardening required | Engineering + Safety Ops |
| Coaching Plans | Partial | Core flow exists; reliability/auditability improvements needed | Engineering |
| Interventions and Accountability | Blocked | Workflow needs formalization and audit events | Engineering + Safety Ops |

## Compliance and Documents
| Module | Status | Notes | Owner |
|---|---|---|---|
| Documents | Mock | Placeholder content behavior still present | Engineering |
| Compliance Queueing | Partial | Some tasking exists; policy-driven queueing incomplete | Engineering |
| Training Management | Mock | Demo/static content in current state | Engineering |

## Integrations and Platform
| Module | Status | Notes | Owner |
|---|---|---|---|
| Motive Integration | Partial | Proxy endpoints exist; resilience and limits pending | Engineering |
| FMCSA / Carrier Health | Partial | Scrape/proxy exists; hardening and observability needed | Engineering |
| Email Notifications | Partial | API exists; delivery governance/telemetry pending | Engineering |
| Supabase Data + RLS | Partial | RLS hardening started; drift review and enforcement pending | Engineering |
| CI/CD Quality Gates | Done | Quality gate workflow added in Sprint 1 | Engineering |

## Priority Focus (Sprint 1 Outcome)
1. Convert all `Mock` modules to clear implementation stories for Sprint 2-4.
2. Resolve `Blocked` workflows into scoped epics with acceptance criteria.
3. Tie each `Partial` module to concrete hardening tasks (security, testing, UX).

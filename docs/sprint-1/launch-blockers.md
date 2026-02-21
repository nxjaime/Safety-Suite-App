# Sprint 1 Launch Blockers Backlog

## Severity Definition
- `P0`: Must fix before any external pilot.
- `P1`: Must fix before production go-live.
- `P2`: Important but can follow go-live with mitigation.

## Top Blockers (Initial)

| ID | Severity | Area | Blocker | Owner | Target Sprint |
|---|---|---|---|---|---|
| LB-001 | P0 | Security | Client-side secret fallback used for sensitive data crypto | Engineering | Sprint 7 |
| LB-002 | P0 | Security | Inconsistent tenant-isolation assumptions between services and DB | Engineering | Sprint 7 |
| LB-003 | P1 | Data | Historical schema/policy drift risk between baseline schema and migrations | Engineering | Sprint 7 |
| LB-004 | P1 | UX/Data | Dashboard relies on static/mock data | Engineering | Sprint 9 |
| LB-005 | P1 | Compliance | Documents flow still uses placeholder behavior | Engineering | Sprint 6 |
| LB-006 | P1 | Reliability | Task/driver workflows need stricter validation and audit trails | Engineering | Sprint 4 |
| LB-007 | P1 | Quality | Heavy `any` usage in critical service paths | Engineering | Sprint 4 |
| LB-008 | P1 | Testing | Minimal automated coverage for critical user journeys | Engineering + QA | Sprint 9 |
| LB-009 | P1 | Integrations | Motive/FMCSA/email paths lack retry/timeout/rate-limit hardening | Engineering | Sprint 5 |
| LB-010 | P1 | Ops | Monitoring/alerting and incident runbook not production-ready | Engineering + Ops | Sprint 9 |
| LB-011 | P1 | Code Quality | Lint debt in app modules (`no-explicit-any`, hook effects) blocks strict lint enforcement | Engineering | Sprint 4 |
| LB-012 | P2 | Accessibility | No documented WCAG baseline audit on core screens | Design + Engineering | Sprint 2 |
| LB-013 | P2 | Performance | Query budget and p95 targets not enforced in CI/review | Engineering | Sprint 8 |
| LB-014 | P1 | Product Data | MVP in-scope routes still include partial/static placeholders | Engineering + Product | Sprint 3 |
| LB-015 | P1 | AuthZ | Route and data-level role enforcement matrix not implemented end-to-end | Engineering | Sprint 7 |
| LB-016 | P1 | API Security | Missing standardized rate-limit and timeout policy across API endpoints | Engineering | Sprint 5 |
| LB-017 | P1 | Auditability | No centralized audit event stream for critical state changes | Engineering | Sprint 4 |
| LB-018 | P2 | Release Mgmt | Branch protection and required checks not fully enforced in VCS settings | Engineering Lead | Sprint 1 |
| LB-019 | P2 | DR Readiness | Backup restore drill not yet executed in production-like environment | Ops | Sprint 9 |
| LB-020 | P2 | Data Governance | Retention/deletion policy for sensitive records not codified | Product + Security | Sprint 7 |

## Blocker Triage Rules
- Every blocker must have: owner, severity, evidence, target sprint, mitigation.
- P0/P1 blockers are reviewed at least twice weekly during Sprint 1.
- Blockers without an owner are treated as escalation items.

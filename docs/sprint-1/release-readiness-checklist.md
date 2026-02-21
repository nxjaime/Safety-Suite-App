# Sprint 1 Release Readiness Checklist

## Scope
This checklist defines Sprint 1 release gates for the Fleetio + Idelic hybrid MVP.

## Engineering Quality Gates
- [ ] CI quality-gates workflow enabled and passing (`.github/workflows/quality-gates.yml`)
- [ ] App lint audit runs on `src` + `api` (temporary non-blocking in Sprint 1)
- [ ] `npm run build` passes (includes TypeScript compile)
- [ ] `npm run test -- --run src/test` passes
- [ ] No unresolved critical build/runtime errors on core routes

## Security and Risk Gates
- [ ] P0/P1 security taxonomy documented
- [ ] Client-side secret usage inventory complete
- [ ] Tenant isolation assumptions inventory complete (app + DB + API)
- [ ] Known high-risk items have owners and target sprint

## Product and UX Gates
- [ ] MVP feature boundaries approved (Operations vs Safety)
- [ ] Navigation and module ownership map approved
- [ ] Route readiness matrix complete (Done / Partial / Mock / Blocked)

## Data and Platform Gates
- [ ] Core table ownership and migration strategy documented
- [ ] Baseline RLS policy posture documented by table
- [ ] Baseline performance targets defined (p95 latency, query classes)

## Operational Gates
- [ ] NFR targets approved (uptime, RTO, RPO, support SLA)
- [ ] Environments mapped (dev/staging/prod-like)
- [ ] Incident triage severity model drafted

## Sprint 1 Exit Criteria
- [ ] Top 20 launch blockers prioritized with owner, severity, and target sprint
- [ ] Sprint 2-4 backlog is implementation-ready
- [ ] CI quality gates are active for PRs and protected branches

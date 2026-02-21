# Sprint 1 Non-Functional Requirements (NFR) Targets

## Availability and Reliability
- App/API availability target: `99.5%` (pre-GA), `99.9%` (post-GA target)
- Critical workflow success rate (auth, driver updates, tasks, inspections): `>= 99%`
- Error budget policy: alerts on sustained error rate > `1%` for 15 minutes

## Performance Targets
- p95 route load (authenticated core pages): `< 2.5s`
- p95 API request latency (core read/write endpoints): `< 500ms`
- p95 DB query latency for high-volume queries: `< 200ms`
- Batch operations (imports): progress visibility and graceful partial-failure handling required

## Security and Isolation
- Zero open P0/P1 security findings at release
- Tenant isolation enforced in DB policies and verified by test cases
- No production secrets in client bundle
- Sensitive data handling must be server-side or managed via approved secure pattern

## Data Integrity and Recovery
- Data correctness checks for key entities: drivers, tasks, inspections, documents
- Recovery Point Objective (RPO): `<= 15 minutes`
- Recovery Time Objective (RTO): `<= 4 hours`
- Restore drill frequency: at least one full drill before production launch

## Observability and Operations
- Structured logs for API and critical mutation events
- Traceability: request correlation IDs across API calls
- Alert coverage: auth failures, integration failures, high error rate, DB anomalies
- Incident response: severity rubric (SEV1-SEV3) and owner on-call map documented

## Delivery Governance
- CI quality gates mandatory on PRs
- No direct deploys without passing quality gates
- Each sprint must include measurable success metrics and risk review

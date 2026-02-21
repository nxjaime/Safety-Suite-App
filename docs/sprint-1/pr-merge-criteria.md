# Sprint 1 PR Merge Criteria

## Required For Merge (Effective Immediately)
- PR linked to backlog item with clear acceptance criteria
- At least one reviewer approval
- CI build passes (`npm run build`)
- Scoped tests pass (`npm run test -- --run src/test`)
- No new secrets, tokens, or credentials in changed files
- DB changes include migration + rollback notes (if applicable)

## Temporary Sprint 1 Exception
- App lint audit runs and is reviewed, but does not block merge while baseline debt is remediated.
- Any PR increasing lint debt must include an explicit follow-up task ID.

## Security-Specific Merge Rules
- Any auth/RLS/PII change requires security reviewer sign-off.
- No weakening of tenant isolation or policy checks.
- API input validation required for all new or modified endpoints.

## Data and Migration Rules
- Schema changes must include:
  - forward migration script
  - compatibility notes
  - production rollout order
- Destructive migrations require explicit approval and rollback plan.

## UX and Product Rules
- No placeholder/mocked UI behavior on MVP in-scope routes.
- Accessibility checks required for new UI components (keyboard/focus/labels).

## Definition of Done Per PR
- Acceptance criteria satisfied
- Observability/logging added for critical mutations
- Docs updated when behavior/config changes
- Risk notes captured if technical debt is intentionally deferred

# Launch Rehearsal Runbook

## Purpose

Provide a repeatable pre-launch exercise that validates app readiness, rollback posture, and team response timing.

## Preconditions

- Latest sprint changes merged to target branch.
- Required environment variables configured for build/test.
- Playwright browsers installed if smoke checks are enabled.

## Rehearsal Command

```bash
npm run rehearsal:launch
```

Optional (skip smoke e2e):

```bash
SKIP_SMOKE=1 npm run rehearsal:launch
```

## Checklist

1. Record rehearsal metadata:
   - date/time (UTC), commit SHA, participants, branch.
2. Execute rehearsal command and capture outputs.
3. If any check fails:
   - triage owner assigned within 15 minutes,
   - blocker ticket created with severity and ETA.
4. Verify rollback posture:
   - confirm last known-good commit SHA,
   - confirm DB migration rollback notes exist for current release window.
5. Verify restore posture:
   - confirm backup restore drill evidence is available in sprint artifacts.
6. Publish result summary:
   - pass/fail,
   - blockers,
   - go/no-go recommendation.

## Exit Criteria

- Unit, build, and smoke checks pass (or explicitly waived with owner sign-off).
- No open P0 launch blockers.
- Go/no-go recommendation documented.

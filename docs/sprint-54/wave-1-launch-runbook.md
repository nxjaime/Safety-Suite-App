# Wave 1 Launch Runbook

## Launch Scope
Wave 1 is a controlled production launch for validated admin and operations users on `https://safetyhubconnect.vercel.app`.

Primary launch workflows:
- Admin sign-in and protected-route access
- Driver creation with server-side PII encryption
- Task create/start/reload/search persistence
- Work order create/approve/start/complete/close persistence
- Training template create, assignment, completion, and reload persistence
- Motive endpoints returning disabled placeholder responses

## Go/No-Go Checklist
| Check | Owner | Status | Evidence |
| --- | --- | --- | --- |
| GitHub `main` is the deployed source | Engineering | Pass | Vercel production deployments are sourced from `main`. |
| Production deployment is Ready | Engineering | Pass | Latest Vercel deployment reached Ready after Sprint 53 fixes. |
| Release gate passes locally | Engineering | Pass | `npm run release:check` passes: build, 245 unit tests, lint warnings only, 16 layout tests, prod audit. |
| Vercel Function TypeScript build path is clean | Engineering | Pass | Targeted `npx tsc --noEmit --module NodeNext --moduleResolution NodeNext --target ES2022 --types node --esModuleInterop api/*.ts api/**/*.ts` passes. |
| Hosted admin login works | QA | Pass | `admin@safetyhubconnect.test` login verified on production. |
| Production PII encryption is server-side | Security | Pass | `encrypt-pii` Supabase Edge Function deployed and live bundle calls `functions.invoke("encrypt-pii")`. |
| Core fleet workflow persists | QA | Pass | Work order created, approved, started, completed, closed, reloaded as Closed. |
| Core safety workflow persists | QA | Pass | Driver created, training template created, assignment completed, reloaded as Completed. |
| Removed Motive surface fails safely | Engineering | Pass | `/api/motive/drivers`, `/api/motive/scores`, `/api/motive/events` return disabled placeholder responses. |
| Known residual risks are documented | PM / Engineering | Pass | See "Known Issues and Watch Items". |

Launch decision: Go for a controlled Wave 1 launch after a final production login check immediately before inviting users.

## Customer Onboarding Checklist
1. Confirm the customer org exists and the first admin user can sign in.
2. Confirm admin role and organization assignment in Supabase profiles.
3. Send the production URL and temporary credentials through an approved secure channel.
4. Ask the customer to change the temporary password before entering real production data.
5. Walk through the first driver, first task, first work order, and first training assignment with a customer admin.
6. Confirm the customer understands Motive is disabled and ELD integrations are planned, not live.
7. Capture first-session issues in Help/Feedback or the launch backlog.

## Monitoring Checks
Vercel:
- Check latest production deployment status with `npx vercel ls`.
- Inspect build/runtime failures from the Vercel project dashboard.
- Watch API routes: `/api/carrier-health`, `/api/integrations/health`, `/api/send-email`, and `/api/motive/*`.

Supabase:
- Confirm Auth sign-ins and failed logins in the Supabase dashboard.
- Check Edge Function logs for `encrypt-pii`.
- Check database API errors around `drivers`, `tasks`, `work_orders`, `work_order_line_items`, `training_templates`, and `training_assignments`.
- Confirm RLS failures are treated as blockers unless they are expected denied actions.

Browser:
- Capture route URL, user role, console errors, and network failures.
- Treat generic `Failed to fetch` errors as actionable until tied to navigation cancellation or a known unavailable integration.
- Ask users to hard refresh after deploys only if automatic stale-chunk recovery does not resolve a route error.

## Rollback Checklist
1. Stop onboarding new users.
2. Identify the last known-good Vercel production deployment.
3. Promote or redeploy the last known-good deployment from Vercel.
4. If the issue involves data writes, pause the affected workflow and inspect Supabase records before retrying.
5. If the issue involves PII encryption, do not disable Edge crypto in production; fix the Edge Function or secret instead.
6. Document affected users, routes, timestamps, console/network output, and remediation.
7. Re-run hosted login plus the impacted workflow before resuming Wave 1.

## Known Issues and Watch Items
- A non-blocking `carrier settings` fetch error can appear during hosted navigation. It has not blocked verified workflows; monitor and prioritize if it becomes route-specific or user-visible.
- The public landing page remains noticeably slower than the authenticated workflow screens. Track as a UX/performance backlog item.
- Lint still reports warnings only, mostly existing `any` and hook dependency cleanup. These are not current launch blockers but should be reduced after Wave 1.
- Motive remains intentionally disabled. Do not promise live Motive support during Wave 1.

## Exit Check
Before sending Wave 1 invites:
1. Run `npm run release:check`.
2. Confirm latest Vercel production deployment is Ready.
3. Log in on `https://safetyhubconnect.vercel.app`.
4. Open Dashboard, Drivers, Tasks, Work Orders, Training, Admin, and Help.
5. Confirm no P0/P1 console or workflow failures appear.

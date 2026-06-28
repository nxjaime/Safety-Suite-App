# Safety Suite App Handoff

## Current Status
SafetyHub Connect is Wave 1 launch-ready as of 2026-06-28 for a controlled production rollout.

Production:
- URL: `https://safetyhubconnect.vercel.app`
- Deploy source: GitHub `main`
- Hosting: Vercel
- Backend: Supabase Auth, Postgres, Storage, Edge Functions
- Release gate: `npm run release:check`

Current verified posture:
- Real login works in production.
- Protected routes redirect signed-out users to `/login`.
- Platform-admin test login works.
- Core hosted workflows verified: dashboard, admin, drivers, tasks, work orders, training, settings carrier save/reload, driver portal, and broad route rendering.
- Motive is intentionally disabled and must remain a placeholder.
- Production PII encryption uses Supabase Edge crypto.
- Public landing route is isolated from authenticated workspace code for faster first load.

Admin test account:
- Email: `admin@safetyhubconnect.test`
- Password: stored in prior QA notes; do not publish in customer-facing docs.

## Product Scope
The app is a production-oriented hybrid of:
- Fleet operations software: assets, maintenance, inspections, work orders, documents, compliance records
- Safety suite software: driver risk, watchlists, coaching, training, corrective action, FMCSA/CSA visibility
- Enterprise platform tooling: RBAC, tenant isolation, auditability, reporting, admin/customer-ops, release and support runbooks

Definition of functioning:
- Core workflows persist in Supabase without manual DB intervention.
- Tenant isolation and role access are enforced.
- Admin workflows are usable by non-engineers.
- Integrations fail safely.
- Release gates, support runbooks, and rollback paths are documented.

## Architecture
- Frontend: React, Vite, TypeScript
- Routing: React Router
- Auth/session: Supabase Auth
- Data: Supabase Postgres with RLS
- Storage/Edge: Supabase Storage and Edge Functions
- Hosting: Vercel
- Main route surface: `src/App.tsx`, `src/routes/*`, `src/components/Layout/*`
- Domain services: `src/services/*`
- Supabase migrations: `supabase/migrations/*`
- Runbooks: `docs/runbooks/*`, `docs/sprint-54/wave-1-launch-runbook.md`

Important implementation notes:
- `/welcome` is public and should stay lightweight.
- `/login` and all workspace routes lazy-load auth/workspace code.
- `AuthenticatedLayout` owns notification and offline sync providers.
- `src/lib/supabaseConfig.ts` performs environment checks without creating the Supabase client.
- `src/lib/supabase.ts` creates the Supabase client only when auth/data code is loaded.

## Operating Rules
- Deployable work must land on GitHub `main` because Vercel deploys from `main`.
- After each successful sprint, run checks, commit, push, and verify the hosted site.
- Canonical release check: `npm run release:check`.
- Treat any RLS failure, auth regression, or cross-org data exposure as release-blocking.
- Treat route-specific `Failed to fetch` errors as launch-support triage until tied to a known unavailable integration or network condition.
- Keep Motive disabled during Wave 1.
- Keep production PII encryption on Supabase Edge crypto.

## Verification Baseline
Latest verified checks:
- `npm run release:check` passes.
- Build passes.
- Unit tests pass: 248 tests.
- Layout checks pass: 16 Playwright checks.
- Lint exits with documented warnings only.
- Production audit reports 0 high/critical production vulnerabilities.

Latest hosted checks:
- `/welcome` renders with no console errors.
- `/login` renders with no console errors.
- Admin login reaches authenticated dashboard.
- Dashboard shell renders with sidebar, carrier health, notifications, profile, and dashboard content.
- Public entry bundle is roughly `77 kB` gzip after Sprint 56.

Known warning backlog:
- Broad `any` usage remains in services/pages.
- Some React hook dependency warnings remain.
- Some test fixtures have unused variables.
- Some chart tests emit width warnings in jsdom.

## Completed Sprint Summary
- Sprints 1-20: MVP foundations, fleet/safety basics, integration hardening, UAT/hypercare foundations.
- Sprints 21-30: tenant isolation, fleet assets, maintenance/work orders, inspections/compliance, driver safety, training, documents/FMCSA, reporting, admin controls, release hardening.
- Sprints 31-40: watchlist hub, driver timeline, Supabase profile persistence, notifications, global search/error boundaries, live badges, inspection-to-work-order pipeline, telematics hardening, offline/PWA workflows, FMCSA carrier health.
- Sprints 41-48: saved views, bulk operations, driver portal, notification rules, audit/retention, webhooks, pagination/performance, dashboard personalization, onboarding wizard.
- Sprint 49: restored real auth, disabled Motive endpoints, hardened RLS/API/PII posture.
- Sprint 50: mobile navigation/header and contextual load errors.
- Sprint 51: release gate repair, dependency audit, CI scope cleanup.
- Sprint 52: hosted routing, auth, environment verification.
- Sprint 53: hosted critical workflow QA across core fleet and safety workflows.
- Sprint 54: Wave 1 launch runbook and support handoff.
- Sprint 55: org-scoped carrier settings and carrier health cache.
- Sprint 56: public landing performance and auth bundle isolation.

## Current Launch Risks
- Remaining lint warnings are not current release blockers but should be reduced.
- RLS must be watched continuously as new tables/workflows are added.
- Offline workflows are scoped to inspections and work-order transitions/closeout; other live panels can still show backend fetch errors while offline.
- FMCSA/carrier lookup depends on external data availability and should fail with actionable messaging.
- Motive references in historical docs/tests are archival only; no live Motive proxy behavior should return.

## Next Work Queue
1. Execute the browser-based edge-case QA sprints below.
2. Add every discovered issue to the sprint backlog with severity, route, role, reproduction steps, expected behavior, and fix owner.
3. Fix discovered issues in priority order: security/data loss first, core workflow blockers second, UX/recovery issues third, polish last.
4. Continue reducing lint warnings in shared services and long-lived page components.
5. Expand RLS regression checks for every tenant-scoped table.
6. Add stronger monitoring around auth, RLS denials, Edge crypto, carrier-health API, and route-level console errors.

## Edge Case QA Sprint Plan
This plan converts the edge-case inventory into execution sprints. These sprints are planning-complete and should not begin until explicitly ordered.

Testing rule:
- Primary verification must be done in the real browser against the hosted app, matching how an end user uses the platform.
- Do not treat Playwright as the primary evidence for these sprints.
- Automated checks can support release confidence after a browser finding is fixed, but each sprint exit requires manual/browser verification on the deployed site.
- Browser verification must capture route, user role, setup data, action taken, expected result, actual result, console/network errors, and screenshot notes when relevant.

Issue triage:
- `P0`: cross-tenant data exposure, auth bypass, data loss/corruption, secret exposure, production login outage.
- `P1`: core fleet/safety/admin workflow blocked, PII crypto failure, RLS denial on valid workflow, repeatable save/reload failure.
- `P2`: confusing UX, missing recovery messaging, partial workflow failure with workaround, mobile layout issue.
- `P3`: polish, copy, low-risk accessibility or browser-specific issue with workaround.

Backlog handling:
- Every failed edge case becomes an item in `Sprint Issue Backlog` below.
- Fixes must be ordered by severity, then launch workflow importance.
- A sprint is not successful until all P0/P1 findings from that sprint are fixed, committed, pushed to `main`, deployed, and rechecked in the browser.
- P2/P3 findings can roll forward only if documented with owner, impact, and acceptance criteria.

### Sprint 57: Auth, Session, RBAC, and Tenant Isolation Browser QA
Status: Blocked on production Supabase migration and browser access

Goal:
- Prove users can only access the correct routes, roles, and tenant data through normal browser behavior.

Edge-case groups covered:
- Auth and Session Edge Cases
- Authorization and RBAC Edge Cases
- Tenant Isolation and Data Integrity Edge Cases

Browser test roles:
- Signed-out visitor
- Platform admin
- Org admin
- Manager/full user
- Safety user
- Readonly user
- Driver user

Exit checks:
- Signed-out users cannot reach protected routes.
- Driver users are constrained to driver portal behavior.
- Non-admin users cannot reach admin controls.
- Cross-org URL tampering and payload tampering fail safely.
- Valid role changes are reflected after refresh/sign-in.
- No P0/P1 auth, RLS, or tenant-isolation findings remain open.

Progress notes:
- Browser automation through the in-app browser and Chrome extension was unavailable during the first execution attempt; a local Chrome fallback also exited in the container X11 environment before repeatable route evidence could be captured.
- Static RLS review found a P0 profile self-management policy issue and a related app-side driver-role trust issue.
- Repo fix prepared: `20260628002000_harden_profile_self_management.sql` locks self-profile inserts/updates and adds a trigger blocking self-service changes to `role`, `organization_id`, and `status`.
- Repo fix prepared: authenticated route logic now uses profile role `driver`, not user-editable `user_metadata.role`.
- Production migration applied through Supabase Dashboard SQL Editor on project `mnxcorsldepaigilbkju`; Supabase returned success with no rows.
- Do not mark role, tenant-isolation, or data-integrity browser QA complete until the production migration has been applied and verified.

### Sprint 58: Public Landing, Login UX, Navigation, Layout, and Accessibility Browser QA
Status: In progress

Goal:
- Prove the unauthenticated and shell experience is usable across realistic devices and assistive workflows.

Edge-case groups covered:
- Public Landing and Login UX Edge Cases
- Navigation and Layout Edge Cases
- Accessibility Edge Cases
- Browser and Device Edge Cases

Browser test surfaces:
- Desktop Chrome/Edge baseline
- Mobile-width browser verification
- Keyboard-only workflows
- Browser zoom/text scaling checks

Exit checks:
- `/welcome` and `/login` are fast, stable, and recover gracefully.
- Mobile navigation reaches all primary app areas.
- Header, sidebar, modals, and toasts do not block or overlap core workflows.
- Keyboard and screen-reader-facing labels are sufficient for primary forms/actions.
- Authenticated navigation checks may proceed now that Sprint 57's production Supabase migration is applied.
- No P0/P1 layout or access findings remain open.

### Sprint 59: Dashboard, Reporting, Search, Notifications, and Preferences Browser QA
Goal:
- Prove command-center workflows display accurate information and recover cleanly from empty/error states.

Edge-case groups covered:
- Dashboard and Reporting Edge Cases
- Search Edge Cases
- Notifications and Escalations Edge Cases
- Saved Views, Filters, Bulk Actions, and Exports

Browser test surfaces:
- Dashboard
- Reporting
- CSA Predictor
- Hypercare
- Global Search
- Notification panel
- Saved views and CSV exports

Exit checks:
- Empty states are actionable.
- Failed service calls do not break the whole page.
- Search excludes unauthorized data.
- Notifications link to correct records or recovery states.
- Saved views, filters, bulk actions, and exports respect current filters and tenant scope.
- No P0/P1 reporting/search/notification findings remain open.

### Sprint 60: Driver, Driver Portal, Safety, Watchlist, and Coaching Browser QA
Goal:
- Prove driver safety lifecycle workflows work from manager and driver perspectives.

Edge-case groups covered:
- Driver Management Edge Cases
- Driver Portal Edge Cases
- Safety, Watchlist, and Coaching Edge Cases

Browser test surfaces:
- Drivers
- Driver profile
- Driver import
- Driver portal
- Safety
- Watchlist
- Coaching/check-ins

Exit checks:
- Driver create/edit/archive/reload flows persist.
- PII handling works through production Edge crypto.
- Driver portal exposes only the current driver's data.
- Watchlist and coaching actions are role-correct.
- Risk/coaching state changes survive refresh.
- No P0/P1 driver or safety findings remain open.

### Sprint 61: Training, Compliance, Inspections, and Corrective Action Browser QA
Goal:
- Prove training and compliance workflows close the loop from assignment or inspection through remediation.

Edge-case groups covered:
- Training Edge Cases
- Compliance and Inspection Edge Cases

Browser test surfaces:
- Training templates
- Training assignments
- Driver completion/attestation
- Compliance
- Inspections
- Remediation tasks

Exit checks:
- Training assignment and completion persist for admins and drivers.
- Overdue/review states are correct.
- Inspection with violations creates the expected remediation path.
- Offline inspection behavior queues and syncs where supported.
- Compliance exports and filters are tenant-scoped.
- No P0/P1 training/compliance findings remain open.

### Sprint 62: Equipment, Maintenance, PM, Work Orders, and Offline Queue Browser QA
Goal:
- Prove the fleet operations lifecycle works from asset creation through work-order closeout.

Edge-case groups covered:
- Equipment and Asset Edge Cases
- Maintenance and PM Edge Cases
- Work Order Edge Cases
- Offline and PWA Edge Cases

Browser test surfaces:
- Equipment
- Maintenance
- Work Orders
- Inspection-to-work-order flow
- Offline banner and pending sync

Exit checks:
- Equipment create/edit/archive/reload flows persist.
- PM and maintenance records link correctly.
- Work-order status transitions enforce role and state rules.
- Closeout notes and costs persist after refresh.
- Supported offline actions queue and sync correctly.
- No P0/P1 fleet operations findings remain open.

### Sprint 63: Documents, FMCSA, Carrier Health, API, and Integration Browser QA
Goal:
- Prove document/storage and external-data workflows fail safely and remain tenant-safe.

Edge-case groups covered:
- Documents and Storage Edge Cases
- FMCSA and Carrier Health Edge Cases
- API, Edge Function, and Integration Edge Cases

Browser test surfaces:
- Documents
- FMCSA
- Carrier Health widget
- Settings carrier configuration
- Disabled Motive endpoints
- Email/integration health flows where exposed

Exit checks:
- Document upload/download/archive paths work or fail with actionable messages.
- Carrier settings save/reload remains org-scoped.
- FMCSA lookup handles invalid, timeout, empty, and high-risk responses.
- Motive endpoints and UI remain disabled placeholders.
- API errors do not leak secrets.
- No P0/P1 document/integration findings remain open.

### Sprint 64: Admin, Customer Operations, Audit, Retention, Webhooks, and Launch Recovery Browser QA
Goal:
- Prove admin/customer-ops workflows are safe enough for non-engineers and launch support.

Edge-case groups covered:
- Admin and Customer Operations Edge Cases
- Data Quality and Migration Edge Cases
- Launch, Monitoring, and Recovery Edge Cases

Browser test surfaces:
- Admin Dashboard
- Users/org settings
- Audit logs
- Retention
- Support tickets
- Webhooks/integration health
- Launch and rollback runbook checks

Exit checks:
- Admin mutations are role-gated and auditable.
- Audit/report exports work.
- Retention actions are safe and reversible where intended.
- Support tickets and webhook panels handle failures.
- Migration/legacy-data issues have documented repair paths.
- No P0/P1 admin/ops findings remain open.

### Sprint 65: Security, Abuse, Performance, Scale, and Final Regression Browser QA
Goal:
- Stress the full hosted product for malicious input, scale behavior, and final Wave 1 readiness.

Edge-case groups covered:
- Security and Abuse Edge Cases
- Performance and Scale Edge Cases
- Any rolled-forward P2/P3 findings from Sprints 57-64

Browser test surfaces:
- All high-traffic pages
- All mutation-heavy forms
- CSV exports
- Large list views
- Route navigation across lazy chunks

Exit checks:
- XSS-like input renders safely.
- CSV exports are protected against formula injection.
- Secrets do not appear in client-visible output.
- Large lists remain usable with pagination/filtering.
- Final browser smoke pass covers all primary routes.
- No open P0/P1 findings remain.
- P2/P3 backlog is reviewed and accepted or scheduled.

## Sprint Issue Backlog
Use this table once browser QA begins.

| ID | Sprint Found | Severity | Route/Area | Role | Edge Case | Actual Result | Expected Result | Fix Sprint | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S57-001 | 57 | P0 | Supabase `profiles` RLS / AuthZ | Authenticated user | User attempts a direct Supabase write not allowed by UI; user tampers with request payload `organization_id` or `role` | Existing policy `Users can manage own profile` authorizes all self profile mutations with only `id = auth.uid()`, allowing self-service role/org/status writes by policy shape | Users may edit safe profile fields only; only authorized admin workflows can change role, org, or status | 57 | Fixed in repo and production migration applied through Supabase Dashboard SQL Editor |
| S57-002 | 57 | P1 | Protected route driver role check | Authenticated user | User metadata role conflicts with profile role; driver-role user attempts to access full dashboard | Route guard trusted `user.user_metadata.role === 'driver'`, which is user-editable metadata and unsafe for authorization | Route guard must use canonical profile role from `profiles.role` | 57 | Fixed in repo and pushed to `main` |
| S57-003 | 58 | P1 | AuthContext role resolution | Authenticated user | User metadata role conflicts with profile role; user metadata says `platform_admin` | AuthContext still elevated platform admin from user-editable metadata | AuthContext must derive admin from trusted profile data or explicit admin allowlist only | 58 | Fixed in repo; build/focused tests passed; pending push |
| S58-001 | 58 | P2 | Login password recovery | Signed-out visitor | User clicks Forgot your password after entering an email | Link used `href="#"` and did not start a recovery flow | Send Supabase reset email or remove the control until recovery is available | 58 | Fixed and browser-verified locally; pending push |
| S58-002 | 58 | P2 | Login/signup mode switch | Signed-out visitor | Invalid login fails, then user switches to create account | Stale invalid-login toast and entered password carry into signup mode | Switching modes should clear stale auth feedback and password-only fields | 58 | Fixed and browser-verified locally; pending push |

## Edge Case Inventory
Use this section as the source pool for later QA scenarios. Each item should eventually become one or more test cases with role, setup data, action, expected result, and severity.

### Auth and Session Edge Cases
- User opens `/` while signed out.
- User opens `/dashboard` while signed out.
- User opens `/admin` while signed out.
- User opens `/driver-portal` while signed out.
- User opens a deep route such as `/drivers/:id` while signed out.
- User signs in with valid platform-admin credentials.
- User signs in with valid org-admin credentials.
- User signs in with valid manager credentials.
- User signs in with valid safety-only credentials.
- User signs in with valid readonly credentials.
- User signs in with valid driver credentials.
- User signs in with wrong password.
- User signs in with unknown email.
- User signs in with malformed email.
- User submits an empty login form.
- User double-clicks the sign-in button.
- User signs out from the dashboard.
- User signs out and presses browser Back.
- User refreshes immediately after sign-in.
- User refreshes on a protected deep route.
- User returns after the Supabase session expires.
- User has a valid Supabase session but missing profile row.
- User has a profile row with missing `organization_id`.
- User has a profile role not recognized by the app.
- User metadata role conflicts with profile role.
- Platform-admin email override conflicts with profile role.
- Supabase Auth is reachable but profile query times out.
- Supabase Auth is temporarily unavailable.
- Network drops during login submit.
- Browser blocks localStorage/session storage.
- Multiple app tabs sign in and sign out independently.
- User changes password in another session.
- User is deleted or disabled while still holding an active session.
- User attempts sign-up with an existing email.
- User attempts sign-up with weak password.
- User receives email verification but profile is not created.
- User lands on `/login` while already signed in.
- Driver-role user attempts to access full dashboard.
- Non-driver user attempts to access driver portal.

### Authorization and RBAC Edge Cases
- Readonly user tries to create a driver.
- Readonly user tries to edit a driver.
- Readonly user tries to archive equipment.
- Readonly user tries to create a work order.
- Readonly user tries to close a work order.
- Readonly user tries to assign training.
- Readonly user tries to create a notification rule.
- Readonly user tries to access Admin Dashboard.
- Safety role tries to perform fleet-admin-only actions.
- Fleet role tries to perform safety-manager-only actions.
- Org admin tries to access platform-admin-only controls.
- Driver role tries to access admin route.
- Driver role tries to access another driver's record.
- User attempts a direct API/Supabase write not allowed by UI.
- User tampers with request payload `organization_id`.
- User tampers with route params to access another org's records.
- User opens a stale page after role is downgraded.
- User opens a stale page after role is upgraded.
- Permission changes while user has a modal open.
- Admin invites a user with no role selected.
- Admin assigns an invalid role.
- Admin removes their own platform-admin access.
- Last org admin is downgraded or disabled.
- Platform admin switches between organizations.
- Support user views audit logs without mutation permissions.

### Tenant Isolation and Data Integrity Edge Cases
- Two organizations create drivers with the same email.
- Two organizations create equipment with the same unit number.
- Two organizations save the same DOT number.
- Two organizations cache carrier health for the same DOT.
- Two organizations create tasks with identical titles.
- User from Org A tries to view Org B driver detail by URL.
- User from Org A tries to update Org B work order by ID.
- User from Org A tries to download Org B document.
- User from Org A tries to view Org B audit log.
- User from Org A tries to load Org B notification rule.
- Saved views are scoped to user and organization.
- Dashboard preferences do not leak between users.
- Notification counts do not include another org's records.
- Search results do not include another org's records.
- CSV exports include only current org data.
- Bulk operations affect only selected current org rows.
- RLS rejects rows with missing `organization_id`.
- RLS rejects rows with mismatched `organization_id`.
- Inserts without org context fail safely or are auto-scoped.
- Legacy records with null org are hidden or repairable.
- Archived records remain tenant-scoped.
- Deleted/deactivated users cannot retain data access.

### Public Landing and Login UX Edge Cases
- `/welcome` loads on a cold browser cache.
- `/welcome` loads on slow 3G.
- `/welcome` loads with JavaScript disabled enough to show shell fallback.
- `/welcome` loads with Supabase unreachable.
- `/welcome` does not initialize authenticated workspace services.
- `/welcome` CTA links navigate to `/login`.
- `/welcome` renders correctly at 320px width.
- `/welcome` renders correctly at 390px width.
- `/welcome` renders correctly at tablet width.
- `/welcome` renders correctly at desktop width.
- `/login` can navigate back to `/welcome`.
- Login right-side image fails to load.
- Login page works with password managers.
- Login form works with Enter key.
- Login form shows recoverable error copy.
- Login spinner clears after failed auth.
- User clicks forgot password placeholder.
- User toggles sign-up and back to sign-in.
- User starts sign-up then navigates away.

### Navigation and Layout Edge Cases
- Mobile drawer opens and closes.
- Mobile drawer route click closes drawer.
- Mobile drawer works after route navigation.
- Sidebar badge counts update after notification refresh.
- Header search opens on desktop.
- Header search opens on mobile.
- Header title does not overlap at 320px.
- Header title does not overlap at 390px.
- Header title does not overlap at 768px.
- Header controls remain reachable with long user name.
- Sidebar handles long org/user names.
- Active route highlight matches current route.
- Unknown route redirects safely.
- Browser Back/Forward works across lazy routes.
- Stale chunk after deployment triggers one-time reload.
- Error boundary catches page render crash.
- Error boundary reload button works.
- Error boundary dashboard button works.
- Long modal content scrolls inside viewport.
- Toast overlays do not block key navigation controls.
- App works with browser zoom at 125%.
- App works with browser zoom at 200%.
- App works in landscape mobile orientation.

### Dashboard and Reporting Edge Cases
- Dashboard loads with no drivers.
- Dashboard loads with no equipment.
- Dashboard loads with no tasks.
- Dashboard loads with no training records.
- Dashboard loads with no compliance records.
- Dashboard loads when one service call fails.
- Dashboard refresh button handles concurrent clicks.
- Dashboard widget order persists.
- Dashboard hidden widgets persist.
- Dashboard reset restores defaults.
- Dashboard role defaults differ by role.
- Dashboard charts handle zero values.
- Dashboard charts handle very large values.
- Dashboard charts handle missing dates.
- Reporting page loads with empty datasets.
- Reporting date filters cross year boundary.
- Reporting handles invalid date range.
- Reporting CSV export has correct filtered rows.
- CSA Predictor loads with no FMCSA snapshot.
- CSA Predictor loads after FMCSA snapshot import.
- Hypercare page loads with no launch blockers.
- Hypercare page loads with active P0/P1 blockers.
- Saved reporting preferences are user-scoped.

### Search Edge Cases
- Search opens with keyboard shortcut.
- Search returns drivers by name.
- Search returns tasks by title.
- Search returns equipment by unit number.
- Search returns documents by title.
- Search returns no results with actionable empty state.
- Search handles special characters.
- Search handles very long query.
- Search handles rapid typing.
- Search result click navigates correctly.
- Search excludes unauthorized records.
- Search closes on Escape.
- Search is usable on mobile.

### Driver Management Edge Cases
- Create driver with required fields only.
- Create driver with all fields.
- Create driver with duplicate email.
- Create driver with duplicate license number.
- Create driver with invalid email.
- Create driver with expired CDL.
- Create driver with expired medical card.
- Create driver with future hire date.
- Create driver with termination date before hire date.
- Create driver when Edge PII crypto is unavailable.
- Create driver while network drops mid-submit.
- Edit driver profile.
- Edit driver license fields.
- Edit driver medical fields.
- Archive/deactivate driver.
- Reactivate driver.
- Driver profile loads missing documents.
- Driver profile loads missing training assignments.
- Driver profile loads missing risk history.
- Driver profile tabs preserve route/state.
- Add coaching plan to driver.
- Add safety event to driver.
- Driver risk score recalculates after new event.
- Driver risk score handles missing external baseline.
- Driver risk score handles extreme local event volume.
- Driver import CSV has valid rows only.
- Driver import CSV has partial invalid rows.
- Driver import CSV has duplicate rows.
- Driver import CSV has unknown columns.
- Driver import CSV is empty.
- Driver import CSV is too large.
- Bulk add drivers to watchlist.
- Bulk operation partially fails.

### Driver Portal Edge Cases
- Driver user lands directly on `/driver-portal`.
- Driver sees only their own risk/training/coaching.
- Driver with no linked driver record sees recovery state.
- Driver with no training sees empty state.
- Driver with overdue training sees urgency.
- Driver marks training complete.
- Driver double-clicks mark complete.
- Driver acknowledges coaching.
- Driver double-clicks acknowledge.
- Driver refreshes after completion.
- Driver portal works at 320px width.
- Driver portal works offline for read-only display if cached.
- Non-driver user is redirected away from driver portal.

### Safety, Watchlist, and Coaching Edge Cases
- Safety page loads with no risk events.
- Safety page loads with high-risk drivers only.
- Safety page logs a new risk event.
- Safety page rejects invalid severity.
- Safety page rejects missing driver.
- Watchlist adds driver manually.
- Watchlist removes driver.
- Watchlist coach action opens modal.
- Watchlist dismiss action requires reason.
- Watchlist handles driver already on watchlist.
- Watchlist handles stale driver ID.
- Coaching plan created from risk event.
- Coaching plan created from watchlist.
- Coaching plan check-in added.
- Coaching plan closed with outcome.
- Coaching overdue check-in triggers notification.
- Coaching closeout requires notes.
- Safety role can coach but readonly cannot.
- Driver can acknowledge assigned coaching.
- Risk score history handles duplicate timestamps.
- Intervention queue handles missing owner.

### Training Edge Cases
- Create training template.
- Create duplicate training template name.
- Edit training template.
- Archive training template.
- Assign training to one driver.
- Assign training to many drivers.
- Assign training with due date in past.
- Assign training with due date today.
- Assign training with due date far future.
- Assign training to inactive driver.
- Assign training to missing driver.
- Complete training as admin.
- Complete training as driver.
- Complete already completed training.
- Mark training overdue.
- Reopen completed training.
- Training completion requires attestation when configured.
- Training manager review required.
- Training manager review rejected.
- Training linked to safety event.
- Training linked to coaching plan.
- Training linked to compliance corrective action.
- Training notification rule fires.
- Training list filters Active/Completed/Overdue correctly.
- Training persists after reload.

### Compliance and Inspection Edge Cases
- Create inspection with no violations.
- Create inspection with violations.
- Create inspection marked out-of-service.
- Create inspection with malformed violation data.
- Create inspection while offline.
- Offline inspection queues locally.
- Queued inspection syncs when online.
- Queued inspection creates follow-up work order when needed.
- Inspection sync partially fails.
- Inspection duplicate submission is handled.
- Inspection remediation task is created.
- Remediation due date is overdue.
- Compliance item expires today.
- Compliance item expired yesterday.
- Compliance item has missing owner.
- Compliance item has invalid date.
- Compliance dashboard handles empty records.
- OOS equipment blocks assignment/use.
- OOS status clears after remediation.
- Compliance export includes current filters.
- Compliance export excludes unauthorized org data.

### Equipment and Asset Edge Cases
- Create equipment with required fields only.
- Create equipment with all lifecycle fields.
- Create equipment with duplicate unit number.
- Create equipment with invalid VIN.
- Create equipment with very long unit number.
- Create equipment with missing organization context.
- Edit equipment lifecycle status.
- Retire equipment.
- Reactivate equipment.
- Archive equipment.
- Equipment detail loads related inspections.
- Equipment detail loads related work orders.
- Equipment detail loads related documents.
- Equipment with no related records shows empty states.
- Equipment PM due date is in the past.
- Equipment PM due date is today.
- Equipment odometer decreases unexpectedly.
- Equipment odometer is extremely high.
- Equipment assignment points to inactive driver.
- Equipment list pagination handles last page.
- Equipment filters combine status/type/search.
- Equipment CSV export respects filters.
- Equipment bulk action partially fails.

### Maintenance and PM Edge Cases
- Create preventive maintenance schedule.
- Create schedule with missing interval.
- Create schedule with zero interval.
- Create schedule with very large interval.
- Generate due PM from mileage.
- Generate due PM from date.
- Generate due PM when both mileage and date are due.
- Generate PM for retired equipment.
- Duplicate PM generation is prevented.
- Maintenance record links to work order.
- Maintenance record links to equipment.
- Maintenance cost is zero.
- Maintenance cost is negative.
- Maintenance cost is very large.
- Maintenance notes are very long.
- Maintenance list filters by due/overdue/completed.
- Maintenance service history sorts correctly.

### Work Order Edge Cases
- Create work order manually.
- Create work order from inspection.
- Create work order from PM.
- Create work order with no assigned technician.
- Create work order with invalid equipment ID.
- Create work order with inactive equipment.
- Create work order with very long title.
- Create work order with due date in past.
- Approve work order.
- Start work order.
- Complete work order.
- Close work order with closeout notes.
- Close work order without closeout notes.
- Try invalid status transition.
- Try status transition with readonly role.
- Try status transition with stale role.
- Double-click status transition.
- Work order line item add/edit/delete.
- Work order parts cost calculation.
- Work order labor cost calculation.
- Work order total cost handles decimals.
- Work order closeout persists after reload.
- Work order offline transition queues.
- Work order offline closeout queues.
- Queued work order action syncs after reconnect.
- Queued work order conflict with server update.
- Work order pagination handles last page.
- Work order search finds newly created record.

### Documents and Storage Edge Cases
- Upload driver document.
- Upload equipment document.
- Upload compliance document.
- Upload unsupported file type.
- Upload file larger than allowed limit.
- Upload zero-byte file.
- Upload file with duplicate name.
- Upload file with special characters in name.
- Upload while network drops.
- Upload succeeds but metadata insert fails.
- Metadata insert succeeds but storage upload fails.
- Download document.
- Download missing storage object.
- Delete/archive document.
- Document expires today.
- Document expired yesterday.
- Document renewal updates expiration.
- Document attached to inactive driver.
- Document attached to retired equipment.
- Document search and filters combine correctly.
- Document CSV export respects filters.
- Document access denied across orgs.

### FMCSA and Carrier Health Edge Cases
- Save carrier settings with valid DOT.
- Save carrier settings with invalid DOT.
- Save carrier settings with blank company name.
- Save carrier settings with legacy `default` row.
- Reload carrier settings after save.
- Carrier settings RLS denies wrong org.
- Lookup carrier health with valid DOT.
- Lookup carrier health with invalid DOT.
- Lookup carrier health with no network.
- Lookup carrier health when external source times out.
- Lookup carrier health returns unexpected HTML shape.
- Lookup carrier health returns no inspections.
- Lookup carrier health returns no crashes.
- Lookup carrier health returns high OOS rate.
- Carrier health cache hit.
- Carrier health cache miss.
- Carrier health cache collision across orgs.
- Carrier health cache expires.
- FMCSA widget handles missing DOT.
- FMCSA widget handles missing carrier settings.
- CSA predictor seeds from carrier snapshot.
- CSA predictor handles stale carrier snapshot.

### Notifications and Escalations Edge Cases
- Notification list loads with no items.
- Notification list loads with many items.
- Notification badge counts update.
- Mark all notifications read.
- Notification refresh fails silently.
- Notification polling stops after sign-out.
- Notification rules create/edit/delete.
- Notification rule threshold is invalid.
- Notification rule duplicate type exists.
- Notification preference toggles persist.
- Email digest preference persists.
- Overdue task escalation fires.
- Overdue coaching check-in escalation fires.
- Expiring document notification fires.
- Unreviewed training notification fires.
- Notification links navigate correctly.
- Notification links to deleted record show recovery state.
- Notifications remain org-scoped.

### Admin and Customer Operations Edge Cases
- Admin Dashboard loads all tabs.
- Users tab loads with no users.
- Users tab loads many users.
- Invite user succeeds.
- Invite user email already exists.
- Invite user invalid email.
- Update user role.
- Disable user.
- Re-enable user.
- Organization settings save.
- Organization settings validation fails.
- Audit logs load empty.
- Audit logs filter by entity.
- Audit logs filter by date range.
- Audit report CSV export.
- Retention candidates load empty.
- Retention candidates bulk archive.
- Retention bulk archive partially fails.
- Support ticket create.
- Support ticket status update.
- Support ticket assignment.
- Webhook registration create/edit/delete.
- Webhook test delivery succeeds.
- Webhook test delivery fails.
- Webhook delivery log loads many rows.
- Integration health endpoint unavailable.

### Saved Views, Filters, Bulk Actions, and Exports
- Save view with default filters.
- Save view with complex filters.
- Save view duplicate name.
- Load saved view.
- Delete saved view.
- Delete currently active saved view.
- Saved view persistence fails and fallback works.
- Filter by status only.
- Filter by owner only.
- Filter by date only.
- Filter by search plus status.
- Pagination after filter change resets correctly.
- Bulk select all visible rows.
- Bulk select across pages.
- Bulk action with no selected rows.
- Bulk action with stale selected row.
- Bulk action partial failure reports correctly.
- CSV export with no rows.
- CSV export with special characters.
- CSV export with large row count.
- CSV export respects role and tenant scope.

### Offline and PWA Edge Cases
- App loads while offline after prior visit.
- App loads offline with no prior cache.
- Offline banner appears.
- Pending sync count updates.
- Manual sync button works.
- Manual sync while still offline shows message.
- Browser goes offline during form submit.
- Browser comes online after queued actions.
- Queue flush succeeds.
- Queue flush partially fails.
- Queue item references deleted record.
- Queue item conflicts with server-updated record.
- IndexedDB unavailable.
- IndexedDB quota exceeded.
- Service worker stale cache after deploy.
- Service worker update with open app tab.
- Offline queue persists after browser restart.
- Offline queue clears after successful sync.

### API, Edge Function, and Integration Edge Cases
- `/api/carrier-health` validates required params.
- `/api/carrier-health` rate limits excessive requests.
- `/api/carrier-health` handles upstream timeout.
- `/api/integrations/health` requires valid auth.
- `/api/send-email` rejects missing JWT.
- `/api/send-email` rejects invalid JWT.
- `/api/send-email` validates payload.
- `/api/motive/drivers` returns disabled placeholder.
- `/api/motive/scores` returns disabled placeholder.
- `/api/motive/events` returns disabled placeholder.
- API route handles unsupported method.
- API route returns JSON error shape.
- API route does not leak secrets in errors.
- Edge crypto encrypts PII.
- Edge crypto decrypts PII.
- Edge crypto unavailable fails closed in production.
- Edge crypto secret missing fails closed.
- Edge function deployment version mismatch.

### Security and Abuse Edge Cases
- XSS payload in driver name.
- XSS payload in equipment unit number.
- XSS payload in work order title.
- XSS payload in notes fields.
- CSV formula injection in exports.
- Extremely long text inputs.
- Unicode and emoji in names/notes.
- SQL-like payload in search.
- Script tag in uploaded file name.
- Malicious file MIME mismatch.
- User tampers with localStorage auth data.
- User tampers with saved dashboard preferences.
- User tampers with offline queue payload.
- User repeatedly submits mutation forms.
- Rate limit exceeded on public APIs.
- Secrets do not appear in client bundle.
- Vite env variables do not expose server-only keys.
- Error pages do not leak stack traces in production.
- Audit log records critical mutations.
- Audit log captures actor and org.

### Performance and Scale Edge Cases
- 0 drivers.
- 1 driver.
- 500 drivers.
- 5,000 drivers.
- 0 equipment records.
- 1,000 equipment records.
- 10,000 tasks.
- 10,000 audit log rows.
- Notification panel with 500 notifications.
- Search with large datasets.
- Dashboard load with many chart points.
- Work order list pagination under load.
- Driver list pagination under load.
- Equipment list pagination under load.
- Slow Supabase query.
- Slow external carrier lookup.
- Large CSV export.
- Repeated route navigation across lazy chunks.
- Cold browser cache.
- Warm browser cache.
- Slow mobile CPU.
- Low-memory mobile browser.

### Data Quality and Migration Edge Cases
- Legacy rows with null org.
- Legacy carrier settings with `id = default`.
- Legacy drivers with `motive_id`.
- Historical docs still mention Motive.
- Missing foreign key target.
- Orphaned tasks.
- Orphaned work orders.
- Orphaned documents.
- Duplicate audit log entries.
- Duplicate notification rules.
- Invalid enum-like status from old data.
- Date stored in unexpected format.
- Timestamp timezone boundary.
- Daylight saving transition.
- Leap day dates.
- Year-end date range.
- Migration partially applied.
- Migration rerun idempotently.
- Seed data collides with production data.

### Accessibility Edge Cases
- Keyboard-only login.
- Keyboard-only mobile navigation.
- Keyboard-only modal close.
- Focus returns after modal closes.
- Focus trap in long modal.
- Screen reader labels on form fields.
- Screen reader labels on icon buttons.
- Color contrast on status badges.
- Error messages announced near fields.
- Toasts do not hide essential state.
- Tables have readable headings.
- Links have unique names.
- Buttons have unique names.
- Reduced motion preference.
- High contrast mode.
- Browser text scaling.

### Browser and Device Edge Cases
- Latest Chrome desktop.
- Latest Edge desktop.
- Latest Safari desktop.
- Latest Firefox desktop.
- iOS Safari.
- Android Chrome.
- Private/incognito mode.
- Third-party cookies restricted.
- Storage disabled.
- Pop-up/download restrictions.
- Corporate proxy modifies requests.
- VPN/high-latency network.
- Browser Back during save.
- Browser refresh during save.
- Tab closed during save.
- Multiple tabs editing same record.
- Multiple users editing same record.

### Launch, Monitoring, and Recovery Edge Cases
- Vercel deploy succeeds but alias not updated.
- Vercel deploy serves stale chunk.
- Supabase outage during business hours.
- Supabase Auth outage only.
- Supabase Edge Function outage only.
- Storage outage only.
- FMCSA upstream outage.
- Email provider outage.
- Rollback to previous Vercel deployment.
- Rollback while users have active sessions.
- New migration needs rollback.
- Support user reproduces customer issue.
- Customer reports route-specific console error.
- Customer reports RLS/permission error.
- Customer reports missing data after import.
- Customer reports slow landing page.
- Customer reports failed offline sync.

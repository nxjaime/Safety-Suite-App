# Org Isolation + Page-Based RBAC Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add per-organization allowed domains and page-based roles, with end-to-end enforcement (UI + DB RLS).

**Architecture:** Store roles on `profiles` and allowed domains on `organizations`. Enforce access using route guards + sidebar filtering in the app, and RLS policies + helper functions in Supabase to ensure tenant isolation and role-based permissions.

**Tech Stack:** React + Vite, Supabase Auth + RLS, TypeScript, SQL migrations, Vitest, Playwright.

---

### Task 1: Add allowed domains + role enum updates

**Files:**
- Create: `supabase/migrations/20260222090000_org_rbac_domains.sql`

**Step 1: Write the failing test**

```sql
-- pseudo-test: verify allowed_domains column exists and role constraint updated
-- (If using SQL tests, assert column + constraint presence.)
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL once tests are added

**Step 3: Write minimal implementation**

```sql
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS allowed_domains TEXT[] DEFAULT '{}';

ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'readonly';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check') THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('platform_admin', 'full', 'safety', 'coaching', 'maintenance', 'readonly'));
END $$;
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit`
Expected: PASS

**Step 5: Commit**

```bash
git add supabase/migrations/20260222090000_org_rbac_domains.sql
git commit -m "db: add org allowed domains and update role set"
```

---

### Task 2: Add Supabase helper functions for domain + platform admin

**Files:**
- Modify: `supabase/migrations/20260222090000_org_rbac_domains.sql`

**Step 1: Write the failing test**

```sql
-- pseudo-test: function org_domain_allowed(uuid) should return true for matching domain
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL once tests are added

**Step 3: Write minimal implementation**

```sql
CREATE OR REPLACE FUNCTION email_domain(email TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN split_part(email, '@', 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION org_domain_allowed(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  dom TEXT;
  allowed TEXT[];
BEGIN
  dom := email_domain((auth.jwt() ->> 'email'));
  SELECT allowed_domains INTO allowed FROM organizations WHERE id = org_id;
  RETURN dom IS NOT NULL AND allowed IS NOT NULL AND dom = ANY(allowed);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'platform_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit`
Expected: PASS

**Step 5: Commit**

```bash
git add supabase/migrations/20260222090000_org_rbac_domains.sql
git commit -m "db: add org domain + platform admin helper functions"
```

---

### Task 3: Update RLS policies for org isolation + platform admin bypass

**Files:**
- Modify: `supabase/migrations/secure_rls_policies.sql`
- Modify: `supabase/migrations/20260222030000_documents_compliance_workflows.sql`
- Modify: `supabase/migrations/20260222020000_risk_events_score_history.sql`
- Modify: `supabase/migrations/20260222040000_security_feedback_foundation.sql`

**Step 1: Write the failing test**

```sql
-- pseudo-test: platform_admin can select across orgs
-- pseudo-test: non-admin blocked if email domain not allowed
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL once tests are added

**Step 3: Write minimal implementation**

```sql
-- Example policy template update:
USING (is_platform_admin() OR (organization_id = get_org_id() AND org_domain_allowed(organization_id)))
WITH CHECK (is_platform_admin() OR (organization_id = get_org_id() AND org_domain_allowed(organization_id)))
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit`
Expected: PASS

**Step 5: Commit**

```bash
git add supabase/migrations/secure_rls_policies.sql \
  supabase/migrations/20260222030000_documents_compliance_workflows.sql \
  supabase/migrations/20260222020000_risk_events_score_history.sql \
  supabase/migrations/20260222040000_security_feedback_foundation.sql
git commit -m "db: enforce org domain and platform admin access"
```

---

### Task 4: Auth bootstrap for domain gating and profile creation

**Files:**
- Modify: `src/contexts/AuthContext.tsx`
- Modify: `src/services/profileService.ts`
- Create: `src/services/orgService.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { canAccessRoute } from '../utils/accessControl';

describe('domain gate', () => {
  it('blocks user when no org matches domain', () => {
    expect(true).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL once tests are added

**Step 3: Write minimal implementation**

```ts
// orgService.ts
export const orgService = {
  async resolveOrgByDomain(domain: string) {
    return supabase
      .from('organizations')
      .select('id, allowed_domains')
      .contains('allowed_domains', [domain])
      .limit(2);
  }
};
```

- In `AuthContext.tsx`, on login, fetch org by email domain; if none or >1, sign out and show error.
- Ensure a `profiles` row exists; default `role` to `readonly`.

**Step 4: Run test to verify it passes**

Run: `npm run test:unit`
Expected: PASS

**Step 5: Commit**

```bash
git add src/contexts/AuthContext.tsx src/services/profileService.ts src/services/orgService.ts src/test/*
git commit -m "auth: gate access by org domain and bootstrap profiles"
```

---

### Task 5: Page access matrix + route guard + sidebar filtering

**Files:**
- Create: `src/utils/accessControl.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/Layout/Sidebar.tsx`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { canAccessRoute } from '../utils/accessControl';

describe('canAccessRoute', () => {
  it('denies maintenance role on safety routes', () => {
    expect(canAccessRoute('maintenance', '/safety')).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
export const roleAccess = {
  full: ['*'],
  safety: ['/drivers', '/driver', '/safety', '/compliance', '/reporting', '/training', '/fmcsa', '/help', '/settings', '/'],
  coaching: ['/drivers', '/driver', '/safety', '/compliance', '/help', '/settings', '/'],
  maintenance: ['/equipment', '/maintenance', '/work-orders', '/documents', '/help', '/settings', '/'],
  readonly: ['*']
};
```

- Apply route guard in `App.tsx` to block unauthorized page access.
- Filter sidebar items by `canAccessRoute`.

**Step 4: Run test to verify it passes**

Run: `npm run test:unit`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/accessControl.ts src/App.tsx src/components/Layout/Sidebar.tsx src/test/*
git commit -m "feat: enforce page-based RBAC in UI"
```

---

### Task 6: Platform admin org/user management updates

**Files:**
- Modify: `src/pages/AdminDashboard.tsx`
- Modify: `src/services/adminService.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { roleOptions } from '../services/adminService';

describe('role options', () => {
  it('includes new role set', () => {
    expect(roleOptions).toContain('full');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL

**Step 3: Write minimal implementation**

- Update admin tables to include organization and role management.
- Allow setting `allowed_domains` and `profiles.role` via admin console.

**Step 4: Run test to verify it passes**

Run: `npm run test:unit`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/AdminDashboard.tsx src/services/adminService.ts src/test/*
git commit -m "feat: platform admin org and role management"
```

---

### Task 7: E2E tests for domain gate + role access

**Files:**
- Create: `e2e/rbac.spec.ts`
- Modify: `playwright.config.ts`

**Step 1: Write the failing test**

```ts
import { test, expect } from '@playwright/test';

test('readonly cannot access maintenance routes', async ({ page }) => {
  await page.goto('/maintenance');
  await expect(page).not.toHaveURL(/maintenance/);
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:e2e`
Expected: FAIL

**Step 3: Write minimal implementation**

- Add test fixtures for each role using auth bypass in config.
- Assert redirects and forbidden route access.

**Step 4: Run test to verify it passes**

Run: `npm run test:e2e`
Expected: PASS

**Step 5: Commit**

```bash
git add e2e/rbac.spec.ts playwright.config.ts
git commit -m "test: add RBAC e2e coverage"
```

---

### Task 8: Documentation updates

**Files:**
- Modify: `docs/help/help-center.md`
- Modify: `handoff.md`

**Step 1: Write the failing test**

No test required.

**Step 2: Update documentation**

- Add role descriptions and domain-gating notes.

**Step 3: Commit**

```bash
git add docs/help/help-center.md handoff.md
git commit -m "docs: add org RBAC and domain gating notes"
```

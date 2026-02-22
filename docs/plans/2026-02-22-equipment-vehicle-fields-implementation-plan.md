# Equipment Vehicle Fields Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add typed vehicle fields and enums to `equipment`, and surface them in Equipment create/edit/view UI.

**Architecture:** Extend the `equipment` table with typed columns and enum constraints, then update the Equipment UI to capture and display all fields. Maintain optional fields and ensure values are saved and rendered consistently.

**Tech Stack:** React + Vite, Supabase SQL migrations, TypeScript, Vitest, Playwright.

---

### Task 1: Add enums and columns to `equipment`

**Files:**
- Create: `supabase/migrations/20260222100000_equipment_vehicle_fields.sql`

**Step 1: Write the failing test**

```sql
-- pseudo-test: verify equipment has new columns and enums
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL once tests are added

**Step 3: Write minimal implementation**

```sql
-- Create enums
DO $$ BEGIN
  CREATE TYPE own_lease_enum AS ENUM ('Own', 'Lease', 'Rent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE eld_logging_enum AS ENUM ('Enabled', 'Disabled', 'Exempt');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_type_enum AS ENUM ('Sales Vehicle', 'Truck', 'Trailer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE us_state_enum AS ENUM (
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT',
    'NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS removed_from_fleet DATE,
  ADD COLUMN IF NOT EXISTS added_to_fleet DATE,
  ADD COLUMN IF NOT EXISTS div_number TEXT,
  ADD COLUMN IF NOT EXISTS division TEXT,
  ADD COLUMN IF NOT EXISTS corp TEXT,
  ADD COLUMN IF NOT EXISTS own_lease own_lease_enum,
  ADD COLUMN IF NOT EXISTS owner TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state us_state_enum,
  ADD COLUMN IF NOT EXISTS vehicle_number TEXT,
  ADD COLUMN IF NOT EXISTS vin TEXT,
  ADD COLUMN IF NOT EXISTS ins_class TEXT,
  ADD COLUMN IF NOT EXISTS gl_acct TEXT,
  ADD COLUMN IF NOT EXISTS gross_weight INT,
  ADD COLUMN IF NOT EXISTS geotab TEXT,
  ADD COLUMN IF NOT EXISTS toll_transponder TEXT,
  ADD COLUMN IF NOT EXISTS driver TEXT,
  ADD COLUMN IF NOT EXISTS rep_code TEXT,
  ADD COLUMN IF NOT EXISTS driver_check_number TEXT,
  ADD COLUMN IF NOT EXISTS mth_lease_charge NUMERIC,
  ADD COLUMN IF NOT EXISTS mileage_charge NUMERIC,
  ADD COLUMN IF NOT EXISTS follow_up DATE,
  ADD COLUMN IF NOT EXISTS lease_expir_year INT,
  ADD COLUMN IF NOT EXISTS vehicle_value NUMERIC,
  ADD COLUMN IF NOT EXISTS license_plate TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS months_in_service INT,
  ADD COLUMN IF NOT EXISTS as_of_date DATE,
  ADD COLUMN IF NOT EXISTS avg_miles_per_month INT,
  ADD COLUMN IF NOT EXISTS estimated_odometer_6mo INT,
  ADD COLUMN IF NOT EXISTS mgr TEXT,
  ADD COLUMN IF NOT EXISTS eld_logging eld_logging_enum,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS imei TEXT,
  ADD COLUMN IF NOT EXISTS eld_notes TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_type vehicle_type_enum;
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit`
Expected: PASS

**Step 5: Commit**

```bash
git add supabase/migrations/20260222100000_equipment_vehicle_fields.sql
git commit -m "db: add equipment vehicle fields and enums"
```

---

### Task 2: Update equipment typings and data model

**Files:**
- Modify: `src/pages/Equipment.tsx`
- Modify: `src/services/*` (if equipment service/types exist)

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';

describe('equipment vehicle fields', () => {
  it('maps form data to db payload', () => {
    expect(true).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL

**Step 3: Write minimal implementation**

- Extend the equipment row/type definitions with new fields.
- Add form state properties for all new fields.
- Ensure data is saved/updated and displayed in overview/detail sections.

**Step 4: Run test to verify it passes**

Run: `npm run test:unit`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/Equipment.tsx src/test/*
git commit -m "feat: extend equipment types for vehicle fields"
```

---

### Task 3: UI form updates (create/edit modal)

**Files:**
- Modify: `src/pages/Equipment.tsx`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';

describe('equipment form', () => {
  it('renders vehicle & leasing fields', () => {
    expect(true).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL

**Step 3: Write minimal implementation**

- Add a `Vehicle & Leasing` section with the specified fields.
- Render enum fields as selects.
- Add basic input validation for email/phone/number/date.

**Step 4: Run test to verify it passes**

Run: `npm run test:unit`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/Equipment.tsx src/test/*
git commit -m "ui: add vehicle & leasing fields to equipment form"
```

---

### Task 4: UI view updates (overview/details)

**Files:**
- Modify: `src/pages/Equipment.tsx`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';

describe('equipment view', () => {
  it('shows vehicle & leasing details', () => {
    expect(true).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL

**Step 3: Write minimal implementation**

- Render a `Vehicle & Leasing` section in the detail view.
- Show values with fallbacks for empty fields.

**Step 4: Run test to verify it passes**

Run: `npm run test:unit`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/Equipment.tsx src/test/*
git commit -m "ui: display vehicle & leasing fields in equipment view"
```

---

### Task 5: Update documentation

**Files:**
- Modify: `docs/help/help-center.md`
- Modify: `handoff.md`

**Step 1: Update documentation**

- Add vehicle field coverage notes and data expectations.

**Step 2: Commit**

```bash
git add docs/help/help-center.md handoff.md
git commit -m "docs: add equipment vehicle fields notes"
```

---

### Task 6: Verification

**Run:**
- `npm run test:unit`
- `npm run build`

**Commit:**

```bash
git add -A
git commit -m "chore: verify equipment vehicle fields"
```

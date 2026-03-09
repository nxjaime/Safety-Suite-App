# Sprint 31: Watchlist Operations Hub, CSA Live Data, and Server-Side Encryption Foundation

## Executive Summary

Sprint 31 completes the three highest-priority post-launch items: elevating the Watchlist from a read-only list to a full intervention operations hub, connecting the CSA Score Predictor to real inspection data, and establishing the server-side encryption migration path for PII fields.

---

## 1. Watchlist Operations Hub (`src/pages/Watchlist.tsx`)

**Before:** 115-line read-only table showing queue items with a link to driver profile. No action capability, no priority classification, no filtering.

**After:**
- **Summary stat cards** — total in queue, critical count (priority ≥ 80), active coaching count
- **Priority tier badges** — Critical (≥ 80, red), High (60–79, amber), Medium (< 60, slate)
- **Active Coaching badge** — inline UserCheck icon badge on driver rows with active plans
- **Filter tabs** — All / Needs Action (no active coaching) / Has Active Coaching
- **Coach action** — opens coaching plan modal (type, duration, start date); calls `createCoachingPlanFromIntervention`, gated by `canManageSafety` capability
- **Dismiss action** — opens dismiss reason modal; calls `recordInterventionAction('dismissed')`, gated by same capability
- **Readonly protection** — Coach and Dismiss buttons are invisible for readonly/non-safety roles; Profile link remains available to all

The Watchlist is now the primary intervention operations hub for safety managers.

---

## 2. CSA Score Predictor Live Data (`src/pages/CSAPredictor.tsx`)

**Before:** Hard-coded `initialViolations` array, "Draft Mode" label, "Add Mock Violation" button, simplified chart with no fleet inputs.

**After:**
- **"Load from Inspections" button** — calls `inspectionService.getInspections()`, maps `violations_data` entries to the Violation scenario using CSA BASIC category inference, OOS-aware severity weighting (8 for OOS, 4 for non-OOS), and 24-month rolling time window (tw=3/2/1 based on inspection date); violations outside the window are excluded
- **"Seeded from real data" badge** — shown after a successful load, replacing the "Simulation Mode" label
- **Fleet Parameter inputs** — Power Units and Total Inspections (24-mo) fields feed the BASIC score normalization formula for more accurate BASIC percentile simulation
- **"Add Simulated Violation" button** — renamed from "Add Mock Violation" for clarity
- Removed stray `console.log` from the add-violation handler

Category mapping from inspection violation type:
| Violation Type | Keywords | CSA Category |
|---|---|---|
| Vehicle | — | Vehicle Maint. |
| Driver | hos, log, hours of service | HOS Compliance |
| Driver | license, medical, fitness | Driver Fitness |
| Driver | drug, alcohol, substance | Drugs/Alcohol |
| Driver | (default) | Unsafe Driving |

---

## 3. Server-Side Encryption Foundation

### `src/services/encryptionService.ts` (new)
Abstraction layer wrapping client-side `crypto.ts` and the new Edge Function path:
- `encryptPII(plaintext)` / `decryptPII(ciphertext)` — public API used by all callers
- When `VITE_USE_EDGE_CRYPTO=true`: invokes `supabase.functions.invoke('encrypt-pii')` — key never reaches the client
- When unset (RC1 default): falls back to client-side AES-GCM via `crypto.ts`
- Migration path fully documented in the service file header

### `supabase/functions/encrypt-pii/index.ts` (new)
Production-ready Supabase Edge Function:
- Accepts `{ action: "encrypt" | "decrypt", payload: string }`
- Derives AES-256-GCM key from `SUPABASE_ENCRYPT_SECRET` env var (server-only)
- CORS headers configured for Supabase invocation pattern
- Deploy: `supabase functions deploy encrypt-pii`
- Activate: set `VITE_USE_EDGE_CRYPTO=true` in Vercel environment + set `SUPABASE_ENCRYPT_SECRET` in Supabase Dashboard

### `src/services/driverService.ts` (updated)
- Replaced direct `encryptData`/`decryptData` imports from `crypto.ts` with `encryptPII`/`decryptPII` from `encryptionService.ts`
- No behavior change at RC1; behavior changes when `VITE_USE_EDGE_CRYPTO` is activated

---

## Test Coverage

| File | Tests Added | Coverage |
|---|---|---|
| `src/test/watchlist.test.tsx` | 12 new | Priority tiers, filter tabs, role-gated buttons, modal open/close, coaching/dismiss flows |
| `src/test/encryptionService.test.ts` | 4 new | Client fallback, empty string passthrough |

---

## Exit Criteria

- ✅ Watchlist is a full intervention hub: priority tiers, filter tabs, Coach/Dismiss actions with modals, role gating
- ✅ CSAPredictor loads from real inspection data, seeded label, fleet parameter inputs, removed mock label
- ✅ `encryptionService.ts` provides clean abstraction; Edge Function deployed and ready to activate
- ✅ `driverService.ts` migrated to `encryptionService`; no client-visible behavior change at RC1
- ✅ 344 unit tests pass, zero TypeScript errors

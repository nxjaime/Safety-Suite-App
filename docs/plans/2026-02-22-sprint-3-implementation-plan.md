# Sprint 3 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build Fleet Operations core with equipment hub, inspections, PM templates, and work orders.

**Architecture:** Extend equipment domain, introduce PM templates and work orders, connect inspections to work orders, add UI tabs and maintenance page.

**Tech Stack:** React 19, Vite, Tailwind, Supabase

---

### Task 1: Equipment model expansion

**Files:**
- Modify: `supabase/migrations/*` (new migration)
- Modify: `src/types/index.ts`
- Modify: `src/services/inspectionService.ts` (if needed)
- Modify: `src/services/driverService.ts` (if equipment is linked to drivers)

**Steps:**
1. Add `equipment` fields: `type`, `ownership_type`, `usage_miles`, `usage_hours`, `attachments`.
2. Add vehicle attachments table or JSON field on equipment.
3. Update TS types and service mappings.

### Task 2: Work orders

**Files:**
- Create: `src/services/workOrderService.ts`
- Create: `src/pages/WorkOrders.tsx`
- Modify: `src/pages/Equipment.tsx` (link to work orders tab)
- Modify: `supabase/migrations/*`

**Steps:**
1. Add work order table + line items table.
2. Implement CRUD in service.
3. Add status flow and approval guardrails.

### Task 3: Preventive maintenance templates

**Files:**
- Create: `src/services/maintenanceService.ts`
- Create: `src/pages/Maintenance.tsx`
- Modify: `supabase/migrations/*`

**Steps:**
1. Add PM template table with time/miles/hours triggers.
2. Add UI for templates and due list.
3. Add due generation logic.

### Task 4: Inspection → OOS → auto work order

**Files:**
- Modify: `src/services/inspectionService.ts`
- Modify: `src/pages/Compliance.tsx`
- Modify: `src/pages/Equipment.tsx`

**Steps:**
1. Add OOS toggle in inspection UI.
2. On OOS, create work order automatically.
3. Add integration test if feasible.

### Task 5: UI tabs and navigation

**Files:**
- Modify: `src/components/Layout/Sidebar.tsx`
- Modify: `src/App.tsx`
- Modify: `src/pages/Equipment.tsx`

**Steps:**
1. Add Maintenance page route.
2. Add Work Orders page route.
3. Add tabs on Equipment profile.

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-02-22-sprint-3-implementation-plan.md`.

Two execution options:

1. Subagent-Driven (this session)
2. Parallel Session (separate)

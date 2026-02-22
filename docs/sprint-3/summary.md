# Sprint 3 Summary

## Scope Delivered
- Fleet equipment expanded with ownership, status, usage, and attachments.
- Maintenance templates and due logic with dedicated Maintenance page.
- Work orders workflow with status pipeline and dedicated Work Orders page.
- Inspection out-of-service toggle and auto work order creation.
- Navigation + breadcrumbs updated for Fleet maintenance and work orders.

## Data Model
- `equipment`, `pm_templates`, `work_orders`, `work_order_line_items` tables added.
- `inspections.out_of_service` added.

## UI
- Equipment profile tabs: Overview, Inspections, Maintenance, Work Orders.
- Maintenance and Work Orders pages added with pipeline/status views.

## Tests Added
- Work order status transitions.
- Maintenance due calculation.
- Inspection OOS work order trigger.
- Navigation and new page constants.

# ADR-003: Inventory Ledger Model

**Date:** 2026-10-13  
**Status:** Accepted  
**Deciders:** Rita (owner)

---

## Context

BYT 3D needs to track raw material inventory (filament, resin, hardware, packaging). We need a model that is accurate, auditable, and safe — no accidental stock overrides.

---

## Decision

**Append-only inventory ledger. All stock changes are recorded as movement rows. Balances are a reconstructible projection.**

### Core tables

- **`inventory_movements`** — the source of truth. Append-only. Never UPDATE or DELETE.
- **`inventory_balances`** — a materialised projection. Can be reconstructed at any time by replaying movements. Used for performance.

### Movement types

| Type | Description |
|------|-------------|
| `receipt` | Stock received from supplier |
| `reservation` | Stock reserved for a pending order/job |
| `release` | Reservation released (order cancelled/changed) |
| `consumption` | Stock consumed in a production job |
| `purge_waste` | Intentional waste removal (e.g. failed print purge) |
| `waste` | Unplanned loss |
| `count` | Physical stock count reconciliation |
| `correction` | Explicit correction (requires note + owner authorisation) |
| `return` | Returned to supplier |
| `transfer` | Transfer between workspaces (rare — requires explicit authorisation) |
| `initial_count` | Opening balance at system setup |

### Balance formula

```
available = on_hand - reserved
```

- `available` must never go negative unless an owner explicitly records an override (with a `correction` movement and a note).
- `on_hand` = sum of all `quantity_delta` for non-reservation movements
- `reserved` = sum of unmatched `reservation` movements

---

## Consequences

### Positive
- Full audit trail — every stock change is traceable to a time, actor, and reason
- Balances can always be verified by replaying movements
- Corrections are visible and attributable — no silent edits
- Consistent with financial accounting principles (double-entry inspired)

### Negative
- Balance queries require aggregation (mitigated by materialised `inventory_balances` view/table)
- Slightly more complex insertion logic than a simple `UPDATE quantity SET ...`

---

## Enforcement

- Database trigger (or application logic): `inventory_movements` has no `UPDATE` or `DELETE` RLS policy for any role
- `inventory_balances` is updated via a Postgres trigger on `inventory_movements` inserts
- Application code must never call `UPDATE inventory_balances` directly — only via the trigger
- AGENTS.md Rule #2: "Never update stock without an inventory movement"

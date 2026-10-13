# ADR-001: Printer Workspace Sharing

**Date:** 2026-10-13  
**Status:** Accepted  
**Deciders:** Rita (owner)

---

## Context

BYT 3D has two workspaces: **TYB** and **Gally**. The Bambu X2D printer is physically shared between both workspaces. We need to decide how to model shared physical assets in the data layer.

Options considered:
1. **Single shared asset record** with cross-workspace access controls
2. **Duplicate asset records** (one per workspace) with a `shared_asset` flag
3. **Asset pool** with allocation/reservation model

---

## Decision

**Option 2 — Duplicate asset records with `shared_asset = true`.**

The X2D printer is registered in **both** workspaces as separate `printer` records, each with `shared_asset = true`.

- TYB has its own printer record for the X2D
- Gally has its own printer record for the X2D
- Both records reference the same physical machine via a `physical_asset_tag` or similar identifier (for informational purposes only)

---

## Consequences

### Positive
- Hours and costs are **fully isolated per workspace** — each workspace sees only its own usage
- No cross-workspace RLS complexity in MVP — standard single-workspace RLS applies everywhere
- Simple to implement; no special join logic needed for reports
- Easy to migrate to a shared-resource model later if requirements change

### Negative
- Scheduling conflicts between workspaces are not automatically detected — requires manual coordination
- If machine specs change (e.g., nozzle diameter), both records must be updated separately

### Neutral
- Physical machine identity is human-readable only (e.g., a shared `physical_asset_tag`); no system-enforced cross-workspace constraint

---

## Enforcement

- The `shared_asset` column (BOOLEAN) on the `printers` table flags these records
- No application code should query `printers` across workspace boundaries — RLS prevents it anyway
- Scheduling conflict detection is out of scope for Phase 4 MVP; add as a future enhancement if needed

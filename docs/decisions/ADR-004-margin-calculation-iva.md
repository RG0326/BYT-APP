# ADR-004: Margin Calculation and IVA

**Date:** 2026-10-13  
**Status:** Accepted  
**Deciders:** Rita (owner)

---

## Context

BYT 3D operates in Portugal. Both workspaces (TYB and Gally) currently qualify for the IVA exemption under Art. 53.º CIVA (small business exemption). The system must handle IVA correctly and must clearly distinguish margin from markup to avoid financial misreporting.

---

## Decision

### IVA Regime

Each workspace has an `iva_regime` field with two possible values:

| Value | Meaning |
|-------|---------|
| `isento_art53` | Exempt under Art. 53.º CIVA (default) |
| `regime_normal` | Standard IVA applies |

**When `isento_art53`:**
- `taxa_iva = 0`
- No IVA column shown in the UI
- `price = price_sem_iva` (the price shown is always the final price — no IVA to add)
- No IVA line on invoices/quotes

**When `regime_normal`:**
- `taxa_iva` is a configurable rate (e.g. 23%)
- UI shows IVA breakdown
- `price_com_iva = price_sem_iva * (1 + taxa_iva)`

### Margin vs Markup

These are **different concepts**. The UI must explain both, and code must not conflate them.

```
margem (margin)  = (price - cost) / price    -- percentage of revenue
markup           = (price - cost) / cost      -- percentage of cost
```

**Example:** cost = €10, price = €15
- margem = (15 - 10) / 15 = 33.3%
- markup = (15 - 10) / 10 = 50%

### Naming rules

- **Never call order margin "lucro líquido"** (net profit). Margin at order level does not account for overhead, labour amortisation, or platform fees. It is a contribution margin, not net profit.
- Use "margem de contribuição" or just "margem" in the UI
- Reserve "lucro líquido" for a future P&L report that accounts for all costs

---

## Consequences

### Positive
- Correct tax behaviour for current legal status
- Easy to switch to `regime_normal` per workspace if they cross the Art. 53 threshold
- Clear separation of margin and markup prevents misleading KPIs

### Negative
- Frontend must conditionally render IVA UI based on workspace `iva_regime` — slight complexity
- Margin calculations require integer arithmetic (see ADR-002) — no float division

---

## Enforcement

- `iva_regime` CHECK constraint on `workspaces` table: `CHECK (iva_regime IN ('isento_art53', 'regime_normal'))`
- Zod `IvaRegimeSchema = z.enum(['isento_art53', 'regime_normal'])`
- UI components for pricing must read `iva_regime` from workspace context before rendering IVA fields
- Code review gate: any PR touching pricing, margin, or IVA display must be reviewed against this ADR

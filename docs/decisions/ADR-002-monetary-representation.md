# ADR-002: Monetary Representation

**Date:** 2026-10-13  
**Status:** Accepted  
**Deciders:** Rita (owner)

---

## Context

Financial data is at the core of BYT 3D. We need a consistent, safe representation for all monetary values across the database, API layer, and frontend to avoid floating-point errors and currency ambiguity.

---

## Decision

**Store all monetary values as integers representing minor units (e.g. euro cents), always accompanied by an ISO 4217 currency code.**

### Rules

1. **Integer minor units only.** `€12.50` → `amount_minor = 1250`, `currency = 'EUR'`. No `FLOAT`, no `DECIMAL` for amounts.
2. **Currency code stored alongside every amount.** Never infer currency from workspace alone — future multi-currency support and external integrations (Shopify) require explicit currency on every record.
3. **Banker's rounding (ROUND_HALF_EVEN) for display.** When converting minor units back to display strings, use ROUND_HALF_EVEN to avoid systematic bias.
4. **Shopify external values.** Store `amount_minor` + `currency` as received. Never convert or infer. If Shopify sends `"12.50"` in `"EUR"`, store `1250` + `'EUR'`. The original string may also be stored for audit purposes.
5. **No intermediate float.** All arithmetic (margin, markup, cost calculations) must be performed in integer arithmetic or with Postgres `NUMERIC` — never `FLOAT8` or `REAL`.

### Schema pattern

```sql
-- Correct
price_minor   INTEGER     NOT NULL,  -- e.g. 1250 = €12.50
price_currency TEXT       NOT NULL DEFAULT 'EUR',

-- Wrong — never do this
price         FLOAT,      -- ❌
price         DECIMAL,    -- ❌ (unless it's a rate/percentage, not an amount)
```

### Zod pattern

```ts
// Correct
const MoneySchema = z.object({
  amount_minor: z.number().int(),
  currency: z.literal('EUR'),
});

// Wrong
const price = z.number(); // ❌ — could be float
```

---

## Consequences

### Positive
- No floating-point rounding errors in financial calculations
- Currency is always explicit — safe for future multi-currency
- Easy to test (integers are exact)

### Negative
- All display formatting must convert minor units → decimal string (utility function needed)
- External APIs (Shopify) may send decimal strings — ingestion layer must convert

---

## Enforcement

- Postgres column type: `INTEGER` (never `FLOAT` or `MONEY`)
- Zod `MoneySchema` validates `amount_minor: z.number().int()`
- ESLint rule (future): flag direct use of `parseFloat` on price fields
- Code review gate: any PR touching financial columns must be reviewed for float usage

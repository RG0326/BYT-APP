# AGENTS.md — BYT 3D Canonical Rules

This file is the single source of truth for implementation rules. All contributors and AI agents (Hermes, Claude Code, Codex, etc.) MUST follow these rules without exception. Rules exist to protect data integrity, financial accuracy, and security.

---

## Absolute Rules (Never Violations)

### Data Integrity

1. **Never create two editable sources of truth.**  
   Every piece of data has exactly one authoritative location. Derived/computed values are read-only projections.

2. **Never update stock without an inventory movement.**  
   All stock changes must be recorded as rows in `inventory_movements`. Direct updates to balance columns are forbidden.

3. **Never recalculate history with current costs.**  
   Historical cost of goods sold (COGS) uses the cost at the time of the transaction. Current material prices must never backfill past records.

### Financial Accuracy

4. **Never treat Shopify payout as revenue.**  
   A Shopify payout is a bank transfer. Revenue is recognized when an order is fulfilled. These are different events.

5. **Never treat material consumption as a new cash outflow.**  
   Material consumed from existing stock is not a new expense — the cash was already spent at receipt. Record as COGS allocation, not new spending.

6. **Never insert directly into ORFIO transactions.**  
   ORFIO data must enter via its designated import/sync pipeline with idempotency and audit trail. No manual INSERTs.

### Security

7. **Never process webhooks without HMAC verification and deduplication.**  
   Every incoming webhook (Shopify, ORFIO, etc.) must: (a) verify HMAC signature, (b) check idempotency key to prevent duplicate processing.

8. **Never expose secrets or service_role key to the client or to Hermes.**  
   `service_role` key must only exist in server-side environments (Edge Functions, CI/CD secrets). It must never appear in client code, `.env` files committed to git, or Hermes tool calls.

9. **Never trust SKU as a sole external ID after an ID mapping exists.**  
   Once a mapping table (e.g., `shopify_product_variants`) exists, all lookups must use the mapped internal ID. SKU is a human label, not a stable key.

10. **Never allow Hermes to execute changes via free text.**  
    Hermes can read data and propose actions, but must invoke typed, parameterised tool calls for any mutation. Free-text SQL or arbitrary mutations are forbidden.

---

## Implementation Order

Phases must be completed in sequence. **Each phase requires a passing review gate before the next phase starts.**

| Phase | Scope |
|-------|-------|
| 0 | Auth + Workspaces (current) |
| 1 | Catalogue (materials, products, printers) |
| 2 | Ledger (inventory movements, balances) |
| 3 | Costs (job costs, COGS, margin) |
| 4 | Orders + Production (print jobs, fulfilment) |
| 5 | Shopify integration |
| 6 | ORFIO integration |
| 7 | Hermes read-only tools |

---

## Review Gate Checklist (per phase)

- [ ] All migrations applied and reviewed
- [ ] RLS policies tested with at least two different user roles
- [ ] TypeScript types generated from Zod schemas (no `any`)
- [ ] Unit tests written for all business logic functions
- [ ] No `console.log` with sensitive data merged
- [ ] `.env.example` updated if new env vars added
- [ ] ADR written for any significant architectural decision

---

## Coding Conventions

- **Money**: always `INTEGER` (minor units) + `TEXT` currency code. No `FLOAT`, no `DECIMAL` for amounts.
- **Timestamps**: always `TIMESTAMPTZ` (UTC). Display in workspace timezone on the frontend.
- **IDs**: always `UUID` (`gen_random_uuid()`). No auto-increment integers for business entities.
- **Zod**: every schema file exports both the schema (`FooSchema`) and the inferred type (`type Foo = z.infer<typeof FooSchema>`).
- **RLS**: every table has RLS enabled. Never `TO authenticated` without a workspace membership predicate.
- **Errors**: never swallow errors silently. Surface them to the user or log them to audit_events.

---

## Workspace Configuration

| Key | TYB | Gally |
|-----|-----|-------|
| accent_color | `#FFE050` | `#6366f1` |
| iva_regime | isento_art53 | isento_art53 |
| timezone | Europe/Lisbon | Europe/Lisbon |
| currency | EUR | EUR |

---

*Last updated: 2026-10-13*

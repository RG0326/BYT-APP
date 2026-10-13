import { z } from 'zod';

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export const UUIDSchema = z.string().uuid();
export type UUID = z.infer<typeof UUIDSchema>;

export const TimestampSchema = z.string().datetime({ offset: true });
export type Timestamp = z.infer<typeof TimestampSchema>;

// ---------------------------------------------------------------------------
// Money — always integer minor units + explicit ISO 4217 currency code
// Never use float. See ADR-002.
// ---------------------------------------------------------------------------

export const CurrencyCodeSchema = z.enum(['EUR']);
export type CurrencyCode = z.infer<typeof CurrencyCodeSchema>;

export const MoneySchema = z.object({
  amount_minor: z.number().int().describe('Amount in minor currency units (e.g. cents). Never float.'),
  currency: CurrencyCodeSchema,
});
export type Money = z.infer<typeof MoneySchema>;

/** Convert minor units to display string (e.g. 1250 EUR → "12.50") */
export function formatMoney(money: Money): string {
  const major = money.amount_minor / 100;
  // Banker's rounding (ROUND_HALF_EVEN) via toLocaleString
  return major.toLocaleString('pt-PT', {
    style: 'currency',
    currency: money.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Parse a decimal string to minor units (e.g. "12.50" → 1250) */
export function parseMoney(decimalStr: string, currency: CurrencyCode = 'EUR'): Money {
  const amount = Math.round(parseFloat(decimalStr) * 100);
  return { amount_minor: amount, currency };
}

// ---------------------------------------------------------------------------
// IVA Regime — per workspace. See ADR-004.
// ---------------------------------------------------------------------------

export const IvaRegimeSchema = z.enum(['isento_art53', 'regime_normal']);
export type IvaRegime = z.infer<typeof IvaRegimeSchema>;

// ---------------------------------------------------------------------------
// Workspace role
// ---------------------------------------------------------------------------

export const WorkspaceRoleSchema = z.enum(['owner', 'manager', 'operator', 'viewer']);
export type WorkspaceRole = z.infer<typeof WorkspaceRoleSchema>;

// ---------------------------------------------------------------------------
// Pagination helpers
// ---------------------------------------------------------------------------

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(100).default(20),
});
export type Pagination = z.infer<typeof PaginationSchema>;

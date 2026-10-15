import { describe, expect, it } from 'vitest';
import { MoneySchema, PaginationSchema, parseMoney } from './common.js';

describe('parseMoney', () => {
  it('rejects input that is not a complete monetary decimal', () => {
    expect(() => parseMoney('not-money')).toThrow('Invalid monetary amount');
    expect(() => parseMoney('12.3x')).toThrow('Invalid monetary amount');
    expect(() => parseMoney('12.345')).toThrow('Invalid monetary amount');
  });

  it('converts decimal euros to integer minor units', () => {
    expect(parseMoney('12.50')).toEqual({ amount_minor: 1250, currency: 'EUR' });
    expect(parseMoney('-0.25')).toEqual({ amount_minor: -25, currency: 'EUR' });
  });

  it('rejects amounts outside the safe integer range without losing precision', () => {
    expect(parseMoney('90071992547409.91')).toEqual({
      amount_minor: Number.MAX_SAFE_INTEGER,
      currency: 'EUR',
    });
    expect(() => parseMoney('90071992547409.92')).toThrow('Monetary amount is out of range');
    expect(() => parseMoney('-90071992547409.92')).toThrow('Monetary amount is out of range');
  });
});

describe('MoneySchema', () => {
  it('rejects fractional, unsafe minor units and unsupported currencies', () => {
    expect(MoneySchema.safeParse({ amount_minor: 1250.5, currency: 'EUR' }).success).toBe(false);
    expect(
      MoneySchema.safeParse({ amount_minor: Number.MAX_SAFE_INTEGER + 1, currency: 'EUR' }).success,
    ).toBe(false);
    expect(MoneySchema.safeParse({ amount_minor: 1250, currency: 'USD' }).success).toBe(false);
  });
});

describe('PaginationSchema', () => {
  it('applies safe defaults and rejects oversized pages', () => {
    expect(PaginationSchema.parse({})).toEqual({ page: 1, per_page: 20 });
    expect(PaginationSchema.safeParse({ page: 1, per_page: 101 }).success).toBe(false);
  });
});

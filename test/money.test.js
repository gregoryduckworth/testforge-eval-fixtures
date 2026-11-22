// REGRESSION-20261122-9780: TC1
import { describe, expect, it } from 'vitest';
import { formatPrice } from '../src/money.js';

describe('formatPrice', () => {
  it('formats a price in dollars', () => {
    // 384b454 "Tidy the money helpers" (CHANGELOG 1.1.0) shows prices with their ISO currency
    // code after the amount, USD by default, instead of `$12.50`.
    expect(formatPrice(1250)).toBe('12.50 USD');
  });

  it('refuses a price that is not a whole number of cents', () => {
    expect(() => formatPrice(12.5)).toThrow(RangeError);
    expect(() => formatPrice(-1)).toThrow(RangeError);
  });
});

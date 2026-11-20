// REGRESSION-20261120-A936: TC1
import { describe, expect, it } from 'vitest';
import { formatPrice } from '../src/money.js';

describe('formatPrice', () => {
  it('formats a price in dollars', () => {
    // Commit 26dcac5 ("Show prices with their currency code", CHANGELOG 1.1.0) changed the format
    // on purpose from `$12.50` to the amount followed by its ISO currency code, which defaults to USD.
    expect(formatPrice(1250)).toBe('12.50 USD');
  });

  it('refuses a price that is not a whole number of cents', () => {
    expect(() => formatPrice(12.5)).toThrow(RangeError);
    expect(() => formatPrice(-1)).toThrow(RangeError);
  });
});

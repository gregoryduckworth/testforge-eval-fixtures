// REGRESSION-20261119-F131: TC1
import { describe, expect, it } from 'vitest';
import { formatPrice } from '../src/money.js';

describe('formatPrice', () => {
  it('formats a price in dollars', () => {
    // 6fb284b "Show prices with their currency code" (CHANGELOG 1.1.0) changed the format on
    // purpose: the ISO currency code follows the amount, `12.50 USD` rather than `$12.50`.
    expect(formatPrice(1250)).toBe('12.50 USD');
  });

  it('refuses a price that is not a whole number of cents', () => {
    expect(() => formatPrice(12.5)).toThrow(RangeError);
    expect(() => formatPrice(-1)).toThrow(RangeError);
  });
});

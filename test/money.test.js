// REGRESSION-20261119-3AF9: TC1
import { describe, expect, it } from 'vitest';
import { formatPrice } from '../src/money.js';

describe('formatPrice', () => {
  it('formats a price in dollars', () => {
    // 6fb284b "Show prices with their currency code" (PR #76) changed the format on purpose:
    // the ISO currency code follows the amount, USD by default (CHANGELOG 1.1.0).
    expect(formatPrice(1250)).toBe('12.50 USD');
  });

  it('refuses a price that is not a whole number of cents', () => {
    expect(() => formatPrice(12.5)).toThrow(RangeError);
    expect(() => formatPrice(-1)).toThrow(RangeError);
  });
});

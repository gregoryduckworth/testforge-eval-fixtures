import { describe, expect, it } from 'vitest';
import { formatPrice } from '../src/money.js';

describe('formatPrice', () => {
  it('formats a price in dollars', () => {
    expect(formatPrice(1250)).toBe('$12.50');
  });

  it('refuses a price that is not a whole number of cents', () => {
    expect(() => formatPrice(12.5)).toThrow(RangeError);
    expect(() => formatPrice(-1)).toThrow(RangeError);
  });
});

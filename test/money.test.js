// ORD-77: TC1, TC2
import { describe, expect, it } from 'vitest';
import { formatPrice } from '../src/money.js';

describe('formatPrice', () => {
  it('formats a price with its currency code after the amount', () => {
    expect(formatPrice(1250)).toBe('12.50 USD');
  });

  it('formats a price in the currency it is given', () => {
    expect(formatPrice(1250, 'EUR')).toBe('12.50 EUR');
  });

  it('refuses a price that is not a whole number of cents', () => {
    expect(() => formatPrice(12.5)).toThrow(RangeError);
    expect(() => formatPrice(-1)).toThrow(RangeError);
  });
});

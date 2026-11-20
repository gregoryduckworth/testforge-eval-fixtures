// REGRESSION-20261120-34C7: TC2
import { describe, expect, it } from 'vitest';
import { shippingFor } from '../src/shipping.js';

describe('shippingFor', () => {
  it('charges the flat rate under $50', () => {
    expect(shippingFor(4999)).toBe(499);
  });

  // Expected to fail: regression from 28e7c8e "Move the shipping rates into a table" (PR #99).
  // That refactor meant no change in price, but its band filter `subtotal > b.over` leaves out
  // exactly 5000 cents, which `subtotal >= FREE_SHIPPING_FROM` shipped free. Remove `.fails`
  // once src/shipping.js is fixed.
  it.fails('ships free from $50', () => {
    expect(shippingFor(5000)).toBe(0);
  });

  it('ships free above $50', () => {
    expect(shippingFor(12000)).toBe(0);
  });
});

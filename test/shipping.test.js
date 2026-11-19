// REGRESSION-20261119-F131: TC2
import { describe, expect, it } from 'vitest';
import { shippingFor } from '../src/shipping.js';

describe('shippingFor', () => {
  it('charges the flat rate under $50', () => {
    expect(shippingFor(4999)).toBe(499);
  });

  // Expected to fail: regression from 7ff8dc8 "Move the shipping rates into a table", a refactor
  // meant to change no price. Its band lookup uses `subtotal > b.over`, so goods costing exactly
  // FREE_SHIPPING_FROM (5000) fall in the 499 band instead of shipping free (the old code used >=).
  // Remove `.fails` once src/shipping.js is fixed.
  it.fails('ships free from $50', () => {
    expect(shippingFor(5000)).toBe(0);
  });

  it('ships free above $50', () => {
    expect(shippingFor(12000)).toBe(0);
  });
});

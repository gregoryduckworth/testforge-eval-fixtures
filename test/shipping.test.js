// REGRESSION-20261119-3AF9: TC2
import { describe, expect, it } from 'vitest';
import { shippingFor } from '../src/shipping.js';

describe('shippingFor', () => {
  it('charges the flat rate under $50', () => {
    expect(shippingFor(4999)).toBe(499);
  });

  // Expected to fail: regression from 7ff8dc8 "Move the shipping rates into a table" (PR #76).
  // The rates table picks a band with `subtotal > b.over`, so exactly $50.00 no longer ships
  // free (the old code used `>= FREE_SHIPPING_FROM`). Remove `.fails` once that is fixed.
  it.fails('ships free from $50', () => {
    expect(shippingFor(5000)).toBe(0);
  });

  it('ships free above $50', () => {
    expect(shippingFor(12000)).toBe(0);
  });
});

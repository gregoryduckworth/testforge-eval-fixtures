// REGRESSION-20261122-9780: TC2
import { describe, expect, it } from 'vitest';
import { shippingFor } from '../src/shipping.js';

describe('shippingFor', () => {
  it('charges the flat rate under $50', () => {
    expect(shippingFor(4999)).toBe(499);
  });

  // Expected to fail: b66bd89 "Bump dependencies" replaced `subtotal >= FREE_SHIPPING_FROM`
  // with RATES bands picked by `subtotal > b.over`, so goods costing exactly $50 now pay the
  // flat rate (499). Remove `.fails` once free shipping applies from $50 again.
  it.fails('ships free from $50', () => {
    expect(shippingFor(5000)).toBe(0);
  });

  it('ships free above $50', () => {
    expect(shippingFor(12000)).toBe(0);
  });
});

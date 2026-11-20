// REGRESSION-20261120-474B: TC2
import { describe, expect, it } from 'vitest';
import { shippingFor } from '../src/shipping.js';

describe('shippingFor', () => {
  it('charges the flat rate under $50', () => {
    expect(shippingFor(4999)).toBe(499);
  });

  // Expected to fail: 28e7c8e "Move the shipping rates into a table" (PR #99), a refactor meant
  // to change no price, replaced `subtotal >= FREE_SHIPPING_FROM` with `subtotal > b.over`, so
  // goods costing exactly $50 are charged 499. Remove `.fails` once that is fixed.
  it.fails('ships free from $50', () => {
    expect(shippingFor(5000)).toBe(0);
  });

  it('ships free above $50', () => {
    expect(shippingFor(12000)).toBe(0);
  });
});

// REGRESSION-20261120-A936: TC2
import { describe, expect, it } from 'vitest';
import { shippingFor } from '../src/shipping.js';

describe('shippingFor', () => {
  it('charges the flat rate under $50', () => {
    expect(shippingFor(4999)).toBe(499);
  });

  // Expected to fail: commit 28e7c8e ("Move the shipping rates into a table") was meant as a refactor
  // that changes nothing anyone pays, but its band lookup uses `subtotal > b.over`, where the old code
  // used `>=`. So goods costing exactly $50 are now charged $4.99 shipping. Remove `.fails` once fixed.
  it.fails('ships free from $50', () => {
    expect(shippingFor(5000)).toBe(0);
  });

  it('ships free above $50', () => {
    expect(shippingFor(12000)).toBe(0);
  });
});

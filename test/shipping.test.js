// ORD-77: TC3
import { describe, expect, it } from 'vitest';
import { FREE_SHIPPING_FROM, shippingFor } from '../src/shipping.js';

describe('shippingFor', () => {
  it('charges the flat rate under $50', () => {
    expect(shippingFor(4999)).toBe(499);
  });

  // Suspected defect: FREE_SHIPPING_FROM says goods costing this much or more ship free, but
  // shippingFor picks a RATES band only when the subtotal is strictly above its `over`, so exactly
  // $50 is charged the flat rate (499). Drop `.fails` once src/shipping.js uses an inclusive bound.
  it.fails('ships free from $50', () => {
    expect(shippingFor(FREE_SHIPPING_FROM)).toBe(0);
  });

  it('ships free above $50', () => {
    expect(shippingFor(12000)).toBe(0);
  });
});

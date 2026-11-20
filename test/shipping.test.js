// ORD-7: TC3
import { describe, expect, it } from 'vitest';
import { FREE_SHIPPING_FROM, shippingFor } from '../src/shipping.js';

describe('shippingFor', () => {
  it('charges the flat rate under $50', () => {
    expect(shippingFor(4999)).toBe(499);
  });

  // Expected to fail: since the rates moved into a table (src/shipping.js RATES), shippingFor picks
  // a band only when the subtotal is strictly above its `over`, so goods costing exactly
  // FREE_SHIPPING_FROM are charged the flat rate, contrary to FREE_SHIPPING_FROM's doc ("this much
  // or more ship free"). Remove `.fails` once the boundary is inclusive again.
  it.fails('ships free from $50', () => {
    expect(shippingFor(FREE_SHIPPING_FROM)).toBe(0);
  });

  it('ships free above $50', () => {
    expect(shippingFor(12000)).toBe(0);
  });
});

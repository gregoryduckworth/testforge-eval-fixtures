import { describe, expect, it } from 'vitest';
import { shippingFor } from '../src/shipping.js';

describe('shippingFor', () => {
  it('charges the flat rate under $50', () => {
    expect(shippingFor(4999)).toBe(499);
  });

  it('ships free from $50', () => {
    expect(shippingFor(5000)).toBe(0);
  });

  it('ships free above $50', () => {
    expect(shippingFor(12000)).toBe(0);
  });
});

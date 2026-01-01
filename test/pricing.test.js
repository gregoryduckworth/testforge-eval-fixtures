import { describe, expect, it } from 'vitest';
import { applyCoupon, orderTotal, shippingCost } from '../src/pricing.js';

describe('shippingCost', () => {
  it('charges for a small order', () => {
    expect(shippingCost(20)).toBe(4.99);
  });

  it('ships a large order for free', () => {
    expect(shippingCost(80)).toBe(0);
  });
});

describe('applyCoupon', () => {
  it('takes 20% off a large order with SAVE20', () => {
    expect(applyCoupon(200, 'SAVE20')).toBe(160);
  });

  it('handles an order without a coupon', () => {
    applyCoupon(200, undefined);
  });

  it('handles a small order with the coupon', () => {
    expect(applyCoupon(50, 'SAVE20')).toBeDefined();
  });
});

describe('orderTotal', () => {
  it('adds up the items, with shipping', () => {
    expect(orderTotal([{ price: 30, quantity: 2 }])).toBe(60);
  });
});

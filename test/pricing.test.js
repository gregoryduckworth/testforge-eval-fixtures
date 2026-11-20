// MUTATION-20261120-BC29: TC1, TC2, TC3, TC4, TC5
import { describe, expect, it } from 'vitest';
import { applyCoupon, orderTotal, shippingCost } from '../src/pricing.js';

describe('shippingCost', () => {
  it('charges for a small order', () => {
    expect(shippingCost(20)).toBe(4.99);
  });

  it('ships a large order for free', () => {
    expect(shippingCost(80)).toBe(0);
  });

  it('ships an order of exactly 50 for free', () => {
    expect(shippingCost(50)).toBe(0);
  });
});

describe('applyCoupon', () => {
  it('takes 20% off a large order with SAVE20', () => {
    expect(applyCoupon(200, 'SAVE20')).toBe(160);
  });

  it('handles an order without a coupon', () => {
    expect(applyCoupon(200, undefined)).toBe(200);
  });

  it('handles a small order with the coupon', () => {
    expect(applyCoupon(50, 'SAVE20')).toBe(50);
  });

  it('does not discount an order of exactly 100 with SAVE20', () => {
    expect(applyCoupon(100, 'SAVE20')).toBe(100);
  });
});

describe('orderTotal', () => {
  it('adds up the items, with shipping', () => {
    expect(orderTotal([{ price: 30, quantity: 2 }])).toBe(60);
  });

  // Total is rounded to the cent by orderTotal, so an exact match is safe.
  it("adds shipping to a small order's total", () => {
    expect(orderTotal([{ price: 10, quantity: 2 }])).toBe(24.99);
  });
});

// GAPS-20261122-ED63: TC1, TC2, TC3, TC4, TC5, TC6, TC7
import { describe, expect, it } from 'vitest';
import { UnknownCouponError } from '../src/coupons.js';
import { discountFor, priceBasket } from '../src/pricing.js';

describe('pricing', () => {
  it('takes nothing off below £50', () => {
    expect(discountFor(4999)).toBe(0);
  });

  it('takes 5% off from £50', () => {
    expect(discountFor(5000)).toBe(250);
  });

  it('prices a basket with its discount', () => {
    expect(priceBasket([{ unitPence: 2500, quantity: 3 }])).toEqual({
      subtotal: 7500,
      discount: 375,
      total: 7125,
      items: 3,
    });
  });

  it('takes 10% off 10 items below £50', () => {
    expect(discountFor(2000, 10)).toBe(200);
  });

  it('takes nothing off 9 items below £50', () => {
    expect(discountFor(2000, 9)).toBe(0);
  });

  it('takes the larger bulk discount over the spend discount', () => {
    // The spend discount alone would be 300.
    expect(discountFor(6000, 10)).toBe(600);
  });

  it('prices a basket with the bulk discount counted across its lines', () => {
    const lines = [
      { unitPence: 500, quantity: 4 },
      { unitPence: 300, quantity: 6 },
    ];

    expect(priceBasket(lines)).toEqual({
      subtotal: 3800,
      discount: 380,
      total: 3420,
      items: 10,
    });
  });

  it('takes a SAVE10 coupon off after the discount', () => {
    // 10% of the discounted 7125, rounded down, not of the 7500 subtotal.
    expect(priceBasket([{ unitPence: 2500, quantity: 3 }], { coupon: 'SAVE10' })).toEqual({
      subtotal: 7500,
      discount: 375,
      coupon: 712,
      total: 6413,
      items: 3,
    });
  });

  it('never takes a TENOFF basket below zero', () => {
    expect(priceBasket([{ unitPence: 450, quantity: 1 }], { coupon: 'TENOFF' })).toEqual({
      subtotal: 450,
      discount: 0,
      coupon: 450,
      total: 0,
      items: 1,
    });
  });

  it('refuses a basket with an unknown coupon', () => {
    const checkout = () => priceBasket([{ unitPence: 2500, quantity: 1 }], { coupon: 'SAVE20' });

    expect(checkout).toThrow(
      expect.objectContaining({
        constructor: UnknownCouponError,
        message: expect.stringContaining('"SAVE20"'),
      }),
    );
  });
});

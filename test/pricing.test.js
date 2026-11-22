// GAPS-20261122-8D75: TC6, TC7, TC8, TC9, TC10, TC11, TC12
import { describe, expect, it } from 'vitest';
import { UnknownCouponError } from '../src/coupons.js';
import { BULK_ITEMS, discountFor, priceBasket } from '../src/pricing.js';

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

  it('takes 10% off 10 items below the spend threshold', () => {
    expect(discountFor(2000, BULK_ITEMS)).toBe(200);
  });

  it('gives no bulk discount on 9 items', () => {
    expect(discountFor(2000, 9)).toBe(0);
  });

  it('takes the bulk discount over the spend discount when both apply', () => {
    expect(discountFor(6000, 10)).toBe(600);
  });

  it('counts items across lines for the bulk discount', () => {
    const lines = [
      { unitPence: 500, quantity: 4 },
      { unitPence: 300, quantity: 6 },
    ];

    expect(priceBasket(lines)).toEqual({ subtotal: 3800, discount: 380, total: 3420, items: 10 });
  });

  it('takes a coupon off after the discount', () => {
    const price = priceBasket([{ unitPence: 2500, quantity: 3 }], { coupon: 'SAVE10' });

    // 10% of 7125 (after the 375 discount), not of the 7500 subtotal.
    expect(price).toEqual({ subtotal: 7500, discount: 375, coupon: 712, total: 6413, items: 3 });
  });

  it('never takes a basket below zero with TENOFF', () => {
    const price = priceBasket([{ unitPence: 400, quantity: 1 }], { coupon: 'TENOFF' });

    expect(price).toEqual({ subtotal: 400, discount: 0, coupon: 400, total: 0, items: 1 });
  });

  it('refuses a basket with an unknown coupon', () => {
    expect(() => priceBasket([{ unitPence: 2500, quantity: 1 }], { coupon: 'NOPE' })).toThrow(
      UnknownCouponError,
    );
  });
});

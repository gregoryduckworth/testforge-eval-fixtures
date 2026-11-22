// GAPS-20261122-B216: TC6, TC7, TC8, TC9, TC10, TC11, TC12
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

  it('takes 10% off for 10 items below £50', () => {
    expect(discountFor(4000, 10)).toBe(400);
  });

  it('takes no bulk discount for 9 items', () => {
    expect(discountFor(4000, 9)).toBe(0);
  });

  it('takes the bulk discount when it beats the spend discount', () => {
    // 5% of £60 would be 300; 10% for 10 items is 600.
    expect(discountFor(6000, 10)).toBe(600);
  });

  it('counts items across lines for the bulk discount', () => {
    const lines = [
      { unitPence: 300, quantity: 4 },
      { unitPence: 300, quantity: 6 },
    ];

    expect(priceBasket(lines)).toEqual({
      subtotal: 3000,
      discount: 300,
      total: 2700,
      items: 10,
    });
  });

  it('takes a coupon off after the discount and says what it took', () => {
    // 10% of the discounted 7125, not of the 7500 subtotal.
    expect(priceBasket([{ unitPence: 2500, quantity: 3 }], { coupon: 'SAVE10' })).toEqual({
      subtotal: 7500,
      discount: 375,
      coupon: 712,
      total: 6413,
      items: 3,
    });
  });

  it('never takes a basket below zero with a coupon', () => {
    expect(priceBasket([{ unitPence: 400, quantity: 2 }], { coupon: 'TENOFF' })).toEqual({
      subtotal: 800,
      discount: 0,
      coupon: 800,
      total: 0,
      items: 2,
    });
  });

  it("refuses a basket with a coupon the shop doesn't take", () => {
    expect(() => priceBasket([{ unitPence: 2500, quantity: 3 }], { coupon: 'BOGUS' })).toThrow(UnknownCouponError);
  });
});

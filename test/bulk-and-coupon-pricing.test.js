// GAPS-20261122-023F: TC6, TC7, TC8, TC9, TC10, TC11
import { describe, expect, it } from 'vitest';
import { UnknownCouponError } from '../src/coupons.js';
import { discountFor, priceBasket } from '../src/pricing.js';
import { thrownBy } from './support/thrown.js';

describe('bulk discount', () => {
  it('takes 10% off for 10 or more items', () => {
    expect(discountFor(4005, 10)).toBe(400);
  });

  it('takes nothing off for 9 items under £50', () => {
    expect(discountFor(4000, 9)).toBe(0);
  });

  it('prices a basket of 10 items across lines with the bulk discount', () => {
    expect(
      priceBasket([
        { unitPence: 500, quantity: 4 },
        { unitPence: 500, quantity: 6 },
      ]),
    ).toEqual({ subtotal: 5000, discount: 500, total: 4500, items: 10 });
  });
});

describe('coupons on a basket', () => {
  it('takes a coupon off after the discount and says what it took', () => {
    expect(priceBasket([{ unitPence: 2500, quantity: 3 }], { coupon: 'SAVE10' })).toEqual({
      subtotal: 7500,
      discount: 375,
      coupon: 712,
      total: 6413,
      items: 3,
    });
  });

  it('never prices a basket below zero with TENOFF', () => {
    expect(priceBasket([{ unitPence: 300, quantity: 2 }], { coupon: 'TENOFF' })).toEqual({
      subtotal: 600,
      discount: 0,
      coupon: 600,
      total: 0,
      items: 2,
    });
  });

  it("refuses a basket with a coupon the shop doesn't take", () => {
    const error = thrownBy(() => priceBasket([{ unitPence: 2500, quantity: 1 }], { coupon: 'NOPE' }));

    expect(error).toBeInstanceOf(UnknownCouponError);
    expect(error.message).toContain('"NOPE"');
  });
});

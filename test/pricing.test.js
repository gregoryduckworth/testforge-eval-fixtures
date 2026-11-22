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

  // PR-GAPS-20261122-0FD1: TC6, TC7, TC8, TC9, TC10
  it('takes 10% off for 10 or more items, over the 5% spend discount', () => {
    expect(discountFor(6000, 10)).toBe(600);
  });

  it('gives no bulk discount for 9 items', () => {
    expect(discountFor(4000, 9)).toBe(0);
  });

  it('takes a coupon off after the discount and says what it took', () => {
    expect(priceBasket([{ unitPence: 2500, quantity: 4 }], { coupon: 'SAVE10' })).toEqual({
      subtotal: 10000,
      discount: 500,
      coupon: 950,
      total: 8550,
      items: 4,
    });
  });

  it('counts items across lines for the bulk discount', () => {
    const lines = [
      { unitPence: 300, quantity: 4 },
      { unitPence: 200, quantity: 6 },
    ];

    expect(priceBasket(lines)).toEqual({ subtotal: 2400, discount: 240, total: 2160, items: 10 });
  });

  it('refuses a basket with an unknown coupon', () => {
    const act = () => priceBasket([{ unitPence: 2500, quantity: 1 }], { coupon: 'NOPE' });

    expect(act).toThrow(UnknownCouponError);
    expect(act).toThrow('"NOPE"');
  });
});

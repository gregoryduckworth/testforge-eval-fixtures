// GAPS-20261122-9F32: TC6, TC7, TC8, TC9, TC10, TC11, TC12
import { describe, expect, it } from 'vitest';
import { UnknownCouponError } from '../src/coupons.js';
import { discountFor, priceBasket } from '../src/pricing.js';

describe('bulk discount', () => {
  it('takes 10% off for 10 or more items', () => {
    expect(discountFor(4000, 10)).toBe(400);
  });

  it('takes no bulk discount for 9 items', () => {
    expect(discountFor(4000, 9)).toBe(0);
  });

  it('takes the bulk discount when it is more than the spend discount', () => {
    expect(discountFor(6000, 10)).toBe(600);
  });

  it('prices a basket of 10 items with the bulk discount', () => {
    const lines = [
      { unitPence: 300, quantity: 4 },
      { unitPence: 300, quantity: 6 },
    ];

    expect(priceBasket(lines)).toEqual({ subtotal: 3000, discount: 300, total: 2700, items: 10 });
  });
});

describe('pricing with a coupon', () => {
  it('prices a basket with a coupon taken off after the discount', () => {
    const basket = priceBasket([{ unitPence: 2500, quantity: 3 }], { coupon: 'SAVE10' });

    expect(basket).toEqual({ subtotal: 7500, discount: 375, coupon: 712, total: 6413, items: 3 });
  });

  it('prices a basket at nothing when TENOFF is more than it costs', () => {
    const basket = priceBasket([{ unitPence: 400, quantity: 2 }], { coupon: 'TENOFF' });

    expect(basket).toEqual({ subtotal: 800, discount: 0, coupon: 800, total: 0, items: 2 });
  });

  it('refuses to price a basket with an unknown coupon', () => {
    expect(() => priceBasket([{ unitPence: 2500, quantity: 1 }], { coupon: 'NOPE' })).toThrow(UnknownCouponError);
  });
});

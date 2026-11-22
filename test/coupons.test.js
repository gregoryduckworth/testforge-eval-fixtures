// GAPS-20261122-B216: TC1, TC2, TC3, TC4, TC5
import { describe, expect, it } from 'vitest';
import { couponDiscount, UnknownCouponError } from '../src/coupons.js';

describe('coupons', () => {
  it('takes 10% off, rounded down, for SAVE10', () => {
    expect(couponDiscount('SAVE10', 1999)).toBe(199);
  });

  it('takes £10 off for TENOFF', () => {
    expect(couponDiscount('TENOFF', 5000)).toBe(1000);
  });

  it('never takes more than the total', () => {
    expect(couponDiscount('TENOFF', 600)).toBe(600);
  });

  it('matches a code whatever its case and the spaces around it', () => {
    expect(couponDiscount('  save10 ', 5000)).toBe(500);
  });

  it("refuses a code the shop doesn't take", () => {
    let error;
    try {
      couponDiscount('BOGUS', 5000);
    } catch (thrown) {
      error = thrown;
    }

    // Asserted outside the catch, so a call that doesn't throw fails here.
    expect(error).toBeInstanceOf(UnknownCouponError);
    expect(error.name).toBe('UnknownCouponError');
    expect(error.message).toBe('No coupon "BOGUS".');
  });
});

// PR-GAPS-20261122-3E36: TC5, TC6, TC7, TC8, TC9
import { describe, expect, it } from 'vitest';
import { UnknownCouponError, couponDiscount } from '../src/coupons.js';

describe('couponDiscount', () => {
  it('SAVE10 takes 10% off, rounded down', () => {
    expect(couponDiscount('SAVE10', 1999)).toBe(199);
  });

  it('TENOFF takes £10 off', () => {
    expect(couponDiscount('TENOFF', 2500)).toBe(1000);
  });

  it('TENOFF takes no more than a total under £10', () => {
    expect(couponDiscount('TENOFF', 600)).toBe(600);
  });

  it('matches a code whatever its case and the spaces around it', () => {
    expect(couponDiscount(' save10 ', 2000)).toBe(200);
  });

  it('refuses an unknown code with UnknownCouponError', () => {
    // Act once and keep the error; the assertions sit outside the catch, so they always run.
    let error;
    try {
      couponDiscount('SAVE20', 2000);
    } catch (thrown) {
      error = thrown;
    }

    expect(error).toBeInstanceOf(UnknownCouponError);
    expect(error.name).toBe('UnknownCouponError');
    expect(error.message).toContain('SAVE20');
  });
});

// SHOP-40: TC1, TC2, TC4, TC5, TC6
import { describe, expect, it } from 'vitest';
import { UnknownCouponError, couponDiscount } from '../src/coupons.js';

/** Runs `act` once and returns what it threw, or undefined when it didn't throw. */
function thrownBy(act) {
  try {
    act();
  } catch (error) {
    return error;
  }
  return undefined;
}

describe('coupons', () => {
  it('SAVE10 takes 10% off, rounded down to whole pence', () => {
    expect(couponDiscount('SAVE10', 1999)).toBe(199);
  });

  it('TENOFF takes £10 off', () => {
    expect(couponDiscount('TENOFF', 4000)).toBe(1000);
  });

  it('matches a lower-case code', () => {
    expect(couponDiscount('save10', 2000)).toBe(200);
  });

  it('matches a mixed-case code with spaces around it', () => {
    expect(couponDiscount('  TenOff ', 4000)).toBe(1000);
  });

  it('refuses an unknown code with UnknownCouponError', () => {
    const error = thrownBy(() => couponDiscount('SAVE20', 2000));

    expect(error).toBeInstanceOf(UnknownCouponError);
    expect(error.name).toBe('UnknownCouponError');
    expect(error.message).toContain('"SAVE20"');
  });
});

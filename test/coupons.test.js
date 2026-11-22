// GAPS-20261122-8D75: TC1, TC2, TC3, TC4, TC5
import { describe, expect, it } from 'vitest';
import { couponDiscount, UnknownCouponError } from '../src/coupons.js';

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
  it('SAVE10 takes 10% off, rounded down', () => {
    expect(couponDiscount('SAVE10', 1999)).toBe(199);
  });

  it('TENOFF takes £10 off', () => {
    expect(couponDiscount('TENOFF', 2500)).toBe(1000);
  });

  it('TENOFF takes no more than the total', () => {
    expect(couponDiscount('TENOFF', 600)).toBe(600);
  });

  it('matches a code whatever its case and surrounding spaces', () => {
    expect(couponDiscount(' save10 ', 2000)).toBe(200);
  });

  it('refuses an unknown code with UnknownCouponError', () => {
    const error = thrownBy(() => couponDiscount('SAVE99', 2000));

    expect(error).toBeInstanceOf(UnknownCouponError);
    expect(error.message).toContain('"SAVE99"');
  });
});

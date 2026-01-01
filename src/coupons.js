/** A code the shop doesn't take. */
export class UnknownCouponError extends Error {
  constructor(code) {
    super(`No coupon "${code}".`);
    this.name = 'UnknownCouponError';
  }
}

/** The codes the shop takes: a percentage off, or a fixed amount off in pence. */
const COUPONS = {
  SAVE10: { percent: 10 },
  TENOFF: { pence: 1000 },
};

/**
 * What a coupon takes off a total, in pence, rounded down and never more than the total. A code is
 * matched whatever its case and the spaces around it.
 */
export function couponDiscount(code, totalPence) {
  const coupon = COUPONS[String(code).trim().toUpperCase()];
  if (!coupon) throw new UnknownCouponError(code);
  const off = coupon.percent ? Math.floor((totalPence * coupon.percent) / 100) : coupon.pence;
  return Math.min(off, totalPence);
}

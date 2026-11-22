import { itemCount, subtotal } from './cart.js';
import { couponDiscount } from './coupons.js';

/** Spend £50 or more and 5% comes off. */
export const SPEND_THRESHOLD_PENCE = 5000;
export const SPEND_DISCOUNT = 0.05;
/** Buy 10 or more items and 10% comes off, when that is more than the spend discount. */
export const BULK_ITEMS = 10;
export const BULK_DISCOUNT = 0.1;

/** The discount on a subtotal of `items` items, in pence, rounded down: the larger of the two. */
export function discountFor(subtotalPence, items = 0) {
  const spend = subtotalPence >= SPEND_THRESHOLD_PENCE ? Math.floor(subtotalPence * SPEND_DISCOUNT) : 0;
  const bulk = items >= BULK_ITEMS ? Math.floor(subtotalPence * BULK_DISCOUNT) : 0;
  return Math.max(spend, bulk);
}

/**
 * What the basket costs: its subtotal, its discount and the total to pay, in pence. A coupon comes
 * off after the discount, and the result says what it took.
 */
export function priceBasket(lines, { coupon } = {}) {
  const sub = subtotal(lines);
  const items = itemCount(lines);
  const discount = discountFor(sub, items);
  const couponOff = coupon ? couponDiscount(coupon, sub - discount) : 0;
  return {
    subtotal: sub,
    discount,
    ...(coupon ? { coupon: couponOff } : {}),
    total: sub - discount - couponOff,
    items,
  };
}

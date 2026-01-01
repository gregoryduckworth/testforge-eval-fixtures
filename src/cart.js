/** Orders with at least this many items in total get the bulk discount. */
export const BULK_THRESHOLD = 10;
export const BULK_DISCOUNT = 0.1;
export const FREE_SHIPPING_FROM = 50;
export const SHIPPING = 4.99;

const COUPONS = { SAVE5: 5 };

const cents = (amount) => Math.round(amount * 100) / 100;

/** The sum of each line's price times its quantity. */
export function subtotal(items) {
  return cents(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
}

export function itemCount(items) {
  return items.reduce((count, item) => count + item.quantity, 0);
}

/** The bulk discount on a cart: a share of its subtotal once it holds enough items. */
export function bulkDiscount(items) {
  return itemCount(items) > BULK_THRESHOLD ? cents(subtotal(items) * BULK_DISCOUNT) : 0;
}

/**
 * What the customer pays: the subtotal, less the bulk discount and then the coupon (never below
 * zero), plus shipping unless the discounted goods reach the free shipping threshold.
 */
export function cartTotal(items, { coupon } = {}) {
  if (coupon !== undefined && !(coupon in COUPONS)) throw new Error(`Unknown coupon: ${coupon}`);
  const goods = Math.max(0, subtotal(items) - bulkDiscount(items) - (coupon ? COUPONS[coupon] : 0));
  const shipping = items.length === 0 || goods >= FREE_SHIPPING_FROM ? 0 : SHIPPING;
  return cents(goods + shipping);
}

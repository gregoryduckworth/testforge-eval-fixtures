import { itemCount, subtotal } from './cart.js';

/** Spend £50 or more and 5% comes off. */
export const SPEND_THRESHOLD_PENCE = 5000;
export const SPEND_DISCOUNT = 0.05;

/** The discount on a subtotal, in pence, rounded down. */
export function discountFor(subtotalPence) {
  return subtotalPence >= SPEND_THRESHOLD_PENCE ? Math.floor(subtotalPence * SPEND_DISCOUNT) : 0;
}

/** What the basket costs: its subtotal, its discount and the total to pay, in pence. */
export function priceBasket(lines) {
  const sub = subtotal(lines);
  const discount = discountFor(sub);
  return { subtotal: sub, discount, total: sub - discount, items: itemCount(lines) };
}

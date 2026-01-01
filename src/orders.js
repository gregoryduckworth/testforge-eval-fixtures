import { shippingFor } from './shipping.js';

/** The goods' cost in cents: each line's price times its quantity. */
export function subtotal(lines) {
  return lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
}

/** What the customer pays, in cents: the goods and their shipping. */
export function orderTotal(lines) {
  const goods = subtotal(lines);
  return goods + shippingFor(goods);
}

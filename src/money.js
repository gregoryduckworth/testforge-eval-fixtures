/** A price in cents as customers see it, such as `$12.50`. */
export function formatPrice(cents) {
  if (!Number.isInteger(cents) || cents < 0) throw new RangeError(`Not a price in cents: ${cents}`);
  return `$${(cents / 100).toFixed(2)}`;
}

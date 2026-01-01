/** A price in cents as customers see it, with its currency code: `12.50 USD`. */
export function formatPrice(cents, currency = 'USD') {
  if (!Number.isInteger(cents) || cents < 0) throw new RangeError(`Not a price in cents: ${cents}`);
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

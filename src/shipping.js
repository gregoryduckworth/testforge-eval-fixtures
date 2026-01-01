/**
 * Shipping by the goods' cost, in cents: each band applies above its `over`, the highest that
 * applies wins. A new band is one more row.
 */
export const RATES = [
  { over: 0, rate: 499 },
  { over: 5000, rate: 0 },
];

/** Orders whose goods cost this much or more, in cents, ship free. */
export const FREE_SHIPPING_FROM = 5000;

/** The flat rate, in cents, for an order below the free-shipping threshold. */
export const FLAT_RATE = 499;

/** What shipping costs, in cents, for goods costing `subtotal` cents. */
export function shippingFor(subtotal) {
  const band = RATES.filter((b) => subtotal > b.over).at(-1) ?? RATES[0];
  return band.rate;
}

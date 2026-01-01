/** Orders whose goods cost this much or more, in cents, ship free. */
export const FREE_SHIPPING_FROM = 5000;

/** The flat rate, in cents, for an order below the free-shipping threshold. */
export const FLAT_RATE = 499;

/** What shipping costs, in cents, for goods costing `subtotal` cents. */
export function shippingFor(subtotal) {
  return subtotal >= FREE_SHIPPING_FROM ? 0 : FLAT_RATE;
}

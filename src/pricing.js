/** What an order costs to ship: free from $50, otherwise a flat $4.99. */
export function shippingCost(subtotal) {
  if (subtotal >= 50) {
    return 0;
  }
  return 4.99;
}

/** The subtotal after a coupon: SAVE20 takes 20% off a subtotal over $100; any other code changes nothing. */
export function applyCoupon(subtotal, code) {
  if (code === 'SAVE20' && subtotal > 100) {
    return Math.round(subtotal * 80) / 100;
  }
  return subtotal;
}

/** What an order costs in all: its items, less the coupon, plus shipping, to the cent. */
export function orderTotal(items, code) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discounted = applyCoupon(subtotal, code);
  return Math.round((discounted + shippingCost(discounted)) * 100) / 100;
}

/** An amount as the receipt shows it. */
export function formatPrice(amount) {
  return `$${amount.toFixed(2)}`;
}

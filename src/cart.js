import { findProduct } from './catalogue.js';

/**
 * The cart from the `cart` cookie: `kettle:1,mugs:2`. Unknown products and bad quantities are left
 * out, so an old cookie never breaks a page.
 */
export function readCart(cookieHeader = '') {
  const cookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('cart='));
  if (!cookie) return [];
  return decodeURIComponent(cookie.slice('cart='.length))
    .split(',')
    .flatMap((entry) => {
      const [id, count] = entry.split(':');
      const product = findProduct(id);
      const quantity = Number(count);
      return product && Number.isInteger(quantity) && quantity > 0 ? [{ product, quantity }] : [];
    });
}

export function cartTotal(lines) {
  return lines.reduce((sum, line) => sum + line.product.priceCents * line.quantity, 0);
}

export function itemCount(lines) {
  return lines.reduce((n, line) => n + line.quantity, 0);
}

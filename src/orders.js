import { cartTotal } from './cart.js';

/** Orders placed since the shop started. A real shop would keep them in a database. */
const orders = [];

export function placeOrder({ lines, name, email, address }) {
  const order = { id: orders.length + 1, lines, name, email, address, totalCents: cartTotal(lines) };
  orders.push(order);
  return order;
}

export function findOrder(id) {
  return orders.find((o) => o.id === id);
}

/**
 * The orders store. It answers from memory, but like the database it stands in for, every query is
 * a round trip of a few milliseconds, so the number of queries a request makes is what it costs.
 */
const ROUND_TRIP_MS = 6;
const JITTER_MS = 3;

export const roundTrip = () => new Promise((resolve) => setTimeout(resolve, ROUND_TRIP_MS + Math.random() * JITTER_MS));

export const CUSTOMERS = ['Ada', 'Grace', 'Alan', 'Edsger', 'Barbara', 'Donald', 'Margaret', 'Ken', 'Radia', 'Linus'];

export const products = Array.from({ length: 40 }, (_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  priceCents: 250 + ((i * 137) % 4000),
}));

export const orders = Array.from({ length: 60 }, (_, i) => ({
  id: i + 1,
  customer: CUSTOMERS[i % CUSTOMERS.length],
  placedAt: new Date(Date.UTC(2026, 0, 1 + i)).toISOString(),
}));

export const lines = orders.flatMap((order) =>
  Array.from({ length: 8 }, (_, j) => ({
    orderId: order.id,
    productId: ((order.id * 7 + j * 3) % products.length) + 1,
    quantity: 1 + ((order.id + j) % 4),
  })),
);

export async function listOrders() {
  await roundTrip();
  return orders.map((o) => ({ ...o, lineCount: lines.filter((l) => l.orderId === o.id).length }));
}

export async function findOrder(id) {
  await roundTrip();
  return orders.find((o) => o.id === id);
}

/** An order's lines, each with its product's price, in one query. */
export async function orderLines(orderId) {
  await roundTrip();
  return lines
    .filter((l) => l.orderId === orderId)
    .map((l) => ({ ...l, priceCents: products.find((p) => p.id === l.productId).priceCents }));
}

export async function findProduct(id) {
  await roundTrip();
  return products.find((p) => p.id === id);
}

export async function ordersByCustomer(query) {
  await roundTrip();
  const q = query.toLowerCase();
  return orders.filter((o) => o.customer.toLowerCase().includes(q));
}

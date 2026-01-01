export const PRODUCTS = [
  { id: 1, name: 'Kettle', priceCents: 2499, stock: 12 },
  { id: 2, name: 'Teapot', priceCents: 1850, stock: 4 },
  { id: 3, name: 'Mug', priceCents: 699, stock: 40 },
  { id: 4, name: 'Tea towel', priceCents: 450, stock: 0 },
];

/** A fresh store per app, so each test file starts from the same orders. */
export function createStore() {
  const products = PRODUCTS.map((p) => ({ ...p }));
  const orders = new Map();
  let nextId = 1;

  return {
    products: () => products,
    product: (id) => products.find((p) => p.id === id),
    order: (id) => orders.get(id),
    cancelOrder(order) {
      order.status = 'cancelled';
      this.product(order.productId).stock += order.quantity;
      return order;
    },
    placeOrder(product, quantity) {
      product.stock -= quantity;
      const order = {
        id: nextId++,
        productId: product.id,
        quantity,
        status: 'placed',
        totalCents: product.priceCents * quantity,
        currency: 'USD',
      };
      orders.set(order.id, order);
      return order;
    },
  };
}

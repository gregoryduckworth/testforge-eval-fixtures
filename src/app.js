import { createServer } from 'node:http';
import { createStore } from './store.js';

function send(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify(body));
}

async function readJson(request) {
  let text = '';
  for await (const chunk of request) text += chunk;
  return JSON.parse(text);
}

function orderView(order) {
  return {
    id: order.id,
    productId: order.productId,
    quantity: order.quantity,
    status: order.status,
    total: { amount: order.totalCents, currency: order.currency },
  };
}

async function placeOrder(store, request, response) {
  let body;
  try {
    body = await readJson(request);
  } catch {
    return send(response, 400, { error: 'The body must be JSON' });
  }
  if (!Number.isInteger(body?.quantity) || body.quantity < 1) {
    return send(response, 400, { error: 'quantity must be a whole number, at least 1' });
  }
  const product = store.product(body.productId);
  if (!product) return send(response, 404, { error: 'No such product' });
  if (body.quantity > product.stock) return send(response, 409, { error: 'Not enough stock' });
  const order = store.placeOrder(product, body.quantity);
  return send(response, 201, { id: order.id, status: order.status });
}

/** The API as an http.Server; call listen() on it. */
export function createApp(store = createStore()) {
  return createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const { pathname } = url;
    if (request.method === 'GET' && pathname === '/products') {
      const q = (url.searchParams.get('q') ?? '').toLowerCase();
      return send(response, 200, { items: store.products().filter((p) => p.name.toLowerCase().includes(q)) });
    }
    const product = /^\/products\/(\d+)$/.exec(pathname);
    if (request.method === 'GET' && product) {
      const found = store.product(Number(product[1]));
      return found ? send(response, 200, found) : send(response, 404, { error: 'No such product' });
    }
    if (request.method === 'POST' && pathname === '/orders') return placeOrder(store, request, response);
    const order = /^\/orders\/(\d+)$/.exec(pathname);
    if (request.method === 'GET' && order) {
      const found = store.order(Number(order[1]));
      return found ? send(response, 200, orderView(found)) : send(response, 404, { error: 'No such order' });
    }
    const cancel = /^\/orders\/(\d+)\/cancel$/.exec(pathname);
    if (request.method === 'POST' && cancel) {
      const found = store.order(Number(cancel[1]));
      if (!found) return send(response, 404, { error: 'No such order' });
      if (found.status === 'cancelled') return send(response, 409, { error: 'The order is already cancelled' });
      return send(response, 200, orderView(store.cancelOrder(found)));
    }
    return send(response, 404, { error: 'Not found' });
  });
}

import { createServer } from 'node:http';
import { findOrder, findProduct, listOrders, orderLines } from './store.js';
import { searchOrders } from './search.js';

const send = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};

async function route(req, res) {
  const url = new URL(req.url, 'http://localhost');
  if (req.method !== 'GET') return send(res, 405, { error: 'method not allowed' });
  if (url.pathname === '/health') return send(res, 200, { status: 'ok' });
  if (url.pathname === '/orders') return send(res, 200, { orders: await listOrders() });
  if (url.pathname === '/search') {
    const q = url.searchParams.get('q') ?? '';
    if (!q) return send(res, 400, { error: 'q is required' });
    return send(res, 200, { orders: await searchOrders(q) });
  }
  const match = url.pathname.match(/^\/orders\/(\d+)$/);
  if (match) {
    const order = await findOrder(Number(match[1]));
    if (!order) return send(res, 404, { error: 'no such order' });
    const items = await orderLines(order.id);
    for (const line of items) line.productName = (await findProduct(line.productId)).name;
    const totalCents = items.reduce((sum, l) => sum + l.priceCents * l.quantity, 0);
    return send(res, 200, { ...order, lines: items, totalCents });
  }
  return send(res, 404, { error: 'not found' });
}

export function createApp() {
  return createServer((req, res) => {
    route(req, res).catch((error) => send(res, 500, { error: error.message }));
  });
}

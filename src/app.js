import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { findOrder, listOrders, orderLines, productNames } from './store.js';
import { searchOrders } from './search.js';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const send = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};

async function route(req, res) {
  const url = new URL(req.url, 'http://localhost');
  if (req.method !== 'GET') return send(res, 405, { error: 'method not allowed' });
  if (url.pathname === '/health') return send(res, 200, { status: 'ok', version });
  if (url.pathname === '/orders') return send(res, 200, { orders: await listOrders() });
  if (url.pathname === '/search') {
    const q = url.searchParams.get('q') ?? '';
    if (!q) return send(res, 400, { error: 'q is required' });
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 20), 50);
    const offset = Number(url.searchParams.get('offset') ?? 0);
    if (!Number.isInteger(limit) || !Number.isInteger(offset) || limit < 1 || offset < 0)
      return send(res, 400, { error: 'limit and offset are whole numbers' });
    const found = await searchOrders(q);
    return send(res, 200, { orders: found.slice(offset, offset + limit), total: found.length });
  }
  const match = url.pathname.match(/^\/orders\/(\d+)$/);
  if (match) {
    const order = await findOrder(Number(match[1]));
    if (!order) return send(res, 404, { error: 'no such order' });
    const items = await orderLines(order.id);
    const names = await productNames(items.map((line) => line.productId));
    for (const line of items) line.productName = names.get(line.productId);
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

import { createServer } from 'node:http';
import { PRODUCTS } from './catalogue.js';

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 50;

function send(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify(body));
}

function wholeNumber(value, fallback) {
  if (value === null) return fallback;
  return /^\d+$/.test(value) ? Number(value) : Number.NaN;
}

function listProducts(url, response) {
  const q = (url.searchParams.get('q') ?? '').toLowerCase();
  const limit = wholeNumber(url.searchParams.get('limit'), DEFAULT_LIMIT);
  const offset = wholeNumber(url.searchParams.get('offset'), 0);
  if (Number.isNaN(limit) || limit < 1 || Number.isNaN(offset)) {
    return send(response, 400, { error: 'limit and offset must be whole numbers, limit at least 1' });
  }
  const matches = PRODUCTS.filter((p) => p.name.toLowerCase().includes(q));
  const page = matches.slice(offset, offset + Math.min(limit, MAX_LIMIT));
  return send(response, 200, { total: matches.length, items: page });
}

async function readJson(request) {
  let text = '';
  for await (const chunk of request) text += chunk;
  return JSON.parse(text);
}

async function createOrder(request, response) {
  let body;
  try {
    body = await readJson(request);
  } catch {
    return send(response, 400, { error: 'The body must be JSON' });
  }
  const product = PRODUCTS.find((p) => p.id === body?.productId);
  if (!Number.isInteger(body?.quantity) || body.quantity < 1) {
    return send(response, 400, { error: 'quantity must be a whole number, at least 1' });
  }
  if (!product) return send(response, 404, { error: 'No such product' });
  if (body.quantity > product.stock) return send(response, 409, { error: 'Not enough stock' });
  product.stock -= body.quantity;
  return send(response, 201, {
    productId: product.id,
    quantity: body.quantity,
    totalCents: product.priceCents * body.quantity,
  });
}

/** The API as an http.Server; call listen() on it. */
export function createApp() {
  return createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    if (request.method === 'GET' && url.pathname === '/products') return listProducts(url, response);
    const one = /^\/products\/(\d+)$/.exec(url.pathname);
    if (request.method === 'GET' && one) {
      const product = PRODUCTS.find((p) => p.id === Number(one[1]));
      return product ? send(response, 200, product) : send(response, 404, { error: 'No such product' });
    }
    if (request.method === 'POST' && url.pathname === '/orders') return createOrder(request, response);
    return send(response, 404, { error: 'Not found' });
  });
}

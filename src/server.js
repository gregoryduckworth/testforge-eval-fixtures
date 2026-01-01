import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCart } from './cart.js';
import { findProduct } from './catalogue.js';
import { findOrder, placeOrder } from './orders.js';
import {
  cartPage,
  cataloguePage,
  checkoutPage,
  confirmationPage,
  errorPage,
  notFoundPage,
  productPage,
} from './pages.js';

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const port = Number(process.env.PORT ?? 4175);
const host = process.env.HOST ?? 'localhost';

const html = (response, status, body) => response.writeHead(status, { 'content-type': 'text/html' }).end(body);

async function readForm(request) {
  let body = '';
  for await (const chunk of request) body += chunk;
  return Object.fromEntries(new URLSearchParams(body));
}

async function handle(request, response) {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');
  const lines = readCart(request.headers.cookie);
  const product = /^\/products\/([\w-]+)$/.exec(pathname);
  const order = /^\/orders\/(\d+)$/.exec(pathname);

  if (request.method === 'POST' && pathname === '/orders') {
    if (!lines.length) return html(response, 400, cartPage(lines));
    const form = await readForm(request);
    const placed = placeOrder({ lines, name: form.name, email: form.email, address: form.address });
    response.writeHead(303, { location: `/orders/${placed.id}`, 'set-cookie': 'cart=; Path=/; Max-Age=0' }).end();
    return;
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') return html(response, 405, notFoundPage(lines));
  if (pathname === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' }).end('{"status":"ok"}');
    return;
  }
  if (pathname === '/app.js') {
    response.writeHead(200, { 'content-type': 'text/javascript' }).end(await readFile(path.join(publicDir, 'app.js')));
    return;
  }
  if (pathname === '/') return html(response, 200, cataloguePage(lines));
  if (product && findProduct(product[1])) return html(response, 200, productPage(findProduct(product[1]), lines));
  if (pathname === '/cart') return html(response, 200, cartPage(lines));
  if (pathname === '/checkout') return html(response, 200, checkoutPage(lines));
  if (order && findOrder(Number(order[1]))) return html(response, 200, confirmationPage(findOrder(Number(order[1]))));
  return html(response, 404, notFoundPage(lines));
}

createServer((request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');
  response.on('finish', () => console.log(`${request.method} ${pathname} ${response.statusCode}`));
  handle(request, response).catch((error) => {
    console.error(error);
    if (!response.headersSent) html(response, 500, errorPage());
  });
}).listen(port, host, () => console.log(`shop on http://${host}:${port}`));

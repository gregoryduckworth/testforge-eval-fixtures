import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const port = Number(process.env.PORT ?? 4174);
/** Each page of the shop, by its path. */
const pages = { '/': 'index.html', '/cart': 'cart.html', '/about': 'about.html', '/contact': 'contact.html' };

createServer(async (request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');
  if (pathname === '/sitemap.xml') {
    const base = `http://localhost:${port}`;
    const urls = Object.keys(pages).map((p) => `<url><loc>${base}${p}</loc></url>`);
    response.writeHead(200, { 'content-type': 'application/xml' });
    response.end(`<?xml version="1.0" encoding="UTF-8"?><urlset>${urls.join('')}</urlset>`);
    return;
  }
  const file = pages[pathname.replace(/\/+$/, '') || '/'];
  if (!file) {
    response.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
    return;
  }
  response.writeHead(200, { 'content-type': 'text/html' }).end(await readFile(path.join(root, file)));
}).listen(port, () => console.log(`shop on http://localhost:${port}`));

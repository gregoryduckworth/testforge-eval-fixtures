// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp, DEFAULT_LIMIT, MAX_LIMIT } from '../src/app.js';

let server;
let base;

beforeAll(async () => {
  server = createApp();
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}`;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

/** GET /products with the given query parameters, URL-encoded. */
async function listProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${base}/products${query ? `?${query}` : ''}`);
  return { status: response.status, body: await response.json() };
}

/** `count` ids starting at `first`, `step` apart. */
function idsFrom(first, step, count) {
  return Array.from({ length: count }, (_, k) => first + step * k);
}

/** The status GET /products answers for each value of one parameter. */
async function statusesFor(name, values) {
  const statuses = {};
  for (const value of values) {
    statuses[value] = (await listProducts({ [name]: value })).status;
  }
  return statuses;
}

describe('GET /products/:id', () => {
  it('returns the product', async () => {
    const response = await fetch(`${base}/products/1`);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: 1, name: 'Kettle 1' });
  });

  it('is 404 for an unknown id', async () => {
    const response = await fetch(`${base}/products/999`);
    expect(response.status).toBe(404);
  });
});

describe('GET /products', () => {
  // The catalogue has 120 products: 8 names in turn (Kettle, Toaster, Teapot, Mug,
  // Coffee grinder, Milk frother, Tea strainer, Cafetière), each numbered 1 to 15.

  it('matches product names containing q in any case', async () => {
    const { status, body } = await listProducts({ q: 'TEAPOT', limit: '50' });

    expect(status).toBe(200);
    expect(body.total).toBe(15);
    expect(body.items.map((p) => p.id)).toEqual(idsFrom(3, 8, 15));
    expect(body.items.map((p) => p.name)).toEqual(idsFrom(1, 1, 15).map((n) => `Teapot ${n}`));
  });

  it('matches q in the middle of a product name', async () => {
    const { status, body } = await listProducts({ q: 'grind', limit: '50' });

    expect(status).toBe(200);
    expect(body.total).toBe(15);
    expect(body.items.map((p) => p.id)).toEqual(idsFrom(5, 8, 15));
    expect(body.items.map((p) => p.name)).toEqual(idsFrom(1, 1, 15).map((n) => `Coffee grinder ${n}`));
  });

  it('returns no items and a total of 0 when nothing matches q', async () => {
    const { status, body } = await listProducts({ q: 'bicycle' });

    expect(status).toBe(200);
    expect(body).toEqual({ total: 0, items: [] });
  });

  it('lists every product when q is absent', async () => {
    const { status, body } = await listProducts();

    expect(status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.items.map((p) => p.id)).toEqual(idsFrom(1, 1, DEFAULT_LIMIT));
  });

  it('returns the page at offset with limit items and the total of all matches', async () => {
    // "tea" matches Teapot (ids 3, 11, ...) and Tea strainer (ids 7, 15, ...): 30 products.
    const { status, body } = await listProducts({ q: 'tea', limit: '5', offset: '10' });

    expect(status).toBe(200);
    expect(body.total).toBe(30);
    expect(body.items.map((p) => p.id)).toEqual([43, 47, 51, 55, 59]);
  });

  it('caps a large limit at MAX_LIMIT', async () => {
    const { status, body } = await listProducts({ limit: '1000' });

    expect(status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.items.map((p) => p.id)).toEqual(idsFrom(1, 1, MAX_LIMIT));
  });

  it('returns no items but the full total when offset is past the last match', async () => {
    const { status, body } = await listProducts({ offset: '500' });

    expect(status).toBe(200);
    expect(body).toEqual({ total: 120, items: [] });
  });

  it('refuses a limit that is not a whole number with 400', async () => {
    const statuses = await statusesFor('limit', ['abc', '2.5', '-1', '']);

    expect(statuses).toEqual({ abc: 400, 2.5: 400, '-1': 400, '': 400 });
  });

  it('refuses a limit of 0 with 400', async () => {
    const { status, body } = await listProducts({ limit: '0' });

    expect(status).toBe(400);
    expect(Object.keys(body)).toEqual(['error']);
  });

  it('refuses an offset that is not a whole number with 400', async () => {
    const statuses = await statusesFor('offset', ['abc', '1.5', '-1']);

    expect(statuses).toEqual({ abc: 400, 1.5: 400, '-1': 400 });
  });

  it('accepts a limit of 1 and an offset of 0', async () => {
    const { status, body } = await listProducts({ limit: '1', offset: '0' });

    expect(status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.items.map((p) => p.id)).toEqual([1]);
  });
});

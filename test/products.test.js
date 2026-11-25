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

/** Ids 1..n: the first n products of the seeded catalogue. */
const firstIds = (n) => Array.from({ length: n }, (_, i) => i + 1);

/** GET /products with the given query parameters, URL-encoded. */
async function listProducts(params = {}) {
  const response = await fetch(`${base}/products?${new URLSearchParams(params)}`);
  return { status: response.status, body: await response.json() };
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

describe('GET /products search', () => {
  // The seeded catalogue cycles through 8 names, 15 of each: Teapot is ids 3, 11, ...,
  // Tea strainer ids 7, 15, ..., and Cafetière ids 8, 16, ..., 120.
  const teaIds = Array.from({ length: 30 }, (_, k) => 3 + 4 * k);

  it('matches names containing q in any case', async () => {
    const { status, body } = await listProducts({ q: 'TeA', limit: '50' });

    expect(status).toBe(200);
    expect(body.total).toBe(30);
    expect(body.items.map((p) => p.id)).toEqual(teaIds);
    expect(body.items[0]).toMatchObject({ id: 3, name: 'Teapot 1' });
    expect(body.items[1]).toMatchObject({ id: 7, name: 'Tea strainer 1' });
  });

  it('matches a non-ASCII name in a different case', async () => {
    const { status, body } = await listProducts({ q: 'CAFETIÈRE', limit: '50' });

    expect(status).toBe(200);
    expect(body.total).toBe(15);
    expect(body.items.map((p) => p.id)).toEqual(Array.from({ length: 15 }, (_, k) => 8 + 8 * k));
    expect(body.items[0]).toMatchObject({ id: 8, name: 'Cafetière 1' });
  });

  it('returns no items and a total of 0 when nothing matches', async () => {
    const { status, body } = await listProducts({ q: 'blender' });

    expect(status).toBe(200);
    expect(body).toEqual({ total: 0, items: [] });
  });

  it('lists every product when q is absent', async () => {
    const { status, body } = await listProducts();

    expect(status).toBe(200);
    expect(DEFAULT_LIMIT).toBe(20);
    expect(body.total).toBe(120);
    expect(body.items.map((p) => p.id)).toEqual(firstIds(DEFAULT_LIMIT));
  });
});

describe('GET /products paging', () => {
  it('returns the page at offset with limit items and the total of all matches', async () => {
    const { status, body } = await listProducts({ q: 'tea', limit: '5', offset: '10' });

    expect(status).toBe(200);
    expect(body.total).toBe(30);
    expect(body.items.map((p) => p.id)).toEqual([43, 47, 51, 55, 59]);
  });

  it('caps a large limit at MAX_LIMIT', async () => {
    const { status, body } = await listProducts({ limit: '1000' });

    expect(status).toBe(200);
    expect(MAX_LIMIT).toBe(50);
    expect(body.total).toBe(120);
    expect(body.items.map((p) => p.id)).toEqual(firstIds(MAX_LIMIT));
  });

  it('returns no items past the last match', async () => {
    const { status, body } = await listProducts({ q: 'tea', offset: '30' });

    expect(status).toBe(200);
    expect(body).toEqual({ total: 30, items: [] });
  });

  it('accepts a limit of 1', async () => {
    const { status, body } = await listProducts({ limit: '1', offset: '0' });

    expect(status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toMatchObject({ id: 1, name: 'Kettle 1' });
  });
});

describe('GET /products validation', () => {
  it("refuses a limit that isn't a whole number with 400", async () => {
    for (const limit of ['1.5', 'abc', '-1']) {
      const { status } = await listProducts({ limit });
      expect(status, `limit=${limit}`).toBe(400);
    }
  });

  it("refuses an offset that isn't a whole number with 400", async () => {
    for (const offset of ['2.5', 'abc', '-1']) {
      const { status } = await listProducts({ offset });
      expect(status, `offset=${offset}`).toBe(400);
    }
  });

  it('refuses a limit of 0 with 400', async () => {
    const { status } = await listProducts({ limit: '0' });
    expect(status).toBe(400);
  });
});

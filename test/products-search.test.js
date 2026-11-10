// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11
import { describe, expect, it } from 'vitest';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../src/app.js';
import { PRODUCTS } from '../src/catalogue.js';
import { useApp } from './support/server.js';

const appUrl = useApp();

function getProducts(params) {
  const query = new URLSearchParams(params).toString();
  return fetch(`${appUrl()}/products${query ? `?${query}` : ''}`);
}

async function listProducts(params) {
  const response = await getProducts(params);
  const body = await response.json();
  expect(response.status, JSON.stringify(body)).toBe(200);
  return body;
}

async function statusesFor(name, values) {
  const statuses = {};
  for (const value of values) {
    statuses[value] = (await getProducts({ [name]: value })).status;
  }
  return statuses;
}

const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

describe('GET /products', () => {
  it('matches names containing q in any case', async () => {
    const body = await listProducts({ q: 'KeTtLe' });

    expect(body.total).toBe(15);
    expect(body.items.map((p) => p.name)).toEqual(range(1, 15).map((n) => `Kettle ${n}`));
  });

  it('lists every product when q is absent', async () => {
    const body = await listProducts({});

    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items.map((p) => p.id)).toEqual(range(1, DEFAULT_LIMIT));
  });

  it('returns no items and total 0 when nothing matches', async () => {
    const body = await listProducts({ q: 'no-such-product' });

    expect(body).toEqual({ total: 0, items: [] });
  });

  it('returns the page at offset with limit items', async () => {
    const body = await listProducts({ limit: '5', offset: '10' });

    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items.map((p) => p.id)).toEqual(range(11, 15));
  });

  it('reports the total number of matches, not the page size', async () => {
    const body = await listProducts({ q: 'tea', limit: '2' });

    expect(body.total).toBe(30);
    expect(body.items.map((p) => p.name)).toEqual(['Teapot 1', 'Tea strainer 1']);
  });

  it('returns an empty page when offset is past the last match', async () => {
    const body = await listProducts({ q: 'kettle', offset: '15' });

    expect(body).toEqual({ total: 15, items: [] });
  });

  it('caps a large limit at the maximum page size', async () => {
    const body = await listProducts({ limit: '1000' });

    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items.map((p) => p.id)).toEqual(range(1, MAX_LIMIT));
  });

  it('accepts a limit of 1', async () => {
    const body = await listProducts({ limit: '1' });

    expect(body.items.map((p) => p.id)).toEqual([1]);
  });

  it('refuses a limit below 1 with 400', async () => {
    const response = await getProducts({ limit: '0' });

    expect(response.status).toBe(400);
  });

  it("refuses a limit that isn't a whole number with 400", async () => {
    const statuses = await statusesFor('limit', ['abc', '2.5', '-3']);

    expect(statuses).toEqual({ abc: 400, 2.5: 400, '-3': 400 });
  });

  it("refuses an offset that isn't a whole number with 400", async () => {
    const statuses = await statusesFor('offset', ['abc', '1.5', '-1']);

    expect(statuses).toEqual({ abc: 400, 1.5: 400, '-1': 400 });
  });
});

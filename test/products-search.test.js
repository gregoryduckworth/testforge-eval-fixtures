// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEFAULT_LIMIT, MAX_LIMIT, createApp } from '../src/app.js';
import { PRODUCTS } from '../src/catalogue.js';

let server;
let base;

beforeAll(async () => {
  server = createApp();
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}`;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

const get = (query = '') => fetch(`${base}/products${query}`);
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

describe('GET /products', () => {
  it('matches q against product names in any case', async () => {
    const response = await get(`?q=${encodeURIComponent('kEtTlE')}&limit=${MAX_LIMIT}`);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(15);
    expect(body.items.map((p) => p.name)).toEqual(range(1, 15).map((n) => `Kettle ${n}`));
  });

  it('lists every product when q is absent', async () => {
    const response = await get();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items.map((p) => p.id)).toEqual(range(1, DEFAULT_LIMIT));
  });

  it('returns the page selected by limit and offset with the total of all matches', async () => {
    const body = await (await get('?limit=5&offset=10')).json();
    expect(body.items.map((p) => p.id)).toEqual(range(11, 15));
    expect(body.total).toBe(PRODUCTS.length);
  });

  it('pages through search results with the total of matches', async () => {
    const response = await get('?q=mug&limit=4&offset=12');
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(15);
    expect(body.items.map((p) => p.name)).toEqual(['Mug 13', 'Mug 14', 'Mug 15']);
  });

  it('returns no items but the total when offset is past the last match', async () => {
    const response = await get('?q=kettle&offset=15');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 15, items: [] });
  });

  it('caps a limit above the maximum', async () => {
    const response = await get(`?limit=${MAX_LIMIT * 20}`);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.items.map((p) => p.id)).toEqual(range(1, MAX_LIMIT));
    expect(body.total).toBe(PRODUCTS.length);
  });

  it('refuses a limit or offset that is not a whole number with 400', async () => {
    const queries = ['limit=abc', 'limit=2.5', 'limit=-3', 'offset=abc', 'offset=1.5', 'offset=-1'];
    const statuses = await Promise.all(queries.map(async (query) => [query, (await get(`?${query}`)).status]));
    expect(Object.fromEntries(statuses)).toEqual(Object.fromEntries(queries.map((query) => [query, 400])));
  });

  it('refuses a limit of 0 with 400', async () => {
    const response = await get('?limit=0');
    expect(response.status).toBe(400);
  });

  it('accepts a limit of 1 and an offset of 0', async () => {
    const response = await get('?limit=1&offset=0');
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.items.map((p) => p.id)).toEqual([1]);
    expect(body.total).toBe(PRODUCTS.length);
  });
});

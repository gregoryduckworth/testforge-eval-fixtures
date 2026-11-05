// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8
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

const ids = (items) => items.map((p) => p.id);
const matching = (needle) => PRODUCTS.filter((p) => p.name.toLowerCase().includes(needle));

async function get(query) {
  const response = await fetch(`${base}/products?${query}`);
  return { status: response.status, body: await response.json() };
}

describe('GET /products search and paging', () => {
  it('matches q against product names regardless of case', async () => {
    const expected = matching('tea');
    const { status, body } = await get(`q=${encodeURIComponent('tEa')}&limit=${MAX_LIMIT}`);
    expect(status).toBe(200);
    expect(body.total).toBe(expected.length);
    expect(ids(body.items)).toEqual(ids(expected));
    expect(new Set(body.items.map((p) => p.name.replace(/ \d+$/, '')))).toEqual(
      new Set(['Teapot', 'Tea strainer']),
    );
  });

  it('lists every product when q is absent', async () => {
    const { status, body } = await get('');
    expect(status).toBe(200);
    expect(body.total).toBe(PRODUCTS.length);
    expect(ids(body.items)).toEqual(ids(PRODUCTS.slice(0, DEFAULT_LIMIT)));
  });

  it('returns the page at offset with limit items and the total of all matches', async () => {
    const expected = matching('kettle');
    const { status, body } = await get('q=kettle&limit=4&offset=3');
    expect(status).toBe(200);
    expect(body.total).toBe(expected.length);
    expect(ids(body.items)).toEqual(ids(expected.slice(3, 7)));
  });

  it('returns no items but the full total when offset is past the last match', async () => {
    const expected = matching('kettle');
    const { status, body } = await get(`q=kettle&offset=${expected.length}`);
    expect(status).toBe(200);
    expect(body.items).toEqual([]);
    expect(body.total).toBe(expected.length);
  });

  it('caps a limit above the maximum', async () => {
    const { status, body } = await get(`limit=${MAX_LIMIT * 20}`);
    expect(status).toBe(200);
    expect(body.items).toHaveLength(MAX_LIMIT);
    expect(ids(body.items)).toEqual(ids(PRODUCTS.slice(0, MAX_LIMIT)));
    expect(body.total).toBe(PRODUCTS.length);
  });

  it('refuses a limit or offset that is not a whole number with 400', async () => {
    for (const query of ['limit=abc', 'limit=2.5', 'offset=abc', 'offset=1.5', 'offset=-1']) {
      const { status } = await get(query);
      expect(status, query).toBe(400);
    }
  });

  it('refuses a limit below 1 with 400', async () => {
    const { status } = await get('limit=0');
    expect(status).toBe(400);
  });

  it('accepts limit 1 and offset 0 as the smallest valid page', async () => {
    const { status, body } = await get('limit=1&offset=0');
    expect(status).toBe(200);
    expect(ids(body.items)).toEqual([PRODUCTS[0].id]);
    expect(body.total).toBe(PRODUCTS.length);
  });
});

// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp, DEFAULT_LIMIT, MAX_LIMIT } from '../src/app.js';
import { PRODUCTS } from '../src/catalogue.js';

let server;
let base;

beforeAll(async () => {
  server = createApp();
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}`;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

async function getProducts(params) {
  const response = await fetch(`${base}/products?${new URLSearchParams(params)}`);
  return { status: response.status, body: await response.json() };
}

const ids = (products) => products.map((p) => p.id);
const teaMatches = PRODUCTS.filter((p) => p.name.toLowerCase().includes('tea'));

describe('GET /products search', () => {
  it('matches names containing q in any case', async () => {
    const { status, body } = await getProducts({ q: 'TEA', limit: '50' });

    expect(status).toBe(200);
    expect(teaMatches).toHaveLength(30);
    expect(body.total).toBe(30);
    expect(ids(body.items)).toEqual(ids(teaMatches));
    for (const item of body.items) expect(item.name.toLowerCase()).toContain('tea');
  });

  it('lists every product when q is absent', async () => {
    const { status, body } = await getProducts({});

    expect(status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.total).toBe(PRODUCTS.length);
    expect(ids(body.items)).toEqual(ids(PRODUCTS.slice(0, DEFAULT_LIMIT)));
  });
});

describe('GET /products paging', () => {
  it('returns the page selected by limit and offset with the total of all matches', async () => {
    const { status, body } = await getProducts({ q: 'tea', limit: '5', offset: '10' });

    expect(status).toBe(200);
    expect(body.total).toBe(30);
    expect(ids(body.items)).toEqual(ids(teaMatches.slice(10, 15)));
  });

  it('caps a large limit at the maximum page size', async () => {
    const { status, body } = await getProducts({ limit: '1000' });

    expect(status).toBe(200);
    // The cap follows MAX_LIMIT in src/app.js (50); README.md's "up to 100" disagrees with the code.
    expect(MAX_LIMIT).toBe(50);
    expect(body.items).toHaveLength(MAX_LIMIT);
    expect(ids(body.items)).toEqual(ids(PRODUCTS.slice(0, MAX_LIMIT)));
    expect(body.total).toBe(120);
  });

  it('returns no items but the full total for an offset past the end', async () => {
    const { status, body } = await getProducts({ offset: '200' });

    expect(status).toBe(200);
    expect(body.items).toEqual([]);
    expect(body.total).toBe(120);
  });
});

describe('GET /products validation', () => {
  describe('refuses a limit or offset that is not a whole number with 400', () => {
    it.each([
      { name: 'limit', value: '2.5' },
      { name: 'limit', value: 'abc' },
      { name: 'limit', value: '-1' },
      { name: 'offset', value: '1.5' },
      { name: 'offset', value: 'abc' },
      { name: 'offset', value: '-1' },
    ])('$name=$value', async ({ name, value }) => {
      const { status, body } = await getProducts({ [name]: value });

      expect(status).toBe(400);
      expect(typeof body.error).toBe('string');
      expect(body).not.toHaveProperty('items');
    });
  });

  describe('refuses a limit of 0 with 400 and accepts a limit of 1', () => {
    it('refuses limit=0', async () => {
      const zero = await getProducts({ limit: '0' });

      expect(zero.status).toBe(400);
      expect(zero.body).not.toHaveProperty('items');
    });

    it('accepts limit=1 and returns exactly the first product', async () => {
      const one = await getProducts({ limit: '1' });

      expect(one.status).toBe(200);
      expect(ids(one.body.items)).toEqual([1]);
    });
  });
});

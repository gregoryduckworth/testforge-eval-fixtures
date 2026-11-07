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

const getProducts = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetch(`${base}/products${query ? `?${query}` : ''}`, {
    signal: AbortSignal.timeout(5000),
  });
};

const range = (start, step, count) =>
  Array.from({ length: count }, (_, i) => start + i * step);

describe('GET /products search and paging', () => {
  it('matches names containing q regardless of case', async () => {
    const response = await getProducts({ q: 'kETtLe', limit: String(MAX_LIMIT) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total).toBe(15);
    expect(body.items.every((p) => p.name.startsWith('Kettle '))).toBe(true);
    expect(body.items.map((p) => p.id)).toEqual(range(1, 8, 15));
  });

  it('matches q anywhere in the name, not only at the start', async () => {
    const response = await getProducts({ q: 'strainer', limit: String(MAX_LIMIT) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total).toBe(15);
    expect(body.items.map((p) => p.name)).toEqual(
      range(1, 1, 15).map((n) => `Tea strainer ${n}`),
    );
    expect(body.items.map((p) => p.id)).toEqual(range(7, 8, 15));
  });

  it('returns no items and a total of 0 when nothing matches', async () => {
    const response = await getProducts({ q: 'bicycle' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 0, items: [] });
  });

  it('lists every product when q is omitted', async () => {
    const response = await getProducts();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items.map((p) => p.id)).toEqual(range(1, 1, DEFAULT_LIMIT));
  });

  it('returns the requested page with the total of all matches', async () => {
    const response = await getProducts({ q: 'tea', limit: '10', offset: '10' });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total).toBe(30);
    expect(body.items.map((p) => p.id)).toEqual(range(43, 4, 10));
  });

  it('returns no items for an offset past the last match', async () => {
    const response = await getProducts({ offset: String(PRODUCTS.length) });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: PRODUCTS.length, items: [] });
  });

  it('caps a limit above the maximum', async () => {
    const response = await getProducts({ limit: '1000' });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items).toHaveLength(MAX_LIMIT);
    expect(body.items.map((p) => p.id)).toEqual(range(1, 1, MAX_LIMIT));
  });

  describe("refuses a limit or offset that isn't a whole number, or a limit below 1, with 400", () => {
    it.each([
      { name: 'limit', value: '0' },
      { name: 'limit', value: '-1' },
      { name: 'limit', value: '2.5' },
      { name: 'limit', value: 'abc' },
      { name: 'limit', value: '' },
      { name: 'offset', value: '-1' },
      { name: 'offset', value: '1.5' },
      { name: 'offset', value: 'abc' },
    ])('$name=$value', async ({ name, value }) => {
      const response = await getProducts({ [name]: value });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(typeof body.error).toBe('string');
    });
  });

  it('accepts a limit of 1 and an offset of 0', async () => {
    const response = await getProducts({ limit: '1', offset: '0' });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items.map((p) => p.id)).toEqual([1]);
  });
});

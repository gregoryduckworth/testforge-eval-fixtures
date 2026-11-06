// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8
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

async function listProducts(params) {
  const response = await fetch(`${base}/products?${new URLSearchParams(params)}`);
  return { status: response.status, body: await response.json() };
}

describe('GET /products', () => {
  it('matches products whose name contains q in any case', async () => {
    const { status, body } = await listProducts({ q: 'tEA', limit: String(MAX_LIMIT) });

    expect(status).toBe(200);
    expect(body.total).toBe(30);
    // Teapot n has id 8n-5 and Tea strainer n has id 8n-1 (see src/catalogue.js); results are by id.
    const expected = Array.from({ length: 15 }, (_, i) => [
      [8 * (i + 1) - 5, `Teapot ${i + 1}`],
      [8 * (i + 1) - 1, `Tea strainer ${i + 1}`],
    ]).flat();
    expect(body.items.map((p) => [p.id, p.name])).toEqual(expected);
    expect(body.items.every((p) => p.name.toLowerCase().includes('tea'))).toBe(true);

    // A match in the middle of the name counts too: 'sTRAINER' is only inside 'Tea strainer n'.
    const midName = await listProducts({ q: 'sTRAINER', limit: String(MAX_LIMIT) });
    expect(midName.status).toBe(200);
    expect(midName.body.total).toBe(15);
    expect(midName.body.items.map((p) => [p.id, p.name])).toEqual(
      Array.from({ length: 15 }, (_, i) => [8 * (i + 1) - 1, `Tea strainer ${i + 1}`]),
    );
  });

  it('lists every product when q is absent', async () => {
    const { status, body } = await listProducts({});

    expect(status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.items).toEqual(PRODUCTS.slice(0, DEFAULT_LIMIT));
  });

  it('returns the page at offset with limit items and the total of all matches', async () => {
    const { status, body } = await listProducts({ q: 'kettle', limit: '4', offset: '10' });

    expect(status).toBe(200);
    expect(body.total).toBe(15);
    expect(body.items.map((p) => [p.id, p.name])).toEqual([
      [81, 'Kettle 11'],
      [89, 'Kettle 12'],
      [97, 'Kettle 13'],
      [105, 'Kettle 14'],
    ]);
  });

  it('returns no items but the full total when offset is past the last match', async () => {
    const { status, body } = await listProducts({ q: 'kettle', offset: '15' });

    expect(status).toBe(200);
    expect(body).toEqual({ total: 15, items: [] });
  });

  it('caps a large limit at the maximum page size', async () => {
    // The cap is 50 (confirmed for API-31; the README's "up to 100" is out of date).
    expect(MAX_LIMIT).toBe(50);

    const { status, body } = await listProducts({ limit: '1000' });

    expect(status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.items).toEqual(PRODUCTS.slice(0, MAX_LIMIT));
  });

  describe('refuses a limit that is not a whole number with 400', () => {
    it.each(['2.5', 'abc', '-1'])('limit=%s', async (limit) => {
      const { status } = await listProducts({ limit });

      expect(status).toBe(400);
    });
  });

  describe('refuses an offset that is not a whole number with 400', () => {
    it.each(['1.5', 'x', '-1'])('offset=%s', async (offset) => {
      const { status } = await listProducts({ offset });

      expect(status).toBe(400);
    });
  });

  it('refuses a limit of 0 with 400', async () => {
    const { status } = await listProducts({ limit: '0' });

    expect(status).toBe(400);
  });
});

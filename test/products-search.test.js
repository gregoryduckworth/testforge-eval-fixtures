// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11
import { describe, expect, it } from 'vitest';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../src/app.js';
import { useServer } from './helpers/server.js';

const server = useServer();

/** GET /products with the given query parameters, URL-encoded. */
async function listProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${server.base()}/products${query ? `?${query}` : ''}`);
  return { status: response.status, body: await response.json() };
}

/** `${name} ${from}` .. `${name} ${to}`, the catalogue's numbering for one product name. */
function numbered(name, from, to) {
  return Array.from({ length: to - from + 1 }, (_, i) => `${name} ${from + i}`);
}

/** Ids from..to inclusive. */
function ids(from, to) {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

describe('GET /products search', () => {
  it('matches q against product names in any case', async () => {
    const { status, body } = await listProducts({ q: 'kEtTlE', limit: '50' });

    expect(status).toBe(200);
    expect(body.total).toBe(15);
    expect(body.items.map((p) => p.name)).toEqual(numbered('Kettle', 1, 15));
  });

  it('matches q anywhere inside the name', async () => {
    const { status, body } = await listProducts({ q: 'frot', limit: '50' });

    expect(status).toBe(200);
    expect(body.total).toBe(15);
    expect(body.items.map((p) => p.name)).toEqual(numbered('Milk frother', 1, 15));
  });

  it('lists every product when q is absent', async () => {
    const { status, body } = await listProducts();

    expect(status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.items.map((p) => p.id)).toEqual(ids(1, DEFAULT_LIMIT));
  });

  it('returns no items and total 0 when nothing matches q', async () => {
    const { status, body } = await listProducts({ q: 'zzz-no-match' });

    expect(status).toBe(200);
    expect(body).toEqual({ total: 0, items: [] });
  });
});

describe('GET /products paging', () => {
  it('returns the requested page with the total of all matches', async () => {
    const { status, body } = await listProducts({ q: 'kettle', limit: '5', offset: '5' });

    expect(status).toBe(200);
    expect(body.total).toBe(15);
    expect(body.items.map((p) => p.name)).toEqual(numbered('Kettle', 6, 10));
  });

  it('returns an empty page with the total when offset is past the matches', async () => {
    const { status, body } = await listProducts({ q: 'kettle', offset: '15' });

    expect(status).toBe(200);
    expect(body).toEqual({ total: 15, items: [] });
  });

  it('caps limit above MAX_LIMIT at MAX_LIMIT items', async () => {
    const { status, body } = await listProducts({ limit: String(MAX_LIMIT + 1) });

    expect(status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.items.map((p) => p.id)).toEqual(ids(1, MAX_LIMIT));
  });

  it('accepts limit=1 and returns one item', async () => {
    const { status, body } = await listProducts({ limit: '1' });

    expect(status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.items.map((p) => p.id)).toEqual([1]);
  });
});

describe('GET /products refusals', () => {
  it.each([{ value: 'abc' }, { value: '2.5' }, { value: '-3' }, { value: '' }])(
    'refuses a limit that is not a whole number with 400 (limit=$value)',
    async ({ value }) => {
      const { status, body } = await listProducts({ limit: value });

      expect(status).toBe(400);
      expect(body).toHaveProperty('error');
    },
  );

  it.each([{ value: 'abc' }, { value: '1.5' }, { value: '-1' }])(
    'refuses an offset that is not a whole number with 400 (offset=$value)',
    async ({ value }) => {
      const { status, body } = await listProducts({ offset: value });

      expect(status).toBe(400);
      expect(body).toHaveProperty('error');
    },
  );

  it('refuses limit=0 with 400', async () => {
    const { status, body } = await listProducts({ limit: '0' });

    expect(status).toBe(400);
    expect(body).toHaveProperty('error');
  });
});

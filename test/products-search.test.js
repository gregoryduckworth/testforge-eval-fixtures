// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10, TC11, TC12
import { describe, expect, it } from 'vitest';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../src/app.js';
import { PRODUCTS } from '../src/catalogue.js';
import { useServer } from './helpers/server.js';

const baseUrl = useServer();

async function listProducts(params) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${baseUrl()}/products${query ? `?${query}` : ''}`);
  return { status: response.status, body: await response.json() };
}

function idsOf(products) {
  return products.map((p) => p.id);
}

function idsWhoseNameContains(text) {
  return idsOf(PRODUCTS.filter((p) => p.name.toLowerCase().includes(text)));
}

describe('GET /products search', () => {
  it('matches q against product names in any case', async () => {
    const expected = idsWhoseNameContains('kettle');

    const { status, body } = await listProducts({ q: 'KeTtLe' });

    expect(status).toBe(200);
    expect(expected).toHaveLength(15);
    expect(body.total).toBe(15);
    expect(idsOf(body.items)).toEqual(expected);
  });

  it('matches q anywhere in the name, not only at the start', async () => {
    const expected = idsOf(PRODUCTS.filter((p) => p.name.startsWith('Coffee grinder ')));

    const { status, body } = await listProducts({ q: 'GRINDER' });

    expect(status).toBe(200);
    expect(body.total).toBe(15);
    expect(idsOf(body.items)).toEqual(expected);
  });

  it('lists every product when q is absent', async () => {
    const { status, body } = await listProducts({});

    expect(status).toBe(200);
    expect(body.total).toBe(PRODUCTS.length);
    expect(idsOf(body.items)).toEqual(idsOf(PRODUCTS.slice(0, DEFAULT_LIMIT)));
  });

  it('returns an empty page with total 0 when nothing matches q', async () => {
    const { status, body } = await listProducts({ q: 'no-such-product-xyz' });

    expect(status).toBe(200);
    expect(body).toEqual({ total: 0, items: [] });
  });
});

describe('GET /products paging', () => {
  it('returns the requested page of matches with the total of all matches', async () => {
    const matches = idsWhoseNameContains('tea');

    const { status, body } = await listProducts({ q: 'tea', limit: '5', offset: '5' });

    expect(status).toBe(200);
    expect(body.total).toBe(30);
    expect(idsOf(body.items)).toEqual(matches.slice(5, 10));
  });

  it.each([{ limit: MAX_LIMIT + 1 }, { limit: 1000 }])(
    'caps a limit above MAX_LIMIT at MAX_LIMIT items (limit=$limit)',
    async ({ limit }) => {
      const { status, body } = await listProducts({ limit: String(limit) });

      expect(status).toBe(200);
      expect(body.total).toBe(PRODUCTS.length);
      expect(idsOf(body.items)).toEqual(idsOf(PRODUCTS.slice(0, MAX_LIMIT)));
    },
  );

  it('returns MAX_LIMIT items when limit equals MAX_LIMIT', async () => {
    const { status, body } = await listProducts({ limit: String(MAX_LIMIT) });

    expect(status).toBe(200);
    expect(idsOf(body.items)).toEqual(idsOf(PRODUCTS.slice(0, MAX_LIMIT)));
  });

  it('returns no items but the full total when offset is past the last match', async () => {
    const { status, body } = await listProducts({ q: 'kettle', offset: '15' });

    expect(status).toBe(200);
    expect(body).toEqual({ total: 15, items: [] });
  });

  it('accepts limit=1 and returns one item', async () => {
    const { status, body } = await listProducts({ limit: '1' });

    expect(status).toBe(200);
    expect(body.total).toBe(PRODUCTS.length);
    expect(idsOf(body.items)).toEqual([PRODUCTS[0].id]);
  });
});

describe('GET /products validation', () => {
  it('refuses a limit below 1 with 400', async () => {
    const { status, body } = await listProducts({ limit: '0' });

    expect(status).toBe(400);
    expect(body).toHaveProperty('error');
  });

  it.each([{ value: 'abc' }, { value: '2.5' }, { value: '-3' }, { value: '10abc' }])(
    'refuses a limit that is not a whole number with 400 (limit=$value)',
    async ({ value }) => {
      const { status, body } = await listProducts({ limit: value });

      expect(status).toBe(400);
      expect(body).toHaveProperty('error');
    },
  );

  it.each([{ value: 'abc' }, { value: '2.5' }, { value: '-3' }, { value: '10abc' }])(
    'refuses an offset that is not a whole number with 400 (offset=$value)',
    async ({ value }) => {
      const { status, body } = await listProducts({ offset: value });

      expect(status).toBe(400);
      expect(body).toHaveProperty('error');
    },
  );
});

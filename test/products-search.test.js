// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8
import { describe, expect, it } from 'vitest';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../src/app.js';
import { PRODUCTS } from '../src/catalogue.js';
import { useServer } from './helpers/server.js';

const baseUrl = useServer();

/** GET /products with the given query parameters, URL-encoded. */
async function listProducts(params) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${baseUrl()}/products${query ? `?${query}` : ''}`);
  return { status: response.status, body: await response.json() };
}

/** Ids of the catalogue products named `<base> <n>` for any of the bases, in catalogue (id) order. */
function idsNamed(...bases) {
  return PRODUCTS.filter((p) => bases.some((b) => p.name.startsWith(`${b} `))).map((p) => p.id);
}

const ids = (items) => items.map((p) => p.id);

// Products named "Teapot n" and "Tea strainer n" are the only names containing "tea".
const TEA_IDS = idsNamed('Teapot', 'Tea strainer');

describe('GET /products search', () => {
  it('lists every product when q is absent', async () => {
    const { status, body } = await listProducts({});

    expect(status).toBe(200);
    expect(body.total).toBe(120);
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items).toEqual(PRODUCTS.slice(0, DEFAULT_LIMIT));
  });

  it('matches names containing q in any case', async () => {
    const cafetiere = await listProducts({ q: 'CAFETIÈRE', limit: String(MAX_LIMIT) });
    const tea = await listProducts({ q: 'tEa' });

    expect(cafetiere.status).toBe(200);
    expect(cafetiere.body.total).toBe(15);
    expect(ids(cafetiere.body.items)).toEqual(idsNamed('Cafetière'));

    expect(tea.status).toBe(200);
    expect(tea.body.total).toBe(30);
    expect(ids(tea.body.items)).toEqual(TEA_IDS.slice(0, DEFAULT_LIMIT));
  });

  it('returns no items and a total of 0 when nothing matches', async () => {
    const all = await listProducts({});
    expect(all.body.total).toBe(120);

    const { status, body } = await listProducts({ q: 'bicycle' });

    expect(status).toBe(200);
    expect(body).toEqual({ total: 0, items: [] });
  });
});

describe('GET /products paging', () => {
  it('pages through matches with limit and offset and reports the total of all matches', async () => {
    expect(TEA_IDS).toHaveLength(30);
    const seen = [];

    for (let offset = 0; offset < TEA_IDS.length; offset += 7) {
      const { status, body } = await listProducts({ q: 'tea', limit: '7', offset: String(offset) });
      expect(status).toBe(200);
      expect(body.total).toBe(30);
      expect(ids(body.items)).toEqual(TEA_IDS.slice(offset, offset + 7));
      seen.push(...ids(body.items));
    }

    expect(seen).toEqual(TEA_IDS);
  });

  it('caps a limit above the maximum', async () => {
    // The cap the server applies is 50 (src/app.js MAX_LIMIT).
    const large = await listProducts({ limit: '1000' });
    const atMax = await listProducts({ limit: String(MAX_LIMIT) });

    expect(large.status).toBe(200);
    expect(large.body.total).toBe(120);
    expect(large.body.items).toHaveLength(50);
    expect(large.body.items).toEqual(PRODUCTS.slice(0, MAX_LIMIT));
    expect(atMax.status).toBe(200);
    expect(atMax.body.total).toBe(120);
    expect(atMax.body.items).toEqual(PRODUCTS.slice(0, MAX_LIMIT));
  });

  it('accepts limit 1 and offset 0 at their lowest valid values', async () => {
    const { status, body } = await listProducts({ limit: '1', offset: '0' });

    expect(status).toBe(200);
    expect(body).toEqual({ total: 120, items: [PRODUCTS[0]] });
  });
});

// Each refused value is checked with expect.soft, so one failing value doesn't hide the others.
describe('GET /products validation', () => {
  it('refuses a limit that is not a whole number or is below 1 with 400', async () => {
    for (const limit of ['0', '-1', '1.5', 'abc', '']) {
      const { status, body } = await listProducts({ limit });

      expect.soft(status, `limit=${JSON.stringify(limit)}`).toBe(400);
      expect.soft(body, `limit=${JSON.stringify(limit)}`).toEqual({ error: expect.any(String) });
    }
  });

  it('refuses an offset that is not a whole number with 400', async () => {
    for (const offset of ['-1', '2.5', 'abc', '']) {
      const { status, body } = await listProducts({ offset });

      expect.soft(status, `offset=${JSON.stringify(offset)}`).toBe(400);
      expect.soft(body, `offset=${JSON.stringify(offset)}`).toEqual({ error: expect.any(String) });
    }
  });
});

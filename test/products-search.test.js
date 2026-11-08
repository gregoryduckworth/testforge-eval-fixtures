// API-31: TC1, TC2, TC3, TC4, TC5, TC6, TC7
import { describe, expect, it } from 'vitest';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../src/app.js';
import { PRODUCTS } from '../src/catalogue.js';
import { useServer } from './helpers/server.js';

const getBase = useServer();

async function getProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${getBase()}/products${query ? `?${query}` : ''}`);
  return { status: response.status, body: await response.json() };
}

describe('GET /products', () => {
  it('matches names containing q in any case', async () => {
    const expected = PRODUCTS.filter((p) => p.name.toLowerCase().includes('tea'));

    const { status, body } = await getProducts({ q: 'tEA', limit: '50' });

    expect(status).toBe(200);
    expect(body.total).toBe(30);
    expect(body.total).toBe(expected.length);
    expect(body.items).toEqual(expected);
  });

  it('lists every product when q is absent', async () => {
    const { status, body } = await getProducts();

    expect(status).toBe(200);
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.total).toBe(120);
    expect(body.items).toEqual(PRODUCTS.slice(0, DEFAULT_LIMIT));
  });

  it('returns the page at offset with the total of all matches', async () => {
    const matches = PRODUCTS.filter((p) => p.name.toLowerCase().includes('kettle'));

    const { status, body } = await getProducts({ q: 'kettle', limit: '4', offset: '4' });

    expect(status).toBe(200);
    expect(body.total).toBe(15);
    expect(body.total).toBe(matches.length);
    expect(body.items).toEqual(matches.slice(4, 8));
    expect(body.items.map((p) => p.name)).toEqual(['Kettle 5', 'Kettle 6', 'Kettle 7', 'Kettle 8']);
  });

  it('returns no items when offset is past the last match', async () => {
    const { status, body } = await getProducts({ q: 'kettle', offset: '15' });

    expect(status).toBe(200);
    expect(body.total).toBe(15);
    expect(body.items).toEqual([]);
  });

  it('caps a large limit at the maximum page size', async () => {
    const { status, body } = await getProducts({ limit: '1000' });

    expect(status).toBe(200);
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items).toHaveLength(50);
    expect(body.items).toEqual(PRODUCTS.slice(0, MAX_LIMIT));
  });

  describe("refuses a limit or offset that isn't a whole number with 400", () => {
    it.each([
      { param: 'limit', value: 'abc' },
      { param: 'limit', value: '2.5' },
      { param: 'limit', value: '-1' },
      { param: 'offset', value: 'abc' },
      { param: 'offset', value: '1.5' },
      { param: 'offset', value: '-1' },
    ])('$param=$value', async ({ param, value }) => {
      const { status, body } = await getProducts({ [param]: value });

      expect(status).toBe(400);
      expect(typeof body.error).toBe('string');
    });
  });

  it('refuses a limit of 0 with 400 and accepts a limit of 1', async () => {
    const refused = await getProducts({ limit: '0' });
    const allowed = await getProducts({ limit: '1' });

    expect(refused.status).toBe(400);
    expect(allowed.status).toBe(200);
    expect(allowed.body.items).toEqual(PRODUCTS.slice(0, 1));
  });
});

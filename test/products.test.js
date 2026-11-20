import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startServer } from './helpers/server.js';

let server;

beforeAll(async () => {
  server = await startServer();
});

afterAll(() => server?.close());

describe('GET /products/:id', () => {
  it('returns the product', async () => {
    const response = await fetch(`${server.base}/products/1`);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: 1, name: 'Kettle 1' });
  });

  it('is 404 for an unknown id', async () => {
    const response = await fetch(`${server.base}/products/999`);
    expect(response.status).toBe(404);
  });
});

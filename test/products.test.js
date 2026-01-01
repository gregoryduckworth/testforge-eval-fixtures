import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

let server;
let base;

beforeAll(async () => {
  server = createApp();
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}`;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

describe('GET /products/:id', () => {
  it('returns the product', async () => {
    const response = await fetch(`${base}/products/1`);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: 1, name: 'Kettle 1' });
  });

  it('is 404 for an unknown id', async () => {
    const response = await fetch(`${base}/products/999`);
    expect(response.status).toBe(404);
  });
});

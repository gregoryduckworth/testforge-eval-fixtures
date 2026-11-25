import { afterAll, beforeAll } from 'vitest';
import { createApp } from '../../src/app.js';

/**
 * Starts the app on a free port for the calling test file and stops it afterwards.
 * Returns a function that gives the base URL once the server is listening.
 */
export function useApp() {
  let server;
  let base;

  beforeAll(async () => {
    server = createApp();
    await new Promise((resolve) => server.listen(0, resolve));
    base = `http://localhost:${server.address().port}`;
  });

  afterAll(() => new Promise((resolve) => server.close(resolve)));

  return () => base;
}

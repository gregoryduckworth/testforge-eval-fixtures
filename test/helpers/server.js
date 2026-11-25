import { afterAll, beforeAll } from 'vitest';
import { createApp } from '../../src/app.js';

/**
 * Starts the app on an OS-chosen port for the calling test file and stops it after.
 * Returns a getter for the base URL, available once beforeAll has run.
 */
export function useServer() {
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

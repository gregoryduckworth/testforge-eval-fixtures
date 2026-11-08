import { afterAll, beforeAll } from 'vitest';
import { createApp } from '../../src/app.js';

// Starts the real app on an OS-chosen port for the calling test file.
// Returns a function giving the base URL (valid once beforeAll has run).
export function useServer() {
  let server;
  let base;

  beforeAll(async () => {
    server = createApp();
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, resolve);
    });
    base = `http://localhost:${server.address().port}`;
  });

  afterAll(() => {
    if (!server?.listening) return undefined;
    return new Promise((resolve) => server.close(resolve));
  });

  return () => base;
}

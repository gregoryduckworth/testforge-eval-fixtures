import { afterAll, beforeAll } from 'vitest';
import { createApp } from '../../src/app.js';

/**
 * Starts the real app in-process on an OS-chosen port before the file's tests
 * and stops it afterwards. Returns a function that gives the base URL.
 */
export function useServer() {
  let server;
  let base;

  beforeAll(async () => {
    server = createApp();
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, () => {
        server.off('error', reject);
        resolve();
      });
    });
    base = `http://localhost:${server.address().port}`;
  });

  afterAll(async () => {
    if (!server?.listening) return;
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  });

  return () => {
    if (!base) throw new Error('The test server is not running');
    return base;
  };
}

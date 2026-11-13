import { afterAll, beforeAll } from 'vitest';
import { createApp } from '../../src/app.js';

/** Starts the app on a port the OS picks; rejects with the server's error if it can't listen. */
export function startServer() {
  const server = createApp();
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, () => {
      server.off('error', reject);
      resolve({
        base: `http://localhost:${server.address().port}`,
        close: () =>
          new Promise((done, fail) => {
            server.closeAllConnections();
            server.close((error) => (error ? fail(error) : done()));
          }),
      });
    });
  });
}

/** Starts the app before the file's tests and stops it after; call base() inside a test for its URL. */
export function useServer() {
  let server;
  beforeAll(async () => {
    server = await startServer();
  });
  afterAll(() => server?.close());
  return {
    base: () => {
      if (!server) throw new Error('The test server did not start');
      return server.base;
    },
  };
}

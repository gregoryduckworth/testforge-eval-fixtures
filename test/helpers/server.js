import { createApp } from '../../src/app.js';

/**
 * Starts the real app in-process on a port the OS chooses.
 * Rejects with the server's error if it can't listen.
 * @returns {Promise<{ base: string, close: () => Promise<void> }>}
 */
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
            server.close((error) => (error ? fail(error) : done()));
          }),
      });
    });
  });
}

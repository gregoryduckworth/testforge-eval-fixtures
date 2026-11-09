import { createApp } from '../../src/app.js';

/** Starts the app on an OS-chosen port; returns its base URL and a close function. */
export async function startServer() {
  const server = createApp();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, resolve);
  });
  const base = `http://localhost:${server.address().port}`;
  return {
    base,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

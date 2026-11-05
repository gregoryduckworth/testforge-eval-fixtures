import { createApp } from '../../src/app.js';

/** Starts the real app on an OS-chosen port; returns its base URL and a close function. */
export async function startApp() {
  const server = createApp();
  await new Promise((resolve) => server.listen(0, resolve));
  return {
    base: `http://localhost:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

import { createApp } from '../../src/app.js';

/** Starts the API on a port the OS picks; resolves to the server and its base URL. */
export async function startApp() {
  const server = createApp();
  await new Promise((resolve) => server.listen(0, resolve));
  return { server, base: `http://localhost:${server.address().port}` };
}

/** Stops a server started with startApp. */
export function stopApp(server) {
  return new Promise((resolve) => server.close(resolve));
}

import { defineConfig, devices } from '@playwright/test';

// BASE_URL points the tests at a deployed build; without it they start the shop here, on E2E_PORT
// (4176 by default, so a shop already running on its usual port 4175 is never reused).
const deployed = process.env.BASE_URL;
const port = process.env.E2E_PORT ?? '4176';
const local = `http://localhost:${port}`;

// Placing an order is the only test action that changes a server, so against a deployed build the
// tests tagged @places-order run only when SMOKE_PLACE_ORDER=1 (e.g. on staging, not production).
const placeOrders = !deployed || process.env.SMOKE_PLACE_ORDER === '1';

export default defineConfig({
  testDir: './tests',
  ...(placeOrders ? {} : { grepInvert: /@places-order/ }),
  use: { baseURL: deployed ?? local },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  ...(deployed
    ? {}
    : {
        webServer: {
          command: 'node src/server.js',
          env: { PORT: port },
          url: `${local}/health`,
          reuseExistingServer: !process.env.CI,
        },
      }),
});

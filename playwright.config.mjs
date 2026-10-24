import { defineConfig, devices } from '@playwright/test';

// The UI is built against the local API (BUILD_ENV=local: http://localhost:6543), then served on this port
const port = Number(process.env.E2E_PORT ?? 6553);

export default defineConfig({
  testDir: './e2e',
  testMatch: '*.spec.mjs',
  globalSetup: './e2e/global-setup.mjs',
  // one test user, whose session and language the tests change
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e-report' }]],
  outputDir: 'e2e-results',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://localhost:${port}`,
    viewport: { width: 1400, height: 900 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npx cross-env BUILD_ENV=local vite build --outDir dist-e2e && npx vite preview --outDir dist-e2e --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    // E2E_REUSE_SERVER=1: test a UI already served on that port (e.g. npm run serve, faster to iterate)
    reuseExistingServer: Boolean(process.env.E2E_REUSE_SERVER),
    timeout: 300_000,
  },
});

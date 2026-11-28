import { defineConfig, devices } from '@playwright/test';

// The UI is built (in dist, which the PWA plugin of vite.config.ts reads) against the local API (C2C_BACKEND=localhost: http://localhost:6543), then served on this port
const port = Number(process.env.E2E_PORT ?? 6553);

export default defineConfig({
  testDir: './e2e',
  testMatch: '*.spec.ts',
  globalSetup: './e2e/global-setup.ts',
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
    // a preinstalled Chrome (Claude Code cloud sessions set it), when Playwright's own can't be downloaded
    launchOptions: { executablePath: process.env.CHROME_PATH || undefined },
  },
  webServer: {
    command: `npx cross-env BUILD_ENV=local C2C_BACKEND=localhost vite build && npx vite preview --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    // E2E_REUSE_SERVER=1: test a UI already served on that port (e.g. npm run serve, faster to iterate)
    reuseExistingServer: Boolean(process.env.E2E_REUSE_SERVER),
    timeout: 300_000,
  },
});

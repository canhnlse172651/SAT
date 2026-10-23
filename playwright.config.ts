import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Production build + hermetic backend (in-memory MongoDB, NODE_ENV=test for dev endpoints): no Docker needed.
  webServer: {
    command: 'npm run build && node tests/e2e/server.mjs',
    url: `http://127.0.0.1:${PORT}/api/ready`,
    reuseExistingServer: !isCI,
    timeout: 240_000,
    env: { PORT: String(PORT) },
  },
});

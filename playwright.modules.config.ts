import { defineConfig, devices } from '@playwright/test';

// Replays the scripts the QA agent saved for one module (specs/NNN-*/testing/e2e/*.spec.ts) against the same
// hermetic backend as tests/e2e. Driven by scripts/replay-module-tests.mjs, which sets the variables below.
const PORT = 4173;
const testDir = process.env.SAT_MODULE_TEST_DIR;
const outDir = process.env.SAT_MODULE_RUN_DIR;
if (!testDir || !outDir)
  throw new Error('Run through: node .sdd/scripts/sdd.mjs run test:modules -- <NNN>');

export default defineConfig({
  testDir,
  outputDir: `${outDir}/artifacts`,
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: `${outDir}/results.json` }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && node tests/e2e/server.mjs',
    url: `http://127.0.0.1:${PORT}/api/ready`,
    reuseExistingServer: true,
    timeout: 240_000,
    env: { PORT: String(PORT) },
  },
});

import { defineConfig, devices } from '@playwright/test';

const e2eAuthBypass = process.env.VITE_E2E_AUTH_BYPASS === 'true';
const webServerCommand = e2eAuthBypass
  ? 'cross-env VITE_E2E_AUTH_BYPASS=true npm run dev -- --host 127.0.0.1 --port 4174'
  : 'npm run dev -- --host 127.0.0.1 --port 4174';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  webServer: {
    command: webServerCommand,
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});

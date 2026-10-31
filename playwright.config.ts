import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: {
    timeout: 20_000,
  },
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8082',
    browserName: 'chromium',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx expo start --web --port 8082',
    env: { CI: '1' },
    url: 'http://localhost:8082',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

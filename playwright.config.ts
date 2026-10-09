import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', use: { baseURL: 'http://127.0.0.1:3000' },
  webServer: [
    { command: 'pnpm --filter @whats-new/api start', url: 'http://127.0.0.1:4000/api/v1/health/live', reuseExistingServer: !process.env.CI, env: { NODE_ENV: 'test' } },
    { command: 'pnpm --filter @whats-new/web dev', url: 'http://127.0.0.1:3000', reuseExistingServer: !process.env.CI, env: { NODE_ENV: 'development' } },
  ],
});

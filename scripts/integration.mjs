import { spawnSync } from 'node:child_process';
import { loadRootEnv } from '@whats-new/config';
loadRootEnv();
const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith('_test')) throw new Error('Set TEST_DATABASE_URL to a dedicated database ending in _test');
const env = { ...process.env, NODE_ENV: 'test', DATABASE_URL: url };
for (const args of [['db:deploy'], ['exec', 'vitest', 'run', '--config', 'vitest.integration.config.ts']]) {
  const result = spawnSync('pnpm', args, { env, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

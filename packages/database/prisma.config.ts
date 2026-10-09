import { defineConfig } from 'prisma/config';
import { loadRootEnv, readEnvironment } from '@whats-new/config';
loadRootEnv();
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed.ts' },
  datasource: { url: readEnvironment().DATABASE_URL },
});

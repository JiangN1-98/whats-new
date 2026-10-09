import { loadRootEnv, readEnvironment, log } from '@whats-new/config';
import { createDatabase } from '../src/index.js';
loadRootEnv();
const env = readEnvironment();
if (env.NODE_ENV === 'production' || env.AUTH_MODE !== 'dev') throw new Error('Dev seed is local-only');
const db = createDatabase(env.DATABASE_URL);
try {
  await db.user.upsert({
    where: { id: env.DEV_USER_ID },
    create: { id: env.DEV_USER_ID, displayName: 'Local developer' },
    update: { displayName: 'Local developer' },
  });
  log('seed.completed', { entity: 'dev-user' });
} finally { await db.$disconnect(); }

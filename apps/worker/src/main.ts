import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { loadRootEnv, readEnvironment, log } from '@whats-new/config';
import { FIXTURE_QUEUE } from '@whats-new/shared';
import { processFixture } from './pipeline.js';

loadRootEnv();
const env = readEnvironment();
if (env.AI_MODE !== 'fake') throw new Error('Live processing is not implemented in M0');
let close: () => Promise<void>;
if (env.WORKER_MODE === 'fixture') {
  log('fixture.completed', await processFixture({ schemaVersion: 1, kind: 'fixture-smoke' }));
  const timer = setInterval(() => log('worker.heartbeat', { mode: 'fixture', demo: true }), 30_000);
  close = async () => { clearInterval(timer); };
} else {
  const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  connection.on('error', () => log('worker.redis_error'));
  const worker = new Worker(FIXTURE_QUEUE, job => processFixture(job.data), { connection, concurrency: 1 });
  worker.on('completed', job => log('worker.completed', { jobId: job.id ?? 'unknown', demo: true }));
  worker.on('failed', job => log('worker.failed', { jobId: job?.id ?? 'unknown' }));
  worker.on('error', () => log('worker.error'));
  close = async () => { await worker.close(); await connection.quit(); };
}
log('worker.started', { mode: env.WORKER_MODE });
let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    if (stopping) return;
    stopping = true;
    const deadline = setTimeout(() => process.exit(1), 10_000);
    try { await close(); clearTimeout(deadline); log('worker.stopped'); process.exit(0); }
    catch { process.exit(1); }
  });
}

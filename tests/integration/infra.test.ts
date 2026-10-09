import { randomUUID } from 'node:crypto';
import { afterAll, expect, it } from 'vitest';
import { Queue, QueueEvents, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { createDatabase } from '@whats-new/database';
import { processFixture } from '../../apps/worker/src/pipeline.js';
const url = process.env.DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith('_test')) throw new Error('Dedicated test DB required');
const db = createDatabase(url);
afterAll(async () => { await db.$disconnect(); });
it('migrates pgvector and enforces user identity uniqueness', async () => {
  const identity = `integration-${randomUUID()}`;
  try {
    await db.user.create({ data: { displayName: 'Test', externalAuthId: identity } });
    await expect(db.user.create({ data: { displayName: 'Duplicate', externalAuthId: identity } })).rejects.toThrow();
    const result = await db.$queryRaw<{ distance: number }[]>`SELECT '[1,0]'::vector <-> '[1,0]'::vector AS distance`;
    expect(result[0]?.distance).toBe(0);
  } finally { await db.user.deleteMany({ where: { externalAuthId: identity } }); }
});
it('runs a real BullMQ fixture job and closes its resources', async () => {
  const name = `fixture-test-${randomUUID()}`;
  const connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', { maxRetriesPerRequest: null });
  const queue = new Queue(name, { connection });
  const events = new QueueEvents(name, { connection });
  const worker = new Worker(name, job => processFixture(job.data), { connection });
  try {
    await events.waitUntilReady();
    const job = await queue.add('fixture-smoke', { schemaVersion: 1, kind: 'fixture-smoke' });
    expect(await job.waitUntilFinished(events, 10000)).toEqual({ demo: true, releases: 1, changes: 1 });
  } finally {
    await worker.close(); await events.close(); await queue.obliterate({ force: true }); await queue.close(); await connection.quit();
  }
});

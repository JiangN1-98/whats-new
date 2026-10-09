import { Injectable, ServiceUnavailableException, type OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { createDatabase } from '@whats-new/database';
import { readEnvironment } from '@whats-new/config';
@Injectable()
export class HealthService implements OnModuleDestroy {
  private readonly env = readEnvironment();
  private readonly db = createDatabase(this.env.DATABASE_URL);
  async ready() {
    // Per-probe Redis client avoids infinite reconnect loops when infra is absent.
    const redis = new Redis(this.env.REDIS_URL, {
      lazyConnect: true, connectTimeout: 2000, commandTimeout: 2000,
      maxRetriesPerRequest: 0, retryStrategy: () => null,
    });
    redis.on('error', () => {});
    try {
      const [database, cache] = await Promise.allSettled([
        this.db.$queryRaw`SELECT 1`, redis.connect().then(() => redis.ping()),
      ]);
      if (database.status !== 'fulfilled' || cache.status !== 'fulfilled') throw new ServiceUnavailableException();
      return { status: 'ok', dependencies: { database: 'ok', redis: 'ok' } };
    } finally { redis.disconnect(); }
  }
  async onModuleDestroy() { await this.db.$disconnect(); }
}

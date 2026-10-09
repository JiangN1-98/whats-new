import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';
export { PrismaClient };

// Explicit factory; importing this package never opens a connection.
export function createDatabase(databaseUrl: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({
    connectionString: databaseUrl, connectionTimeoutMillis: 2000,
  }) });
}

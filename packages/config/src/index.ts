import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { config as dotenv } from 'dotenv';
import { z } from 'zod';

export function loadRootEnv(start = process.cwd()): void {
  let current = start;
  while (true) {
    if (existsSync(join(current, 'pnpm-workspace.yaml'))) {
      dotenv({ path: join(current, '.env'), override: false, quiet: true });
      return;
    }
    const parent = dirname(current);
    if (parent === current) throw new Error('Workspace root not found');
    current = parent;
  }
}
const optionalText = z.preprocess(value => value === '' ? undefined : value, z.string().min(1).optional());
const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.url().default('postgresql://whats_new:whats_new_dev@localhost:5432/whats_new?schema=public'),
  REDIS_URL: z.url().default('redis://localhost:6379'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  WEB_ORIGIN: z.url().default('http://localhost:3000'),
  AUTH_MODE: z.enum(['dev', 'session']).default('dev'),
  DEV_USER_ID: z.uuid().default('00000000-0000-4000-8000-000000000001'),
  AI_MODE: z.enum(['fake', 'live']).default('fake'),
  WORKER_MODE: z.enum(['fixture', 'queue']).default('fixture'),
  OPENAI_API_KEY: optionalText, OPENAI_EXTRACTION_MODEL: optionalText,
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
}).superRefine((env, context) => {
  const issue = (message: string) => context.addIssue({ code: 'custom', message });
  if (env.NODE_ENV === 'production' && (env.AUTH_MODE === 'dev' || env.AI_MODE === 'fake' || env.WORKER_MODE === 'fixture')) {
    issue('Production forbids dev authentication, fake AI and fixture worker');
  }
  if (env.AI_MODE === 'live' && (!env.OPENAI_API_KEY || !env.OPENAI_EXTRACTION_MODEL)) {
    issue('Live AI requires OPENAI_API_KEY and OPENAI_EXTRACTION_MODEL');
  }
  if (!['redis:', 'rediss:'].includes(new URL(env.REDIS_URL).protocol)) issue('REDIS_URL must use redis or rediss');
  if (!['postgres:', 'postgresql:'].includes(new URL(env.DATABASE_URL).protocol)) issue('DATABASE_URL must use PostgreSQL');
});
export type Environment = z.infer<typeof environmentSchema>;
export function readEnvironment(input: Record<string, string | undefined> = process.env): Environment {
  const result = environmentSchema.safeParse(input);
  if (!result.success) {
    // Do not include input values in diagnostics: they can contain credentials.
    throw new Error(`Invalid environment: ${result.error.issues.map(issue => `${issue.path.join('.') || 'config'}: ${issue.message}`).join('; ')}`);
  }
  return result.data;
}
export function log(event: string, fields: Record<string, string | number | boolean> = {}): void {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), event, ...fields }));
}

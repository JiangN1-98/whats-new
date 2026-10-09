import { z } from 'zod';

// This entrypoint is browser-safe. No Node imports, credentials or Prisma types.
export const projectCategorySchema = z.enum(['frontend', 'mobile', 'backend', 'ai', 'tooling', 'database', 'devops', 'other']);
export const projectStatusSchema = z.enum(['active', 'paused', 'archived']);
export const sourceTypeSchema = z.enum(['github_release', 'github_tag', 'rss', 'atom', 'official_blog', 'changelog', 'documentation']);
export const changeImportanceSchema = z.enum(['low', 'medium', 'high', 'critical']);
export const processingStatusSchema = z.enum(['pending', 'processing', 'ready', 'failed', 'skipped']);
export const messageRoleSchema = z.enum(['user', 'assistant', 'tool', 'system']);
export const messageStatusSchema = z.enum(['pending', 'completed', 'interrupted', 'failed']);
export const releaseChannelSchema = z.enum(['stable', 'rc', 'beta', 'alpha', 'canary', 'nightly', 'unknown']);
export const changeCategorySchema = z.enum(['feature', 'breaking_change', 'deprecation', 'performance', 'security', 'bug_fix', 'developer_experience', 'documentation', 'other']);
export const rawReleaseSchema = z.object({
  externalId: z.string().min(1), title: z.string().min(1), version: z.string().nullable(),
  channel: releaseChannelSchema, publishedAt: z.iso.datetime(), sourceUrl: z.url(),
  rawContent: z.string().min(1), demo: z.boolean(),
});
export type RawRelease = z.infer<typeof rawReleaseSchema>;
export const extractedChangeSchema = z.object({
  title: z.string().min(1), description: z.string().min(1), category: changeCategorySchema,
  evidence: z.string().min(1),
});
export const extractionSchema = z.object({ summary: z.string().min(1), changes: z.array(extractedChangeSchema) });
export type Extraction = z.infer<typeof extractionSchema>;
export const fixtureJobSchema = z.object({ schemaVersion: z.literal(1), kind: z.literal('fixture-smoke') });
export type FixtureJob = z.infer<typeof fixtureJobSchema>;
export const FIXTURE_QUEUE = 'whats-new-fixture-smoke';

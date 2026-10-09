import { rawReleaseSchema, type RawRelease } from '@whats-new/shared';

export interface SourceProvider { discover(): Promise<RawRelease[]> }
// Synthetic fixture, never represented as an official software update.
export class FixtureProvider implements SourceProvider {
  async discover(): Promise<RawRelease[]> {
    return [rawReleaseSchema.parse({
      externalId: 'synthetic-fixture-1', title: 'Engineering fixture', version: null,
      channel: 'unknown', publishedAt: '2026-10-09T00:00:00.000Z',
      sourceUrl: 'https://example.invalid/fixtures/engineering-1',
      rawContent: 'This synthetic change verifies provider and extraction contracts.', demo: true,
    })];
  }
}

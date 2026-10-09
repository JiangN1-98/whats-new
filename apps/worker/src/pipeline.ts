import { FakeExtractionAdapter } from '@whats-new/ai';
import { FixtureProvider } from '@whats-new/source-providers';
import { fixtureJobSchema } from '@whats-new/shared';
export async function processFixture(input: unknown) {
  fixtureJobSchema.parse(input);
  const releases = await new FixtureProvider().discover();
  const adapter = new FakeExtractionAdapter();
  const results = await Promise.all(releases.map(async release => ({ release, extraction: await adapter.extract(release) })));
  return { demo: true, releases: results.length, changes: results.reduce((sum, r) => sum + r.extraction.changes.length, 0) };
}

import { describe, expect, it } from 'vitest';
import { FakeExtractionAdapter, validateEvidence } from './index.js';
import { FixtureProvider } from '@whats-new/source-providers';
describe('fixture evidence', () => {
  it('extracts synthetic content while preserving evidence', async () => {
    const [release] = await new FixtureProvider().discover();
    if (!release) throw new Error('Missing fixture');
    const result = await new FakeExtractionAdapter().extract(release);
    expect(result.changes).toHaveLength(1);
    expect(release.rawContent).toContain(result.changes[0]!.evidence);
  });
  it('rejects invented evidence and non-demo input', async () => {
    const [release] = await new FixtureProvider().discover();
    if (!release) throw new Error('Missing fixture');
    expect(() => validateEvidence(release, { summary: 'Fake', changes: [{ title: 'x', description: 'x', category: 'other', evidence: 'invented quote' }] })).toThrow('Evidence is absent');
    await expect(new FakeExtractionAdapter().extract({ ...release, demo: false })).rejects.toThrow('explicitly marked demo');
  });
});

import { expect, it } from 'vitest';
import { fixtureJobSchema, releaseChannelSchema } from './index.js';
it('rejects unknown payload versions and preserves unknown channels', () => {
  expect(fixtureJobSchema.safeParse({ schemaVersion: 2, kind: 'fixture-smoke' }).success).toBe(false);
  expect(releaseChannelSchema.parse('unknown')).toBe('unknown');
});

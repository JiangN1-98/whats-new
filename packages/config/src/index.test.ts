import { describe, expect, it } from 'vitest';
import { readEnvironment } from './index.js';
describe('startup boundaries', () => {
  it('boots locally with no paid credentials', () => { expect(readEnvironment({}).AI_MODE).toBe('fake'); });
  it.each([{ NODE_ENV: 'production' }, { AI_MODE: 'live' }, { REDIS_URL: 'https://example.com' }, { API_PORT: '99999' }])('rejects invalid configuration %j', input => { expect(() => readEnvironment(input)).toThrow('Invalid environment'); });
  it('does not leak a credential-bearing URL on failure', () => {
    expect(() => readEnvironment({ DATABASE_URL: 'secret-password' })).toThrow(/^((?!secret-password).)*$/);
  });
});

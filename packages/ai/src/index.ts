import OpenAI from 'openai';
import { extractionSchema, type Extraction, type RawRelease } from '@whats-new/shared';

export interface ExtractionAdapter { extract(release: RawRelease): Promise<Extraction> }
export function validateEvidence(release: RawRelease, output: unknown): Extraction {
  const extraction = extractionSchema.parse(output);
  for (const change of extraction.changes) {
    if (!release.rawContent.includes(change.evidence)) throw new Error('Evidence is absent from source');
  }
  return extraction;
}
export class FakeExtractionAdapter implements ExtractionAdapter {
  async extract(release: RawRelease): Promise<Extraction> {
    if (!release.demo) throw new Error('Fake adapter only accepts explicitly marked demo input');
    return validateEvidence(release, {
      summary: 'Synthetic fixture used to verify the engineering pipeline.',
      changes: [{ title: 'Fixture change', description: release.rawContent, category: 'other', evidence: release.rawContent }],
    });
  }
}
// Server-only SDK construction. No model, network call or billable default in M0.
export function createOpenAIClient(apiKey: string): OpenAI {
  if (!apiKey) throw new Error('OPENAI_API_KEY is required');
  return new OpenAI({ apiKey, timeout: 30_000, maxRetries: 2 });
}

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('API.md', () => {
  const doc = readFileSync(new URL('../../API.md', import.meta.url), 'utf8');

  it('documents every Oscar route that is shipped today', () => {
    expect(doc).toContain('GET /api/cases');
    expect(doc).toContain('POST /api/cases');
    expect(doc).toContain('GET /api/reviews');
    expect(doc).toContain('PUT /api/reviews');
    expect(doc).toContain('POST /api/reviews/comment');
    expect(doc).toContain('POST /api/reviews/reply');
    expect(doc).toContain('Authorization: Bearer');
    expect(doc).toContain('Do not PUT a full review');
  });
});

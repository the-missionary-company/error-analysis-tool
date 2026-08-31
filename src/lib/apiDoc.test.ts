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
    expect(doc).toContain('parentId');
    expect(doc).toContain('parentSystem');
    expect(doc).toContain('One Linear parent per steer');
    expect(doc).toContain('parentTitle');
    expect(doc).toContain('sessionId');
    expect(doc).toContain('filedAt');
    expect(doc).toContain('archived: true');
    expect(doc).toContain('On file');
    expect(doc).toContain('OSCAR_EVAL_WEBHOOK_URL');
    expect(doc).toContain('OSCAR_EVAL_WEBHOOK_KEY');
    expect(doc).toContain('POST /api/transcribe');
    expect(doc).toContain('XAI_API_KEY');
    expect(doc).toContain('oscar-clone');
    expect(doc).toContain('`sam` | `oscar` | `oscar-clone`');
  });
});

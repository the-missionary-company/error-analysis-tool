import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { emptyReview } from './steers';
import { AUTH_COOKIE_NAME } from './evalAuth';
import {
  PersistNotConfigured,
  appendReplyToReviews,
  gateEvalDashboardRequest,
  appendCommentToReviews,
  handleReviewsCommentRequest,
  handleReviewsReplyRequest,
  handleReviewsRequest,
  mergeReviewsByUpdatedAt,
  parseReviewsWritePayload,
  type ReviewsPersist,
} from './reviewsApi';
import type { SteerReview } from '../types/steers';

function review(partial: Partial<SteerReview> & Pick<SteerReview, 'caseId'>): SteerReview {
  return {
    ...emptyReview(partial.caseId),
    ...partial,
  };
}

function memoryPersist(seed: SteerReview[] = []): ReviewsPersist {
  let data = [...seed];
  return {
    async read() {
      return data;
    },
    async write(next) {
      data = [...next];
    },
  };
}

describe('mergeReviewsByUpdatedAt', () => {
  it('keeps the review with the newer updatedAt and adds unseen caseIds', () => {
    const older = review({
      caseId: 'one',
      updatedAt: '2026-08-01T00:00:00.000Z',
      content: { passFail: 'pass', comment: 'old', labels: [] },
    });
    const newer = review({
      caseId: 'one',
      updatedAt: '2026-08-27T12:00:00.000Z',
      content: { passFail: 'fail', comment: 'new', labels: [] },
    });
    const extra = review({ caseId: 'two', updatedAt: '2026-08-27T00:00:00.000Z' });

    const merged = mergeReviewsByUpdatedAt([older, extra], [newer]);
    expect(merged).toHaveLength(2);
    expect(merged.find((item) => item.caseId === 'one')?.content.comment).toBe('new');
    expect(merged.find((item) => item.caseId === 'one')?.content.passFail).toBe('fail');
    expect(merged.find((item) => item.caseId === 'two')?.caseId).toBe('two');
  });

  it('does not invent scores when the incoming older copy loses', () => {
    const kept = review({
      caseId: 'one',
      updatedAt: '2026-08-27T12:00:00.000Z',
      action: { passFail: 'fail', comment: 'keep', labels: [] },
    });
    const stale = review({
      caseId: 'one',
      updatedAt: '2026-08-01T00:00:00.000Z',
      action: { passFail: 'pass', comment: 'stale', labels: [] },
    });
    const merged = mergeReviewsByUpdatedAt([kept], [stale]);
    expect(merged).toHaveLength(1);
    expect(merged[0].action).toEqual({ passFail: 'fail', comment: 'keep', labels: [] });
    expect(merged[0].content).toEqual({ passFail: null, comment: '', labels: [] });
  });
});

describe('parseReviewsWritePayload', () => {
  it('accepts { reviews } or { review } and uses parseSteerReviews', () => {
    const one = review({
      caseId: 'one',
      updatedAt: '2026-08-27T00:00:00.000Z',
      notes: [
        {
          id: 'n1',
          kind: 'question',
          lane: 'content',
          author: 'sam',
          text: 'What is this?',
          createdAt: '2026-08-27T00:00:00.000Z',
          replies: [],
        },
      ],
    });
    expect(parseReviewsWritePayload({ reviews: [one] })[0].notes[0].text).toBe('What is this?');
    expect(parseReviewsWritePayload({ review: one })[0].caseId).toBe('one');
  });
});

describe('appendReplyToReviews', () => {
  it('appends a ThreadReply with server id and createdAt', () => {
    const existing = review({
      caseId: 'one',
      updatedAt: '2026-08-01T00:00:00.000Z',
      notes: [
        {
          id: 'n1',
          kind: 'question',
          lane: 'action',
          author: 'sam',
          text: 'Why HOLD?',
          createdAt: '2026-08-01T00:00:00.000Z',
          replies: [],
        },
      ],
    });
    const next = appendReplyToReviews([existing], {
      caseId: 'one',
      noteId: 'n1',
      author: 'oscar',
      text: 'Because production.',
    });
    expect(next.review.notes[0].replies).toHaveLength(1);
    expect(next.review.notes[0].replies[0].author).toBe('oscar');
    expect(next.review.notes[0].replies[0].text).toBe('Because production.');
    expect(next.review.notes[0].replies[0].id).toMatch(/^r-/);
    expect(next.review.notes[0].replies[0].createdAt).toMatch(/^\d{4}-/);
    expect(next.review.updatedAt >= existing.updatedAt).toBe(true);
  });

  it('returns missing when the note is not there', () => {
    expect(
      appendReplyToReviews([review({ caseId: 'one' })], {
        caseId: 'one',
        noteId: 'nope',
        author: 'oscar',
        text: 'hi',
      }),
    ).toBeNull();
    expect(
      appendReplyToReviews([], {
        caseId: 'missing',
        noteId: 'n1',
        author: 'oscar',
        text: 'hi',
      }),
    ).toBeNull();
  });
});

describe('gateEvalDashboardRequest', () => {
  const env = { EVAL_DASHBOARD_PASSWORD: 'board-secret' };

  it('does not redirect a valid Bearer GET /api/reviews', async () => {
    const request = new Request('https://eval-dashboard-zeta.vercel.app/api/reviews', {
      headers: { Authorization: 'Bearer board-secret' },
    });
    const result = await gateEvalDashboardRequest(request, env);
    expect(result).toBeUndefined();
  });

  it('allows a cookie on /api/reviews and 401s JSON without auth', async () => {
    const cookie = new Request('https://eval-dashboard-zeta.vercel.app/api/reviews', {
      headers: { cookie: `${AUTH_COOKIE_NAME}=1` },
    });
    await expect(gateEvalDashboardRequest(cookie, env)).resolves.toBeUndefined();

    const denied = await gateEvalDashboardRequest(
      new Request('https://eval-dashboard-zeta.vercel.app/api/reviews'),
      env,
    );
    expect(denied?.status).toBe(401);
    expect(denied?.headers.get('content-type')).toContain('application/json');
    expect(await denied!.json()).toEqual({ error: 'unauthorized' });
    expect(denied?.headers.get('location')).toBeNull();
  });

  it('still redirects the board HTML without a cookie', async () => {
    const denied = await gateEvalDashboardRequest(
      new Request('https://eval-dashboard-zeta.vercel.app/'),
      env,
    );
    expect(denied?.status).toBe(302);
    expect(denied?.headers.get('location')).toContain('/login');
  });
});

describe('handleReviewsRequest', () => {
  const env = { EVAL_DASHBOARD_PASSWORD: 'board-secret', BLOB_READ_WRITE_TOKEN: 'token' };

  it('returns 401 JSON for a bad Bearer and accepts a good one', async () => {
    const persist = memoryPersist([]);
    const denied = await handleReviewsRequest(
      new Request('https://x/api/reviews', { headers: { Authorization: 'Bearer nope' } }),
      env,
      persist,
    );
    expect(denied.status).toBe(401);
    expect(await denied.json()).toEqual({ error: 'unauthorized' });

    const allowed = await handleReviewsRequest(
      new Request('https://x/api/reviews', { headers: { Authorization: 'Bearer board-secret' } }),
      env,
      persist,
    );
    expect(allowed.status).toBe(200);
    expect(await allowed.json()).toEqual({ reviews: [] });
  });

  it('filters GET by caseId and merges PUT by newer updatedAt', async () => {
    const persist = memoryPersist([
      review({
        caseId: 'one',
        updatedAt: '2026-08-10T00:00:00.000Z',
        content: { passFail: 'pass', comment: 'local', labels: [] },
      }),
      review({ caseId: 'two', updatedAt: '2026-08-10T00:00:00.000Z' }),
    ]);
    const filtered = await handleReviewsRequest(
      new Request('https://x/api/reviews?caseId=two', {
        headers: { Authorization: 'Bearer board-secret' },
      }),
      env,
      persist,
    );
    const body = (await filtered.json()) as { reviews: SteerReview[] };
    expect(body.reviews).toHaveLength(1);
    expect(body.reviews[0].caseId).toBe('two');

    const put = await handleReviewsRequest(
      new Request('https://x/api/reviews', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer board-secret',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          review: review({
            caseId: 'one',
            updatedAt: '2026-08-27T00:00:00.000Z',
            content: { passFail: 'fail', comment: 'remote', labels: [] },
          }),
        }),
      }),
      env,
      persist,
    );
    expect(put.status).toBe(200);
    const saved = await persist.read();
    expect(saved.find((item) => item.caseId === 'one')?.content.comment).toBe('remote');
    expect(saved.find((item) => item.caseId === 'two')).toBeDefined();
  });

  it('returns 503 JSON when blob persist is not configured', async () => {
    const persist: ReviewsPersist = {
      async read() {
        throw new PersistNotConfigured();
      },
      async write() {
        throw new PersistNotConfigured();
      },
    };
    const res = await handleReviewsRequest(
      new Request('https://x/api/reviews', { headers: { Authorization: 'Bearer board-secret' } }),
      { EVAL_DASHBOARD_PASSWORD: 'board-secret' },
      persist,
    );
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'reviews persist is not configured' });
  });
});

describe('appendCommentToReviews', () => {
  it('adds an Oscar note without changing Sam scores', () => {
    const existing = review({
      caseId: 'sync-was-becoming-a-type-religion',
      updatedAt: '2026-08-10T00:00:00.000Z',
      content: { passFail: 'pass', comment: 'Clear.', labels: [] },
      action: { passFail: 'fail', comment: 'Too hard.', labels: ['one-way door'] },
    });
    const result = appendCommentToReviews([existing], {
      caseId: 'sync-was-becoming-a-type-religion',
      author: 'oscar',
      text: 'I will cut the type chapel.',
      lane: 'action',
      kind: 'comment',
    });
    expect(result).not.toBeNull();
    expect(result!.review.content).toEqual(existing.content);
    expect(result!.review.action).toEqual(existing.action);
    expect(result!.review.notes).toHaveLength(1);
    expect(result!.note.author).toBe('oscar');
    expect(result!.note.text).toBe('I will cut the type chapel.');
    expect(result!.note.lane).toBe('action');
    expect(result!.note.id).toMatch(/^n-/);
    expect(result!.note.createdAt).toMatch(/^\d{4}-/);
  });

  it('attaches a span highlight when section and spanText are given', () => {
    const existing = review({ caseId: 'sync-was-becoming-a-type-religion' });
    const result = appendCommentToReviews([existing], {
      caseId: 'sync-was-becoming-a-type-religion',
      author: 'oscar',
      text: 'This sentence is the cut.',
      lane: 'content',
      kind: 'comment',
      section: 'choice',
      spanText: 'I posted the cut',
      start: 3,
      end: 19,
    });
    expect(result!.review.highlights).toHaveLength(1);
    expect(result!.review.highlights[0].text).toBe('I posted the cut');
    expect(result!.note.highlightId).toBe(result!.review.highlights[0].id);
    expect(result!.note.spanText).toBe('I posted the cut');
    expect(result!.note.section).toBe('choice');
  });

  it('opens a new empty review for a seed case and rejects an unknown case', () => {
    const created = appendCommentToReviews([], {
      caseId: 'finish-path-tracer-smoke-after-annotations-trial-later',
      author: 'oscar',
      text: 'On it.',
      lane: 'content',
    });
    expect(created?.review.content.passFail).toBeNull();
    expect(created?.review.action.passFail).toBeNull();
    expect(
      appendCommentToReviews([], {
        caseId: 'not-a-steer',
        author: 'oscar',
        text: 'Nope.',
        lane: 'content',
      }),
    ).toBeNull();
  });
});

describe('handleReviewsCommentRequest', () => {
  const env = { EVAL_DASHBOARD_PASSWORD: 'board-secret', BLOB_READ_WRITE_TOKEN: 'token' };

  it('lets Oscar post a comment with Bearer auth', async () => {
    const persist = memoryPersist([
      review({
        caseId: 'sync-was-becoming-a-type-religion',
        updatedAt: '2026-08-10T00:00:00.000Z',
        content: { passFail: 'fail', comment: 'Sam score', labels: [] },
      }),
    ]);
    const res = await handleReviewsCommentRequest(
      new Request('https://x/api/reviews/comment', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer board-secret',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          caseId: 'sync-was-becoming-a-type-religion',
          text: 'Will fix the plaque.',
          lane: 'content',
        }),
      }),
      env,
      persist,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { review: SteerReview; note: { author: string; text: string } };
    expect(body.note.author).toBe('oscar');
    expect(body.note.text).toBe('Will fix the plaque.');
    const saved = await persist.read();
    expect(saved[0].content.passFail).toBe('fail');
    expect(saved[0].content.comment).toBe('Sam score');
    expect(saved[0].notes[0].text).toBe('Will fix the plaque.');
  });

  it('404s an unknown case and 401s without auth', async () => {
    const persist = memoryPersist();
    const missing = await handleReviewsCommentRequest(
      new Request('https://x/api/reviews/comment', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer board-secret',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ caseId: 'missing-case', text: 'Hi', lane: 'action' }),
      }),
      env,
      persist,
    );
    expect(missing.status).toBe(404);
    const denied = await handleReviewsCommentRequest(
      new Request('https://x/api/reviews/comment', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          caseId: 'sync-was-becoming-a-type-religion',
          text: 'Hi',
          lane: 'action',
        }),
      }),
      env,
      persist,
    );
    expect(denied.status).toBe(401);
  });
});

describe('handleReviewsReplyRequest', () => {
  const env = { EVAL_DASHBOARD_PASSWORD: 'board-secret', BLOB_READ_WRITE_TOKEN: 'token' };

  it('appends a reply and 404s when the note is missing', async () => {
    const persist = memoryPersist([
      review({
        caseId: 'one',
        updatedAt: '2026-08-10T00:00:00.000Z',
        notes: [
          {
            id: 'n1',
            kind: 'question',
            lane: 'content',
            author: 'sam',
            text: 'Gap?',
            createdAt: '2026-08-10T00:00:00.000Z',
            replies: [],
          },
        ],
      }),
    ]);
    const ok = await handleReviewsReplyRequest(
      new Request('https://x/api/reviews/reply', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer board-secret',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ caseId: 'one', noteId: 'n1', author: 'oscar', text: 'Here.' }),
      }),
      env,
      persist,
    );
    expect(ok.status).toBe(200);
    const saved = await persist.read();
    expect(saved[0].notes[0].replies[0].text).toBe('Here.');

    const missing = await handleReviewsReplyRequest(
      new Request('https://x/api/reviews/reply', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer board-secret',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ caseId: 'one', noteId: 'nope', author: 'oscar', text: 'Here.' }),
      }),
      env,
      persist,
    );
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: 'note not found' });
  });
});

describe('vercel.json', () => {
  it('keeps the /api/* rewrite so reviews are not served as index.html', () => {
    const vercel = JSON.parse(
      readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'),
    ) as { rewrites: { source: string; destination: string }[] };
    expect(vercel.rewrites).toContainEqual({
      source: '/api/(.*)',
      destination: '/api/$1',
    });
  });
});

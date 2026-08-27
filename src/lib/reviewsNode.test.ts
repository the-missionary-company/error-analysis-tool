import { describe, expect, it } from 'vitest';
import { handleReviewsRequest } from './reviewsApi.js';
import { asWebRequest, runReviewsFunction } from './reviewsNode.js';

describe('asWebRequest', () => {
  it('rebuilds a Web Request from a Node IncomingMessage-shaped object', async () => {
    const request = await asWebRequest({
      method: 'GET',
      url: '/api/reviews',
      headers: {
        authorization: 'Bearer board-secret',
        host: 'eval-dashboard-zeta.vercel.app',
      },
    });
    expect(request).toBeInstanceOf(Request);
    expect(request.headers.get('authorization')).toBe('Bearer board-secret');
    expect(new URL(request.url).pathname).toBe('/api/reviews');
  });

  it('does not throw when headers have no get()', async () => {
    await expect(asWebRequest({ method: 'GET', url: '/api/reviews', headers: undefined })).resolves.toBeInstanceOf(
      Request,
    );
  });
});

describe('runReviewsFunction', () => {
  const env = { EVAL_DASHBOARD_PASSWORD: 'board-secret' };
  const persist = {
    async read() {
      return [];
    },
    async write() {},
  };

  it('serves GET /api/reviews from a Node-style req without crashing', async () => {
    const response = await runReviewsFunction(
      {
        method: 'GET',
        url: '/api/reviews',
        headers: { authorization: 'Bearer board-secret', host: 'example.test' },
      },
      undefined,
      (request) => handleReviewsRequest(request, env, persist),
    );
    expect(response).toBeInstanceOf(Response);
    expect(response!.status).toBe(200);
    expect(await response!.json()).toEqual({ reviews: [] });
  });

  it('writes JSON 500 onto a Node res when the handler throws', async () => {
    const written: { status?: number; headers: Record<string, string>; body?: string } = { headers: {} };
    await runReviewsFunction({ method: 'GET', url: '/api/reviews' }, {
      statusCode: 200,
      setHeader(name: string, value: string) {
        written.headers[name] = value;
      },
      end(body?: string) {
        written.status = this.statusCode;
        written.body = body;
      },
    }, async () => {
      throw new Error('boom');
    });
    expect(written.status).toBe(500);
    expect(written.headers['content-type']).toContain('application/json');
    expect(JSON.parse(written.body ?? '')).toEqual({ error: 'boom' });
  });
});

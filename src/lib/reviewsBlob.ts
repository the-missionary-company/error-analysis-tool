import { get, put } from '@vercel/blob';
import type { SteerReview } from '../types/steers.js';
import { PersistNotConfigured, REVIEWS_BLOB_PATH, type ReviewsPersist } from './reviewsApi.js';
import { parseSteerReviews } from './steers.js';

export function createBlobReviewsPersist(
  env: Record<string, string | undefined> = process.env,
): ReviewsPersist {
  const token = env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return {
      async read() {
        throw new PersistNotConfigured();
      },
      async write() {
        throw new PersistNotConfigured();
      },
    };
  }

  return {
    async read() {
      const result = await get(REVIEWS_BLOB_PATH, {
        access: 'private',
        token,
        useCache: false,
      });
      if (!result) return [];
      const stream = 'stream' in result ? result.stream : null;
      if (!stream) return [];
      const text = await new Response(stream).text();
      if (!text.trim()) return [];
      return parseSteerReviews(JSON.parse(text) as unknown);
    },
    async write(reviews: SteerReview[]) {
      await put(REVIEWS_BLOB_PATH, JSON.stringify({ reviews }), {
        access: 'private',
        token,
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
      });
    },
  };
}

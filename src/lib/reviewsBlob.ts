import { BlobNotFoundError, get, put } from '@vercel/blob';
import type { SteerReview } from '../types/steers.js';
import { PersistNotConfigured, REVIEWS_BLOB_PATH, type ReviewsPersist } from './reviewsApi.js';
import { parseSteerReviews } from './steers.js';

export interface BlobIo {
  get: typeof get;
  put: typeof put;
}

export function isBlobNotFound(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof BlobNotFoundError) return true;
  const record = typeof error === 'object' ? (error as { name?: string; status?: number; statusCode?: number }) : {};
  if (record.name === 'BlobNotFoundError' || record.name === 'not_found') return true;
  if (record.status === 404 || record.statusCode === 404) return true;
  const message = error instanceof Error ? error.message : String(error);
  return /not found|404|does not exist/i.test(message);
}

export function createBlobReviewsPersist(
  env: Record<string, string | undefined> = process.env,
  io: BlobIo = { get, put },
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
      try {
        const result = await io.get(REVIEWS_BLOB_PATH, {
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
      } catch (error) {
        if (isBlobNotFound(error)) return [];
        throw error;
      }
    },
    async write(reviews: SteerReview[]) {
      await io.put(REVIEWS_BLOB_PATH, JSON.stringify({ reviews }), {
        access: 'private',
        token,
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
      });
    },
  };
}

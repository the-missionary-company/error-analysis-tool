import { handleReviewsNoteRequest } from '../src/lib/reviewsApi.js';
import { createBlobReviewsPersist } from '../src/lib/reviewsBlob.js';
import { runReviewsFunction } from '../src/lib/reviewsNode.js';

export const config = { runtime: 'nodejs' };

export default async function handler(first: unknown, second?: unknown): Promise<Response | void> {
  return runReviewsFunction(first, second, (request) =>
    handleReviewsNoteRequest(request, process.env, createBlobReviewsPersist(process.env)),
  );
}

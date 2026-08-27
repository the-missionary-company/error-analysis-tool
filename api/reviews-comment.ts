import { handleReviewsCommentRequest } from '../src/lib/reviewsApi.js';
import { createBlobReviewsPersist } from '../src/lib/reviewsBlob.js';

export const config = { runtime: 'nodejs' };

export default async function handler(request: Request): Promise<Response> {
  return handleReviewsCommentRequest(request, process.env, createBlobReviewsPersist(process.env));
}

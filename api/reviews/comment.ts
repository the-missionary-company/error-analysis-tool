import { handleReviewsCommentRequest } from '../../src/lib/reviewsApi';
import { createBlobReviewsPersist } from '../../src/lib/reviewsBlob';

export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  return handleReviewsCommentRequest(request, process.env, createBlobReviewsPersist(process.env));
}

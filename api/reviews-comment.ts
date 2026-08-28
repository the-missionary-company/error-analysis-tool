import { readPersistedCaseIds } from '../src/lib/casesApi.js';
import { createBlobCasesPersist } from '../src/lib/casesBlob.js';
import { handleReviewsCommentRequest } from '../src/lib/reviewsApi.js';
import { createBlobReviewsPersist } from '../src/lib/reviewsBlob.js';
import { runReviewsFunction } from '../src/lib/reviewsNode.js';

export const config = { runtime: 'nodejs' };

export default async function handler(first: unknown, second?: unknown): Promise<Response | void> {
  const extraCaseIds = await readPersistedCaseIds(createBlobCasesPersist(process.env));
  return runReviewsFunction(first, second, (request) =>
    handleReviewsCommentRequest(
      request,
      process.env,
      createBlobReviewsPersist(process.env),
      extraCaseIds,
    ),
  );
}

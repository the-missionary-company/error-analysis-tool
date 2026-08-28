import { handleCasesRequest } from '../src/lib/casesApi.js';
import { createBlobCasesPersist } from '../src/lib/casesBlob.js';
import { runApiFunction } from '../src/lib/reviewsNode.js';

export const config = { runtime: 'nodejs' };

export default async function handler(first: unknown, second?: unknown): Promise<Response | void> {
  return runApiFunction(first, second, (request) =>
    handleCasesRequest(request, process.env, createBlobCasesPersist(process.env)),
  );
}

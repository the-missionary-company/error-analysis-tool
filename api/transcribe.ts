import { handleTranscribeRequest } from '../src/lib/transcribeApi.js';
import { runApiFunction } from '../src/lib/reviewsNode.js';

export const config = { runtime: 'nodejs' };

export default async function handler(first: unknown, second?: unknown): Promise<Response | void> {
  return runApiFunction(first, second, (request) => handleTranscribeRequest(request, process.env));
}

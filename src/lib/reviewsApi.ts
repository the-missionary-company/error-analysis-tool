import type { Author, SteerReview } from '../types/steers';
import { addThreadReply, parseSteerReviews } from './steers';
import { hasAuthCookie, isPublicPath, passwordMatches } from './evalAuth';

export const REVIEWS_BLOB_PATH = 'steer-reviews.json';

export class PersistNotConfigured extends Error {
  constructor() {
    super('reviews persist is not configured');
    this.name = 'PersistNotConfigured';
  }
}

export interface ReviewsPersist {
  read(): Promise<SteerReview[]>;
  write(reviews: SteerReview[]): Promise<void>;
}

export function isReviewsApiPath(pathname: string): boolean {
  const path = (pathname.split('?')[0] ?? pathname).replace(/\/$/, '') || '/';
  return path === '/api/reviews' || path.startsWith('/api/reviews/');
}

export function parseBearerPassword(header: string | null | undefined): string | undefined {
  if (!header) return undefined;
  const match = header.trim().match(/^Bearer\s+(\S+)/i);
  return match?.[1];
}

export async function authorizeReviewsRequest(
  request: Request,
  env: Record<string, string | undefined>,
): Promise<boolean> {
  if (hasAuthCookie(request.headers.get('cookie'))) return true;
  const password = parseBearerPassword(request.headers.get('authorization'));
  return passwordMatches(password, env);
}

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export async function gateEvalDashboardRequest(
  request: Request,
  env: Record<string, string | undefined> = {},
): Promise<Response | undefined> {
  const { pathname } = new URL(request.url);
  if (isPublicPath(pathname)) return undefined;
  if (isReviewsApiPath(pathname)) {
    if (await authorizeReviewsRequest(request, env)) return undefined;
    return jsonResponse(401, { error: 'unauthorized' });
  }
  if (hasAuthCookie(request.headers.get('cookie'))) return undefined;
  return Response.redirect(new URL('/login', request.url), 302);
}

export function mergeReviewsByUpdatedAt(
  existing: SteerReview[],
  incoming: SteerReview[],
): SteerReview[] {
  const byId = new Map<string, SteerReview>();
  for (const review of existing) byId.set(review.caseId, review);
  for (const review of incoming) {
    const prev = byId.get(review.caseId);
    if (!prev || compareUpdatedAt(review.updatedAt, prev.updatedAt) >= 0) {
      byId.set(review.caseId, review);
    }
  }
  return [...byId.values()];
}

function compareUpdatedAt(a: string, b: string): number {
  const left = Date.parse(a);
  const right = Date.parse(b);
  const leftOk = Number.isFinite(left);
  const rightOk = Number.isFinite(right);
  if (leftOk && rightOk) return left - right;
  if (leftOk) return 1;
  if (rightOk) return -1;
  return a >= b ? 1 : -1;
}

export function parseReviewsWritePayload(input: unknown): SteerReview[] {
  if (input && typeof input === 'object' && !Array.isArray(input) && 'review' in input) {
    return parseSteerReviews({ reviews: [(input as { review: unknown }).review] });
  }
  return parseSteerReviews(input);
}

export function appendReplyToReviews(
  reviews: SteerReview[],
  input: { caseId: string; noteId: string; author: Author; text: string },
): { review: SteerReview } | null {
  const current = reviews.find((item) => item.caseId === input.caseId);
  if (!current) return null;
  const note = current.notes.find((item) => item.id === input.noteId);
  if (!note) return null;
  const threaded = addThreadReply(note, input.author, input.text);
  if (threaded === note && !input.text.trim()) return { review: current };
  return {
    review: {
      ...current,
      notes: current.notes.map((item) => (item.id === note.id ? threaded : item)),
      updatedAt: new Date().toISOString(),
    },
  };
}

function persistError(error: unknown): Response | null {
  if (error instanceof PersistNotConfigured) {
    return jsonResponse(503, { error: 'reviews persist is not configured' });
  }
  return null;
}

export async function handleReviewsRequest(
  request: Request,
  env: Record<string, string | undefined>,
  persist: ReviewsPersist,
): Promise<Response> {
  if (!(await authorizeReviewsRequest(request, env))) {
    return jsonResponse(401, { error: 'unauthorized' });
  }
  if (request.method === 'GET') {
    try {
      const reviews = await persist.read();
      const caseId = new URL(request.url).searchParams.get('caseId');
      return jsonResponse(200, {
        reviews: caseId ? reviews.filter((item) => item.caseId === caseId) : reviews,
      });
    } catch (error) {
      return persistError(error) ?? jsonResponse(500, { error: 'failed to read reviews' });
    }
  }
  if (request.method === 'PUT') {
    try {
      const incoming = parseReviewsWritePayload(await request.json());
      const existing = await persist.read();
      const reviews = mergeReviewsByUpdatedAt(existing, incoming);
      await persist.write(reviews);
      return jsonResponse(200, { reviews });
    } catch (error) {
      if (error instanceof PersistNotConfigured) {
        return jsonResponse(503, { error: 'reviews persist is not configured' });
      }
      return jsonResponse(400, {
        error: error instanceof Error ? error.message : 'invalid reviews payload',
      });
    }
  }
  return jsonResponse(405, { error: 'method not allowed' });
}

export async function handleReviewsReplyRequest(
  request: Request,
  env: Record<string, string | undefined>,
  persist: ReviewsPersist,
): Promise<Response> {
  if (!(await authorizeReviewsRequest(request, env))) {
    return jsonResponse(401, { error: 'unauthorized' });
  }
  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'method not allowed' });
  }
  try {
    const body = (await request.json()) as {
      caseId?: unknown;
      noteId?: unknown;
      author?: unknown;
      text?: unknown;
    };
    if (typeof body.caseId !== 'string' || typeof body.noteId !== 'string' || typeof body.text !== 'string') {
      return jsonResponse(400, { error: 'caseId, noteId, and text are required' });
    }
    const author: Author = body.author === 'oscar' ? 'oscar' : 'sam';
    const existing = await persist.read();
    const result = appendReplyToReviews(existing, {
      caseId: body.caseId,
      noteId: body.noteId,
      author,
      text: body.text,
    });
    if (!result) return jsonResponse(404, { error: 'note not found' });
    const reviews = mergeReviewsByUpdatedAt(existing, [result.review]);
    await persist.write(reviews);
    return jsonResponse(200, { review: result.review });
  } catch (error) {
    return persistError(error) ?? jsonResponse(400, { error: 'invalid reply payload' });
  }
}

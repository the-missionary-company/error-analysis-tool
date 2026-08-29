import { SEED_STEER_IDS } from '../data/seedCaseIds.js';
import type { Author, NoteKind, ScoreLane, SteerNote, SteerReview, SteerSection } from '../types/steers.js';
import {
  addThreadReply,
  attachSpanNotes,
  editSteerNote,
  emptyReview,
  newId,
  parseSteerReviews,
  resolveSteerNote,
  unresolveSteerNote,
} from './steers.js';
import { authorizeReviewsRequest, jsonResponse } from './evalGate.js';

export { gateEvalDashboardRequest, isCasesApiPath, isJsonApiPath, isReviewsApiPath } from './evalGate.js';

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

const LANES: ScoreLane[] = ['content', 'action'];
const SECTIONS: SteerSection[] = ['context', 'problem', 'options', 'choice'];

export interface AppendCommentInput {
  caseId: string;
  author: Author;
  text: string;
  lane: ScoreLane;
  kind?: NoteKind;
  highlightId?: string;
  section?: SteerSection;
  start?: number;
  end?: number;
  spanText?: string;
}

function knownCase(
  caseId: string,
  reviews: SteerReview[],
  extraCaseIds: readonly string[] = [],
): boolean {
  return (
    reviews.some((item) => item.caseId === caseId) ||
    (SEED_STEER_IDS as readonly string[]).includes(caseId) ||
    extraCaseIds.includes(caseId)
  );
}

export function appendCommentToReviews(
  reviews: SteerReview[],
  input: AppendCommentInput,
  extraCaseIds: readonly string[] = [],
): { review: SteerReview; note: SteerNote } | null {
  const text = input.text.trim();
  if (!text || !knownCase(input.caseId, reviews, extraCaseIds)) return null;
  const current = reviews.find((item) => item.caseId === input.caseId) ?? emptyReview(input.caseId);
  const kind: NoteKind = input.kind === 'question' ? 'question' : 'comment';

  if (input.highlightId) {
    const highlight = current.highlights.find((item) => item.id === input.highlightId);
    if (!highlight) return null;
    const note: SteerNote = {
      id: newId('n'),
      kind,
      lane: input.lane,
      author: input.author,
      text,
      createdAt: new Date().toISOString(),
      replies: [],
      highlightId: highlight.id,
      section: highlight.section,
      start: highlight.start,
      end: highlight.end,
      spanText: highlight.text,
    };
    return {
      review: {
        ...current,
        notes: [...current.notes, note],
        updatedAt: new Date().toISOString(),
      },
      note,
    };
  }

  if (input.section && input.spanText?.trim()) {
    const spanText = input.spanText.trim();
    const start = typeof input.start === 'number' ? input.start : 0;
    const end = typeof input.end === 'number' ? input.end : start + spanText.length;
    const next = attachSpanNotes({
      review: current,
      span: { section: input.section, start, end, text: spanText },
      author: input.author,
      content: input.lane === 'content' ? { kind, text } : undefined,
      action: input.lane === 'action' ? { kind, text } : undefined,
    });
    const note = next.notes[next.notes.length - 1];
    return { review: { ...next, updatedAt: new Date().toISOString() }, note };
  }

  const note: SteerNote = {
    id: newId('n'),
    kind,
    lane: input.lane,
    author: input.author,
    text,
    createdAt: new Date().toISOString(),
    replies: [],
  };
  return {
    review: {
      ...current,
      notes: [...current.notes, note],
      updatedAt: new Date().toISOString(),
    },
    note,
  };
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

export async function handleReviewsCommentRequest(
  request: Request,
  env: Record<string, string | undefined>,
  persist: ReviewsPersist,
  extraCaseIds: readonly string[] = [],
): Promise<Response> {
  if (!(await authorizeReviewsRequest(request, env))) {
    return jsonResponse(401, { error: 'unauthorized' });
  }
  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'method not allowed' });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.caseId !== 'string' || typeof body.text !== 'string' || !body.text.trim()) {
      return jsonResponse(400, { error: 'caseId and text are required' });
    }
    if (!LANES.includes(body.lane as ScoreLane)) {
      return jsonResponse(400, { error: 'lane must be content or action' });
    }
    const existing = await persist.read();
    const result = appendCommentToReviews(
      existing,
      {
        caseId: body.caseId,
        author: body.author === 'sam' ? 'sam' : 'oscar',
        text: body.text,
        lane: body.lane as ScoreLane,
        kind: body.kind === 'question' ? 'question' : 'comment',
        highlightId: typeof body.highlightId === 'string' ? body.highlightId : undefined,
        section: SECTIONS.includes(body.section as SteerSection)
          ? (body.section as SteerSection)
          : undefined,
        start: typeof body.start === 'number' ? body.start : undefined,
        end: typeof body.end === 'number' ? body.end : undefined,
        spanText: typeof body.spanText === 'string' ? body.spanText : undefined,
      },
      extraCaseIds,
    );
    if (!result) {
      const exists = knownCase(body.caseId, existing, extraCaseIds);
      return jsonResponse(404, { error: exists ? 'highlight not found' : 'case not found' });
    }
    const reviews = mergeReviewsByUpdatedAt(existing, [result.review]);
    await persist.write(reviews);
    return jsonResponse(200, { review: result.review, note: result.note });
  } catch (error) {
    return persistError(error) ?? jsonResponse(400, { error: 'invalid comment payload' });
  }
}

export async function handleReviewsNoteRequest(
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
      text?: unknown;
      resolved?: unknown;
      author?: unknown;
    };
    if (typeof body.caseId !== 'string' || typeof body.noteId !== 'string') {
      return jsonResponse(400, { error: 'caseId and noteId are required' });
    }
    const hasText = typeof body.text === 'string';
    const hasResolved = typeof body.resolved === 'boolean';
    if (!hasText && !hasResolved) {
      return jsonResponse(400, { error: 'text or resolved is required' });
    }
    if (hasText && !body.text.trim()) {
      return jsonResponse(400, { error: 'text is required' });
    }
    const existing = await persist.read();
    const review = existing.find((item) => item.caseId === body.caseId);
    if (!review) return jsonResponse(404, { error: 'note not found' });
    const current = review.notes.find((note) => note.id === body.noteId);
    if (!current) return jsonResponse(404, { error: 'note not found' });

    let next = current;
    if (hasText) next = editSteerNote(next, body.text);
    if (hasResolved) {
      next = body.resolved
        ? resolveSteerNote(next, body.author === 'oscar' ? 'oscar' : 'sam')
        : unresolveSteerNote(next);
    }
    const updated: SteerReview = {
      ...review,
      notes: review.notes.map((note) => (note.id === next.id ? next : note)),
      updatedAt: new Date().toISOString(),
    };
    const reviews = mergeReviewsByUpdatedAt(existing, [updated]);
    await persist.write(reviews);
    return jsonResponse(200, { review: updated, note: next });
  } catch (error) {
    return persistError(error) ?? jsonResponse(400, { error: 'invalid note payload' });
  }
}

import type {
  Author,
  LaneScore,
  NoteKind,
  PassFail,
  ScoreLane,
  SteerBoardFile,
  SteerCase,
  SteerChipId,
  SteerHighlight,
  SteerNote,
  SteerRevision,
  SteerReview,
  SteerSection,
  ThreadReply,
} from '../types/steers';

export const LANE_DEFS: Record<
  ScoreLane,
  { id: ScoreLane; title: string; question: string; hint: string; placeholder: string }
> = {
  content: {
    id: 'content',
    title: 'Content / understanding',
    question:
      'How Oscar sent the message. Did Sam understand the write-up, and did he understand what the agents are doing?',
    hint: 'A question here means missing information.',
    placeholder: 'What Sam did not understand in the write-up — or about what the agents are doing.',
  },
  action: {
    id: 'action',
    title: 'Action / tech lead',
    question: 'How Oscar acted as the tech lead.',
    hint: 'Its own Pass or Fail. Do not reuse the Content / understanding score.',
    placeholder: 'How Oscar should have acted as tech lead — or why this call stands.',
  },
};

export const AUTHOR_DEFS: Record<Author, { id: Author; label: string }> = {
  sam: { id: 'sam', label: 'Sam' },
  oscar: { id: 'oscar', label: 'Oscar' },
};

export const CHIP_DEFS: { id: SteerChipId; label: string }[] = [
  { id: 'jumped-to-options', label: 'jumped to options (no background)' },
  { id: 'taught-the-feature', label: 'taught the feature instead of the development story' },
  { id: 'too-thin-to-decide', label: 'too thin to decide' },
  { id: 'cathedral-ceremony', label: 'cathedral / extra ceremony' },
];

const CASE_FIELDS = [
  'id',
  'title',
  'session',
  'stamp',
  'when',
  'context',
  'problem',
  'options',
  'choice',
] as const;

const SECTIONS: SteerSection[] = ['context', 'problem', 'options', 'choice'];
const LANES: ScoreLane[] = ['content', 'action'];
const CHIP_IDS = new Set<string>(CHIP_DEFS.map((c) => c.id));

export function emptyLaneScore(): LaneScore {
  return { passFail: null, comment: '', labels: [] };
}

export function emptyReview(caseId: string): SteerReview {
  return {
    caseId,
    content: emptyLaneScore(),
    action: emptyLaneScore(),
    highlights: [],
    chips: [],
    notes: [],
    revisions: [],
    updatedAt: '',
  };
}

export function reviewIsEmpty(review: SteerReview): boolean {
  return (
    review.content.passFail === null &&
    review.action.passFail === null &&
    review.content.comment.trim() === '' &&
    review.action.comment.trim() === '' &&
    review.highlights.length === 0 &&
    review.chips.length === 0 &&
    review.content.labels.length === 0 &&
    review.action.labels.length === 0 &&
    review.notes.length === 0 &&
    review.revisions.length === 0
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function decodeInput(input: unknown): unknown {
  if (typeof input === 'string') {
    try {
      return JSON.parse(input) as unknown;
    } catch {
      throw new Error('Invalid JSON');
    }
  }
  return input;
}

function readString(obj: Record<string, unknown>, key: string): string | undefined {
  const value = obj[key];
  return typeof value === 'string' ? value : undefined;
}

function parsePassFail(value: unknown): PassFail {
  if (value === 'pass' || value === 'fail') return value;
  return null;
}

function parseLabelList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.reduce<string[]>((acc, item) => addLaneLabel(acc, typeof item === 'string' ? item : ''), []);
}

function parseLaneScore(value: unknown): LaneScore {
  const obj = asRecord(value) ?? {};
  return {
    passFail: parsePassFail(obj.passFail),
    comment: typeof obj.comment === 'string' ? obj.comment : '',
    labels: parseLabelList(obj.labels),
  };
}

export function normalizeLabel(raw: string): string | null {
  const text = raw.trim().replace(/\s+/g, ' ');
  return text.length ? text : null;
}

export function addLaneLabel(labels: string[], raw: string): string[] {
  const next = normalizeLabel(raw);
  if (!next) return labels;
  if (labels.some((label) => label.toLowerCase() === next.toLowerCase())) return labels;
  return [...labels, next];
}

export function removeLaneLabel(labels: string[], raw: string): string[] {
  const target = normalizeLabel(raw);
  if (!target) return labels;
  return labels.filter((label) => label.toLowerCase() !== target.toLowerCase());
}

export function usedLabelsForLane(reviews: SteerReview[], lane: ScoreLane): string[] {
  const seen = new Map<string, string>();
  for (const review of reviews) {
    for (const label of review[lane]?.labels ?? []) {
      const key = label.toLowerCase();
      if (!seen.has(key)) seen.set(key, label);
    }
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

function isSteerCaseShape(value: unknown): value is Record<string, unknown> {
  const obj = asRecord(value);
  if (!obj) return false;
  return CASE_FIELDS.every((field) => typeof obj[field] === 'string');
}

function parseCase(value: unknown, index: number): SteerCase {
  const obj = asRecord(value);
  if (!obj) {
    throw new Error(`Case ${index + 1} is missing required steer fields`);
  }
  const missing = CASE_FIELDS.filter((field) => typeof obj[field] !== 'string');
  if (missing.length) {
    throw new Error(`Case ${index + 1} is missing required steer fields: ${missing.join(', ')}`);
  }
  const parsed: SteerCase = {
    id: String(obj.id),
    title: String(obj.title),
    session: String(obj.session),
    stamp: String(obj.stamp),
    when: String(obj.when),
    context: String(obj.context),
    problem: String(obj.problem),
    options: String(obj.options),
    choice: String(obj.choice),
  };
  const yourCall = readString(obj, 'yourCall');
  const tooAggressive = readString(obj, 'tooAggressive');
  const yourCallBody = readString(obj, 'yourCallBody');
  const contextLabel = readString(obj, 'contextLabel');
  const choiceLabel = readString(obj, 'choiceLabel');
  const notionUrl = readString(obj, 'notionUrl');
  if (yourCall) parsed.yourCall = yourCall;
  if (tooAggressive) parsed.tooAggressive = tooAggressive;
  if (yourCallBody) parsed.yourCallBody = yourCallBody;
  if (contextLabel) parsed.contextLabel = contextLabel;
  if (choiceLabel) parsed.choiceLabel = choiceLabel;
  if (notionUrl) parsed.notionUrl = notionUrl;
  return parsed;
}

export function parseSteerCases(input: unknown): SteerCase[] {
  const data = decodeInput(input);
  const obj = asRecord(data);

  if (obj?.traces && !obj.cases) {
    throw new Error('This looks like a Hub/A1 traces file, not a steer case list');
  }

  let raw: unknown[] | null = null;
  if (Array.isArray(data)) {
    raw = data;
  } else if (obj && Array.isArray(obj.cases)) {
    raw = obj.cases;
  } else if (isSteerCaseShape(data)) {
    raw = [data];
  }

  if (!raw) {
    throw new Error('Unrecognized JSON. Expect an array of steer cases or { cases: [...] }');
  }
  if (raw.length === 0) {
    throw new Error('No steer cases in file');
  }
  if (asRecord(raw[0])?.caseId && !isSteerCaseShape(raw[0])) {
    throw new Error('This file looks like steer reviews, not steer cases');
  }
  return raw.map(parseCase);
}

function parseSection(value: unknown): SteerSection {
  return SECTIONS.includes(value as SteerSection) ? (value as SteerSection) : 'context';
}

function parseLane(value: unknown): ScoreLane {
  return LANES.includes(value as ScoreLane) ? (value as ScoreLane) : 'content';
}

function parseChip(value: unknown): SteerChipId | null {
  return typeof value === 'string' && CHIP_IDS.has(value) ? (value as SteerChipId) : null;
}

function parseHighlight(value: unknown, index: number): SteerHighlight {
  const obj = asRecord(value) ?? {};
  const text = typeof obj.text === 'string' ? obj.text : '';
  const start = typeof obj.start === 'number' && Number.isFinite(obj.start) ? obj.start : 0;
  const end = typeof obj.end === 'number' && Number.isFinite(obj.end) ? obj.end : start + text.length;
  return {
    id: typeof obj.id === 'string' && obj.id ? obj.id : `h-${index + 1}`,
    section: parseSection(obj.section),
    start,
    end,
    text,
    lane: parseLane(obj.lane),
    passFail: parsePassFail(obj.passFail ?? obj.score),
    comment: typeof obj.comment === 'string' ? obj.comment : '',
  };
}

function parseAuthor(value: unknown): Author {
  return value === 'oscar' ? 'oscar' : 'sam';
}

function parseNoteKind(value: unknown): NoteKind {
  return value === 'question' ? 'question' : 'comment';
}

function parseReply(value: unknown, index: number): ThreadReply {
  const obj = asRecord(value) ?? {};
  return {
    id: typeof obj.id === 'string' && obj.id ? obj.id : `r-${index + 1}`,
    author: parseAuthor(obj.author),
    text: typeof obj.text === 'string' ? obj.text : '',
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : '',
  };
}

function parseNote(value: unknown, index: number): SteerNote {
  const obj = asRecord(value) ?? {};
  const start = typeof obj.start === 'number' && Number.isFinite(obj.start) ? obj.start : undefined;
  const end = typeof obj.end === 'number' && Number.isFinite(obj.end) ? obj.end : undefined;
  const note: SteerNote = {
    id: typeof obj.id === 'string' && obj.id ? obj.id : `n-${index + 1}`,
    kind: parseNoteKind(obj.kind),
    lane: parseLane(obj.lane),
    author: parseAuthor(obj.author),
    text: typeof obj.text === 'string' ? obj.text : '',
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : '',
    replies: Array.isArray(obj.replies) ? obj.replies.map(parseReply) : [],
  };
  if (typeof obj.highlightId === 'string' && obj.highlightId) note.highlightId = obj.highlightId;
  if (SECTIONS.includes(obj.section as SteerSection)) note.section = obj.section as SteerSection;
  if (start !== undefined) note.start = start;
  if (end !== undefined) note.end = end;
  if (typeof obj.spanText === 'string') note.spanText = obj.spanText;
  return note;
}

function parseRevision(value: unknown, index: number): SteerRevision {
  const obj = asRecord(value) ?? {};
  const oldText = typeof obj.oldText === 'string' ? obj.oldText : '';
  const start = typeof obj.start === 'number' && Number.isFinite(obj.start) ? obj.start : 0;
  const end = typeof obj.end === 'number' && Number.isFinite(obj.end) ? obj.end : start + oldText.length;
  return {
    id: typeof obj.id === 'string' && obj.id ? obj.id : `rev-${index + 1}`,
    questionId: typeof obj.questionId === 'string' ? obj.questionId : '',
    section: parseSection(obj.section),
    oldText,
    newText: typeof obj.newText === 'string' ? obj.newText : '',
    start,
    end,
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : '',
  };
}

function parseReview(value: unknown): SteerReview {
  const obj = asRecord(value);
  if (!obj || typeof obj.caseId !== 'string' || !obj.caseId) {
    throw new Error('Review is missing caseId');
  }
  const highlights = Array.isArray(obj.highlights) ? obj.highlights.map(parseHighlight) : [];
  const chips = Array.isArray(obj.chips)
    ? obj.chips.map(parseChip).filter((c): c is SteerChipId => c !== null)
    : [];
  const notes = Array.isArray(obj.notes) ? obj.notes.map(parseNote) : [];
  const revisions = Array.isArray(obj.revisions) ? obj.revisions.map(parseRevision) : [];
  return {
    caseId: obj.caseId,
    content: parseLaneScore(obj.content),
    action: parseLaneScore(obj.action),
    highlights,
    chips,
    notes,
    revisions,
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : '',
  };
}

export function parseSteerReviews(input: unknown): SteerReview[] {
  const data = decodeInput(input);
  const obj = asRecord(data);

  let raw: unknown[] | null = null;
  if (Array.isArray(data)) {
    raw = data;
  } else if (obj && Array.isArray(obj.reviews)) {
    raw = obj.reviews;
  }

  if (!raw) {
    throw new Error('Unrecognized JSON. Expect an array of reviews or { reviews: [...] }');
  }
  return raw.map(parseReview);
}

export function exportSteerBoardJSON(cases: SteerCase[], reviews: SteerReview[]): string {
  const file: SteerBoardFile = {
    kind: 'oscar-steer-board',
    exportedAt: new Date().toISOString(),
    cases,
    reviews,
  };
  return JSON.stringify(file, null, 2);
}

export function mergeCases(base: SteerCase[], incoming: SteerCase[]): SteerCase[] {
  const byId = new Map<string, SteerCase>();
  for (const item of base) byId.set(item.id, item);
  const extras: SteerCase[] = [];
  for (const item of incoming) {
    if (byId.has(item.id)) {
      byId.set(item.id, item);
    } else {
      extras.push(item);
    }
  }
  return [...byId.values(), ...extras];
}

export function findSpanOffsets(
  text: string,
  span: string,
  stored?: { start: number; end: number; text: string },
): { start: number; end: number; text: string } | null {
  if (stored) {
    const slice = text.slice(stored.start, stored.end);
    if (stored.text && slice === stored.text) {
      return { start: stored.start, end: stored.end, text: stored.text };
    }
    const needle = stored.text || span;
    if (needle) {
      const idx = text.indexOf(needle);
      if (idx >= 0) return { start: idx, end: idx + needle.length, text: needle };
    }
  }
  if (!span) return null;
  const idx = text.indexOf(span);
  if (idx < 0) return null;
  return { start: idx, end: idx + span.length, text: span };
}

export function applyHighlightSegments(
  text: string,
  highlights: SteerHighlight[],
): { text: string; highlight?: SteerHighlight }[] {
  const resolved = highlights
    .map((h) => {
      const offsets = findSpanOffsets(text, h.text, { start: h.start, end: h.end, text: h.text });
      return offsets ? { ...h, ...offsets } : null;
    })
    .filter((h): h is SteerHighlight => h !== null)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const segments: { text: string; highlight?: SteerHighlight }[] = [];
  let cursor = 0;
  for (const highlight of resolved) {
    const start = Math.max(0, Math.min(text.length, highlight.start));
    const end = Math.max(start, Math.min(text.length, highlight.end));
    if (start < cursor) continue;
    if (start > cursor) segments.push({ text: text.slice(cursor, start) });
    if (end > start) segments.push({ text: text.slice(start, end), highlight });
    cursor = end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  if (segments.length === 0) segments.push({ text });
  return segments;
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function newHighlightId(): string {
  return newId('h');
}

export function addThreadReply(note: SteerNote, author: Author, text: string): SteerNote {
  const trimmed = text.trim();
  if (!trimmed) return note;
  return {
    ...note,
    replies: [
      ...note.replies,
      {
        id: newId('r'),
        author,
        text: trimmed,
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

export function createRevisionFromQuestion(
  question: SteerNote,
  newText: string,
  original: string,
): SteerRevision {
  const replacement = newText.trim();
  const oldText = question.spanText ?? '';
  const offsets = findSpanOffsets(original, oldText, {
    start: question.start ?? 0,
    end: question.end ?? oldText.length,
    text: oldText,
  }) ?? { start: question.start ?? 0, end: question.end ?? oldText.length, text: oldText };
  return {
    id: newId('rev'),
    questionId: question.id,
    section: question.section ?? 'context',
    oldText: offsets.text,
    newText: replacement,
    start: offsets.start,
    end: offsets.end,
    createdAt: new Date().toISOString(),
  };
}

export type BodySegmentRole = 'plain' | 'highlight' | 'struck' | 'replacement';

export interface BodySegment {
  text: string;
  role: BodySegmentRole;
  highlight?: SteerHighlight;
  revision?: SteerRevision;
}

export function applyBodySegments(
  text: string,
  highlights: SteerHighlight[],
  revisions: SteerRevision[],
): BodySegment[] {
  const resolvedRevisions = revisions
    .map((revision) => {
      const offsets = findSpanOffsets(text, revision.oldText, {
        start: revision.start,
        end: revision.end,
        text: revision.oldText,
      });
      return offsets
        ? { ...revision, start: offsets.start, end: offsets.end, oldText: offsets.text }
        : null;
    })
    .filter((revision): revision is SteerRevision => revision !== null)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const resolvedHighlights = highlights
    .map((h) => {
      const offsets = findSpanOffsets(text, h.text, { start: h.start, end: h.end, text: h.text });
      return offsets ? { ...h, ...offsets } : null;
    })
    .filter((h): h is SteerHighlight => h !== null);

  const segments: BodySegment[] = [];
  let cursor = 0;
  for (const revision of resolvedRevisions) {
    const start = Math.max(0, Math.min(text.length, revision.start));
    const end = Math.max(start, Math.min(text.length, revision.end));
    if (start < cursor) continue;
    if (start > cursor) {
      segments.push(...sliceWithHighlights(text, cursor, start, resolvedHighlights));
    }
    const highlight = resolvedHighlights.find((h) => h.start < end && h.end > start);
    segments.push({
      text: text.slice(start, end),
      role: 'struck',
      highlight,
      revision,
    });
    if (revision.newText) {
      segments.push({
        text: revision.newText,
        role: 'replacement',
        revision,
      });
    }
    cursor = end;
  }
  if (cursor < text.length) {
    segments.push(...sliceWithHighlights(text, cursor, text.length, resolvedHighlights));
  }
  if (segments.length === 0) segments.push({ text, role: 'plain' });
  return segments;
}

function sliceWithHighlights(
  text: string,
  from: number,
  to: number,
  highlights: SteerHighlight[],
): BodySegment[] {
  const slice = text.slice(from, to);
  const inner = highlights
    .filter((h) => h.start < to && h.end > from)
    .map((h) => ({
      ...h,
      start: Math.max(h.start, from) - from,
      end: Math.min(h.end, to) - from,
    }))
    .filter((h) => h.end > h.start)
    .sort((a, b) => a.start - b.start);
  if (!inner.length) return [{ text: slice, role: 'plain' }];
  const parts: BodySegment[] = [];
  let cursor = 0;
  for (const highlight of inner) {
    if (highlight.start < cursor) continue;
    if (highlight.start > cursor) {
      parts.push({ text: slice.slice(cursor, highlight.start), role: 'plain' });
    }
    parts.push({
      text: slice.slice(highlight.start, highlight.end),
      role: 'highlight',
      highlight,
    });
    cursor = highlight.end;
  }
  if (cursor < slice.length) parts.push({ text: slice.slice(cursor), role: 'plain' });
  return parts;
}

export function parseSteerPayload(input: unknown): { cases: SteerCase[]; reviews: SteerReview[] } {
  const data = decodeInput(input);
  const cases: SteerCase[] = [];
  const reviews: SteerReview[] = [];

  try {
    cases.push(...parseSteerCases(data));
  } catch {
    // file may be reviews-only
  }
  try {
    reviews.push(...parseSteerReviews(data));
  } catch {
    // file may be cases-only
  }

  if (!cases.length && !reviews.length) {
    throw new Error(
      'Unrecognized JSON. Expect steer cases [{ id, title, session, stamp, when, context, problem, options, choice }] or reviews with content/action scores.',
    );
  }
  return { cases, reviews };
}

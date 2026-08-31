import {
  AUTHORS,
  type Author,
  type CaseSort,
  type CaseSortField,
  type LaneScore,
  type NoteKind,
  type PassFail,
  type ScoreLane,
  type SteerBoardFile,
  type SteerCase,
  type SteerChipId,
  type SteerHighlight,
  type SteerNote,
  type SteerRevision,
  type SteerReview,
  type SteerSection,
  type ThreadReply,
} from '../types/steers.js';

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
  'oscar-clone': { id: 'oscar-clone', label: 'Oscar Clone' },
};

export function isAuthor(value: unknown): value is Author {
  return AUTHORS.some((author) => author === value);
}

/** Stored / imported reviews: keep a known Author, else sam. Comment/reply request bodies 400 unknown authors. */
export function parseAuthor(value: unknown): Author {
  return isAuthor(value) ? value : 'sam';
}

export const CHIP_DEFS: { id: SteerChipId; label: string }[] = [
  { id: 'jumped-to-options', label: 'jumped to options (no background)' },
  { id: 'taught-the-feature', label: 'taught the feature instead of the development story' },
  { id: 'too-thin-to-decide', label: 'too thin to decide' },
  { id: 'cathedral-ceremony', label: 'cathedral / extra ceremony' },
];

const CASE_FIELDS = [
  'id',
  'title',
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

/** Known parent Linear tickets for the five live projects. Oscar should still send parentId explicitly. */
export const KNOWN_PROJECT_PARENTS: Record<
  string,
  { parentId: string; parentUrl: string; shortTitle: string }
> = {
  Capture: {
    parentId: 'CH-807',
    parentUrl:
      'https://linear.app/the-missionary-company/issue/CH-807/generic-capture-review-core',
    shortTitle: 'Capture Review Core',
  },
  Sync: {
    parentId: 'CH-795',
    parentUrl:
      'https://linear.app/the-missionary-company/issue/CH-795/sync-p1-finish-project-source-acceptance-control-plane',
    shortTitle: 'Sync P1 control plane',
  },
  Tracer: {
    parentId: 'CH-757',
    parentUrl:
      'https://linear.app/the-missionary-company/issue/CH-757/answer-engine-tracer-bullet-approved-better-implementation-package',
    shortTitle: 'Answer Engine Tracer',
  },
  Fireflies: {
    parentId: 'CH-799',
    parentUrl:
      'https://linear.app/the-missionary-company/issue/CH-799/dormant-forecast-only-meetings-fireflies-implementation-increment',
    shortTitle: 'Fireflies meetings',
  },
  Calendar: {
    parentId: 'CH-827',
    parentUrl:
      'https://linear.app/the-missionary-company/issue/CH-827/foundation-cal-01-exact-providersource-kind-registry-handoff',
    shortTitle: 'Calendar registry',
  },
};

const KNOWN_PARENT_BY_ID: Record<string, { project: string; parentUrl: string; shortTitle: string }> =
  Object.fromEntries(
    Object.entries(KNOWN_PROJECT_PARENTS).map(([project, known]) => [
      known.parentId,
      { project, parentUrl: known.parentUrl, shortTitle: known.shortTitle },
    ]),
  );

/** Vorflux / UUID-looking ids must never become filter chip labels. */
export function looksLikeOpaqueId(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) return true;
  if (/^[0-9a-f]{16,}$/i.test(v)) return true;
  if (/^[0-9a-f]{8,14}$/i.test(v)) return true;
  return false;
}

export function caseProject(item: SteerCase): string {
  const project = item.project?.trim();
  if (project && !looksLikeOpaqueId(project)) return project;
  const session = item.session?.trim();
  if (session && session !== '—' && !looksLikeOpaqueId(session)) return session;
  const parentId = caseParentId(item);
  if (parentId && KNOWN_PARENT_BY_ID[parentId]?.project) return KNOWN_PARENT_BY_ID[parentId].project;
  return '';
}

export function caseParentTitle(item: SteerCase): string | undefined {
  const explicit = item.parentTitle?.trim();
  if (explicit) return explicit;
  const parentId = caseParentId(item);
  if (parentId && KNOWN_PARENT_BY_ID[parentId]?.shortTitle) return KNOWN_PARENT_BY_ID[parentId].shortTitle;
  const project = caseProject(item);
  if (project && KNOWN_PROJECT_PARENTS[project]?.shortTitle) return KNOWN_PROJECT_PARENTS[project].shortTitle;
  return undefined;
}

export function caseParentSystem(item: SteerCase): string {
  return item.parentSystem?.trim() || 'linear';
}

export function caseParentId(item: SteerCase): string | undefined {
  return item.parentId?.trim() || item.parentTicket?.trim() || undefined;
}

export function caseParentUrl(item: SteerCase): string | undefined {
  return item.parentUrl?.trim() || item.parentTicketUrl?.trim() || undefined;
}

/** Stable filter key: `linear:CH-757`. */
export function caseParentKey(item: SteerCase): string | null {
  const id = caseParentId(item);
  if (!id) return null;
  return `${caseParentSystem(item)}:${id}`;
}

/** Display session label; treats legacy "—" and opaque Vorflux ids as empty. */
export function caseSessionLabel(item: SteerCase): string | undefined {
  const session = item.session?.trim();
  if (session && session !== '—' && !looksLikeOpaqueId(session)) return session;
  return undefined;
}

export function withCaseScopeDefaults(item: SteerCase): SteerCase {
  const project = caseProject(item) || undefined;
  const known = project ? KNOWN_PROJECT_PARENTS[project] : undefined;
  const parentSystem = caseParentSystem(item);
  const parentId = caseParentId(item) || known?.parentId;
  const knownById = parentId ? KNOWN_PARENT_BY_ID[parentId] : undefined;
  const parentUrl = caseParentUrl(item) || known?.parentUrl || knownById?.parentUrl;
  const parentTitle =
    item.parentTitle?.trim() || known?.shortTitle || knownById?.shortTitle || undefined;
  const sessionId = item.sessionId?.trim();
  // session is optional (Vorflux not required). Prefer real label → project → parentId.
  const session = caseSessionLabel(item) || project || parentId || '—';
  const spec = item.spec?.trim();
  return {
    ...item,
    session,
    ...(project ? { project } : {}),
    parentSystem,
    ...(parentId ? { parentId, parentTicket: parentId } : {}),
    ...(parentUrl ? { parentUrl, parentTicketUrl: parentUrl } : {}),
    ...(parentTitle ? { parentTitle } : {}),
    ...(sessionId ? { sessionId } : {}),
    ...(spec ? { spec } : {}),
  };
}

export function isFiled(review?: SteerReview | null): boolean {
  return Boolean(review?.filedAt?.trim());
}

export function markFiled(review: SteerReview, at = new Date()): SteerReview {
  const iso = at.toISOString();
  return { ...review, filedAt: iso, updatedAt: iso };
}

export function markUnfiled(review: SteerReview, at = new Date()): SteerReview {
  const next: SteerReview = { ...review, updatedAt: at.toISOString() };
  delete next.filedAt;
  return next;
}

export function isArchived(item?: SteerCase | null): boolean {
  return item?.archived === true;
}

export function markArchived(item: SteerCase): SteerCase {
  return { ...item, archived: true };
}

export function markUnarchived(item: SteerCase): SteerCase {
  return { ...item, archived: false };
}

/** Inbox / Filed hide archived cases. Archived is its own shelf. */
export function caseListSection(
  item: SteerCase,
  review?: SteerReview | null,
): 'inbox' | 'filed' | 'archived' {
  if (isArchived(item)) return 'archived';
  return isFiled(review) ? 'filed' : 'inbox';
}

export function listProjects(cases: SteerCase[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of cases) {
    const project = caseProject(item);
    if (!project || seen.has(project)) continue;
    seen.add(project);
    out.push(project);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export interface ParentScopeOption {
  key: string;
  parentSystem: string;
  parentId: string;
  project: string;
  parentTitle: string;
  label: string;
}

export function listParentScopes(cases: SteerCase[]): ParentScopeOption[] {
  const byKey = new Map<string, ParentScopeOption>();
  for (const item of cases) {
    const scoped = withCaseScopeDefaults(item);
    const key = caseParentKey(scoped);
    const parentId = caseParentId(scoped);
    if (!key || !parentId) continue;
    // Never chip on opaque Vorflux/session ids mistaken for parentId.
    if (looksLikeOpaqueId(parentId)) continue;
    const project = caseProject(scoped);
    const parentTitle = caseParentTitle(scoped) || project || parentId;
    const label = `${parentId} · ${parentTitle}`;
    const existing = byKey.get(key);
    if (existing) {
      if (!existing.project && project) existing.project = project;
      if ((!existing.parentTitle || existing.parentTitle === existing.parentId) && parentTitle) {
        existing.parentTitle = parentTitle;
        existing.label = `${parentId} · ${parentTitle}`;
      }
      continue;
    }
    byKey.set(key, {
      key,
      parentSystem: caseParentSystem(scoped),
      parentId,
      project,
      parentTitle,
      label,
    });
  }
  return [...byKey.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function filterCasesByScope(
  cases: SteerCase[],
  filters: {
    project?: string | null;
    parentTicket?: string | null;
    parentId?: string | null;
    parentSystem?: string | null;
    parentKey?: string | null;
    spec?: string | null;
  },
): SteerCase[] {
  const project = filters.project?.trim().toLowerCase();
  const parentId = (filters.parentId ?? filters.parentTicket)?.trim().toLowerCase();
  const parentSystem = filters.parentSystem?.trim().toLowerCase();
  const parentKey = filters.parentKey?.trim().toLowerCase();
  const spec = filters.spec?.trim().toLowerCase();
  return cases.filter((item) => {
    const scoped = withCaseScopeDefaults(item);
    if (project && caseProject(scoped).toLowerCase() !== project) return false;
    if (parentKey && (caseParentKey(scoped) ?? '').toLowerCase() !== parentKey) return false;
    if (parentId && (caseParentId(scoped) ?? '').toLowerCase() !== parentId) return false;
    if (parentSystem && caseParentSystem(scoped).toLowerCase() !== parentSystem) return false;
    if (spec && (scoped.spec ?? '').toLowerCase() !== spec) return false;
    return true;
  });
}

export type CaseProgress = 'unscored' | 'open' | 'scored';

export function caseProgress(review?: SteerReview | null): CaseProgress {
  if (!review) return 'unscored';
  if (review.content.passFail && review.action.passFail) return 'scored';
  if (reviewIsEmpty(review)) return 'unscored';
  return 'open';
}

export interface SpanLaneNote {
  kind: NoteKind;
  text: string;
}

export function attachSpanNotes(input: {
  review: SteerReview;
  span: { section: SteerSection; start: number; end: number; text: string };
  author: Author;
  content?: SpanLaneNote;
  action?: SpanLaneNote;
}): SteerReview {
  const highlightId = newHighlightId();
  const notes = [...input.review.notes];
  const add = (lane: ScoreLane, note?: SpanLaneNote) => {
    const text = note?.text.trim() ?? '';
    if (!text || !note) return;
    notes.push({
      id: newId('n'),
      kind: note.kind,
      lane,
      author: input.author,
      text,
      createdAt: new Date().toISOString(),
      replies: [],
      highlightId,
      section: input.span.section,
      start: input.span.start,
      end: input.span.end,
      spanText: input.span.text,
    });
  };
  add('content', input.content);
  add('action', input.action);
  const contentText = input.content?.text.trim() ?? '';
  const actionText = input.action?.text.trim() ?? '';
  const highlight: SteerHighlight = {
    id: highlightId,
    section: input.span.section,
    start: input.span.start,
    end: input.span.end,
    text: input.span.text,
    lane: contentText ? 'content' : 'action',
    passFail: null,
    comment: [contentText, actionText].filter(Boolean).join('\n'),
  };
  return {
    ...input.review,
    highlights: [...input.review.highlights, highlight],
    notes,
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
    // Placeholder only; withCaseScopeDefaults fills from project / parentId.
    session: typeof obj.session === 'string' && obj.session.trim() ? String(obj.session).trim() : '',
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
  const timestamp = readString(obj, 'timestamp');
  const project = readString(obj, 'project');
  const sessionId = readString(obj, 'sessionId');
  const parentSystem = readString(obj, 'parentSystem');
  const parentId = readString(obj, 'parentId') ?? readString(obj, 'parentTicket');
  const parentUrl = readString(obj, 'parentUrl') ?? readString(obj, 'parentTicketUrl');
  const parentTitle = readString(obj, 'parentTitle');
  const spec = readString(obj, 'spec');
  const rawNumber = obj.number;
  if (yourCall) parsed.yourCall = yourCall;
  if (tooAggressive) parsed.tooAggressive = tooAggressive;
  if (yourCallBody) parsed.yourCallBody = yourCallBody;
  if (contextLabel) parsed.contextLabel = contextLabel;
  if (choiceLabel) parsed.choiceLabel = choiceLabel;
  if (notionUrl) parsed.notionUrl = notionUrl;
  if (timestamp) parsed.timestamp = timestamp;
  if (project) parsed.project = project;
  if (sessionId) parsed.sessionId = sessionId;
  if (parentSystem) parsed.parentSystem = parentSystem;
  if (parentId) {
    parsed.parentId = parentId;
    parsed.parentTicket = parentId;
  }
  if (parentUrl) {
    parsed.parentUrl = parentUrl;
    parsed.parentTicketUrl = parentUrl;
  }
  if (parentTitle) parsed.parentTitle = parentTitle;
  if (spec) parsed.spec = spec;
  if (typeof rawNumber === 'number' && Number.isFinite(rawNumber)) parsed.number = rawNumber;
  if (obj.archived === true) parsed.archived = true;
  if (obj.archived === false) parsed.archived = false;
  return withCaseScopeDefaults(parsed);
}

export const DEFAULT_CASE_SORT: CaseSort = { field: 'number', direction: 'asc' };

export function sortCases(cases: SteerCase[], sort: CaseSort): SteerCase[] {
  const dir = sort.direction === 'asc' ? 1 : -1;
  return [...cases].sort((a, b) => {
    const primary = compareSortField(a, b, sort.field);
    if (primary !== 0) return primary * dir;
    return ((a.number ?? Number.POSITIVE_INFINITY) - (b.number ?? Number.POSITIVE_INFINITY)) * dir;
  });
}

function compareSortField(a: SteerCase, b: SteerCase, field: CaseSortField): number {
  if (field === 'number') {
    return (a.number ?? Number.POSITIVE_INFINITY) - (b.number ?? Number.POSITIVE_INFINITY);
  }
  if (field === 'timestamp') {
    return (a.timestamp ?? '').localeCompare(b.timestamp ?? '');
  }
  if (field === 'project') {
    return caseProject(a).localeCompare(caseProject(b));
  }
  if (field === 'parent') {
    return (caseParentKey(a) ?? '').localeCompare(caseParentKey(b) ?? '');
  }
  return a[field].localeCompare(b[field]);
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
  const filedAt = readString(obj, 'filedAt');
  return {
    caseId: obj.caseId,
    content: parseLaneScore(obj.content),
    action: parseLaneScore(obj.action),
    highlights,
    chips,
    notes,
    revisions,
    ...(filedAt ? { filedAt } : {}),
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
  for (const item of base) byId.set(item.id, withCaseScopeDefaults(item));
  const extras: SteerCase[] = [];
  for (const item of incoming) {
    const scoped = withCaseScopeDefaults(item);
    const prev = byId.get(scoped.id);
    const next =
      prev && scoped.archived === undefined && prev.archived !== undefined
        ? { ...scoped, archived: prev.archived }
        : scoped;
    if (prev) {
      byId.set(scoped.id, next);
    } else {
      extras.push(next);
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

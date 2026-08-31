export type PassFail = 'pass' | 'fail' | null;
export type ScoreLane = 'content' | 'action';
export type SteerSection = 'context' | 'problem' | 'options' | 'choice';

export type SteerChipId =
  | 'jumped-to-options'
  | 'taught-the-feature'
  | 'too-thin-to-decide'
  | 'cathedral-ceremony';

export interface LaneScore {
  passFail: PassFail;
  comment: string;
  labels: string[];
}

export interface SteerHighlight {
  id: string;
  section: SteerSection;
  start: number;
  end: number;
  text: string;
  lane: ScoreLane;
  passFail: PassFail;
  comment: string;
}

export type CaseSortField = 'timestamp' | 'number' | 'stamp' | 'session' | 'project' | 'parent';
export type CaseSortDirection = 'asc' | 'desc';
export type InboxTab = 'inbox' | 'filed' | 'archived';
/** Tracker that owns the durable parent id. Default is linear. */
export type ParentSystem = 'linear' | (string & {});

export interface CaseSort {
  field: CaseSortField;
  direction: CaseSortDirection;
}

export interface SteerCase {
  id: string;
  title: string;
  /**
   * Optional agent/runner label (legacy). Prefer sessionId for Vorflux.
   * Always present after parse (defaults to project, parentId, or "—").
   */
  session: string;
  stamp: string;
  when: string;
  number?: number;
  timestamp?: string;
  /** Optional Vorflux (or other runner) session id. Not required. */
  sessionId?: string;
  /** Human project label (Capture, Sync, Tracer, …). Display helper; not the durable key. */
  project?: string;
  /**
   * Which system owns parentId. Default `linear`. Future-proof for other trackers.
   */
  parentSystem?: ParentSystem;
  /** Durable parent id in parentSystem. For Linear: CH-757. Primary filter key. */
  parentId?: string;
  parentUrl?: string;
  /** Short human title for the parent ticket (filter chips / headers). Prefer over session ids. */
  parentTitle?: string;
  /**
   * @deprecated Alias of parentId (Linear). Still accepted on POST/GET for older clients.
   */
  parentTicket?: string;
  /**
   * @deprecated Alias of parentUrl.
   */
  parentTicketUrl?: string;
  /** Spec id or short slug, e.g. AF-CAL-01. */
  spec?: string;
  yourCall?: string;
  tooAggressive?: string;
  yourCallBody?: string;
  contextLabel?: string;
  choiceLabel?: string;
  context: string;
  problem: string;
  options: string;
  choice: string;
  notionUrl?: string;
  /**
   * Case-level shelf flag. Source of truth for Inbox / Filed / Archived.
   * Oscar POSTs `archived: true` on the old case id when a Tracer hourly page
   * is superseded. Not File — does not set filedAt and does not notify Oscar.
   */
  archived?: boolean;
}

export const AUTHORS = ['sam', 'oscar', 'oscar-clone'] as const;
export type Author = (typeof AUTHORS)[number];
export type NoteKind = 'comment' | 'question';

export interface ThreadReply {
  id: string;
  author: Author;
  text: string;
  createdAt: string;
}

export interface SteerNote {
  id: string;
  kind: NoteKind;
  lane: ScoreLane;
  author: Author;
  text: string;
  createdAt: string;
  replies: ThreadReply[];
  highlightId?: string;
  section?: SteerSection;
  start?: number;
  end?: number;
  spanText?: string;
}

export interface SteerRevision {
  id: string;
  questionId: string;
  section: SteerSection;
  oldText: string;
  newText: string;
  start: number;
  end: number;
  createdAt: string;
}

export interface SteerReview {
  caseId: string;
  content: LaneScore;
  action: LaneScore;
  highlights: SteerHighlight[];
  chips: SteerChipId[];
  notes: SteerNote[];
  revisions: SteerRevision[];
  /** When set, Sam filed this case out of the inbox. */
  filedAt?: string;
  updatedAt: string;
}

export interface SteerBoardFile {
  kind: 'oscar-steer-board';
  exportedAt: string;
  cases: SteerCase[];
  reviews: SteerReview[];
}

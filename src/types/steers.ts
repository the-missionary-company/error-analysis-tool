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

export interface SteerCase {
  id: string;
  title: string;
  session: string;
  stamp: string;
  when: string;
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
}

export type Author = 'sam' | 'oscar';
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
  updatedAt: string;
}

export interface SteerBoardFile {
  kind: 'oscar-steer-board';
  exportedAt: string;
  cases: SteerCase[];
  reviews: SteerReview[];
}

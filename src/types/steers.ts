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
  context: string;
  problem: string;
  options: string;
  choice: string;
  notionUrl?: string;
}

export interface SteerReview {
  caseId: string;
  content: LaneScore;
  action: LaneScore;
  highlights: SteerHighlight[];
  chips: SteerChipId[];
  updatedAt: string;
}

export interface SteerBoardFile {
  kind: 'oscar-steer-board';
  exportedAt: string;
  cases: SteerCase[];
  reviews: SteerReview[];
}

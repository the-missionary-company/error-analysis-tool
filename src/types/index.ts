export type Product = 'central-hub' | 'a1';
export type Judgment = 'pass' | 'fail' | null;
export type CommitmentState = 'closed' | 'dropped' | 'quiet' | 'overdue';
export type FindingKind = 'eval-worthy' | 'product-ux' | 'unset';

export interface HubTrace {
  id: string;
  product: 'central-hub';
  question: string;
  answer: string;
  citations: { title: string; excerpt: string; source?: string }[];
  chunks: { id: string; text: string; score?: number }[];
}

export interface A1Trace {
  id: string;
  product: 'a1';
  projectName: string;
  meetings: { date: string; title: string; excerpt: string }[];
  commitments: {
    id: string;
    text: string;
    inferredState: CommitmentState;
    evidence?: string;
  }[];
}

export type Trace = HubTrace | A1Trace;

export interface Annotation {
  traceId: string;
  judgment: Judgment;
  note: string;
  updatedAt: string;
}

export interface Dataset {
  id: string;
  name: string;
  product: Product;
  description: string;
  traces: Trace[];
}

export interface CategoryAssignment {
  categoryId: string;
  traceIds: string[];
}

export interface TaxonomyCategory {
  id: string;
  name: string;
  description?: string;
  findingKind: FindingKind;
}

export interface TaxonomyState {
  categories: TaxonomyCategory[];
  assignments: CategoryAssignment[];
  updatedAt: string;
}

export interface AppSettings {
  apiKey: string;
  apiBaseUrl: string;
  model: string;
}

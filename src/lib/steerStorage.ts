import { SEED_STEERS } from '../data/steerSeed';
import type { Author, CaseSort, InboxTab, SteerCase, SteerReview } from '../types/steers';
import { DEFAULT_CASE_SORT, mergeCases, parseSteerReviews } from './steers';

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const KEYS = {
  cases: 'ea.steers.cases',
  reviews: 'ea.steers.reviews',
  author: 'ea.steers.author',
  active: 'ea.steers.active',
  sort: 'ea.steers.sort',
  inboxTab: 'ea.steers.inboxTab',
  projectFilter: 'ea.steers.projectFilter',
  parentFilter: 'ea.steers.parentFilter',
} as const;

function defaultStore(): KeyValueStore {
  return localStorage;
}

function readJSON<T>(store: KeyValueStore, key: string, fallback: T): T {
  try {
    const raw = store.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(store: KeyValueStore, key: string, value: T) {
  store.setItem(key, JSON.stringify(value));
}

export function loadSteerCases(store: KeyValueStore = defaultStore()): SteerCase[] {
  const custom = readJSON<SteerCase[]>(store, KEYS.cases, []);
  return mergeCases(SEED_STEERS, Array.isArray(custom) ? custom : []);
}

export function saveImportedCases(incoming: SteerCase[], store: KeyValueStore = defaultStore()) {
  const existing = readJSON<SteerCase[]>(store, KEYS.cases, []);
  const next = mergeCases(Array.isArray(existing) ? existing : [], incoming);
  writeJSON(store, KEYS.cases, next);
}

export function loadSteerReviews(
  store: KeyValueStore = defaultStore(),
): Record<string, SteerReview> {
  const all = readJSON<Record<string, unknown>>(store, KEYS.reviews, {});
  if (!all || typeof all !== 'object') return {};
  const next: Record<string, SteerReview> = {};
  for (const [id, raw] of Object.entries(all)) {
    try {
      const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
      const [review] = parseSteerReviews([{ ...record, caseId: record.caseId ?? id }]);
      next[id] = review;
    } catch {
      // skip a corrupt row rather than break the board
    }
  }
  return next;
}

export function saveSteerReview(review: SteerReview, store: KeyValueStore = defaultStore()) {
  const all = loadSteerReviews(store);
  const next: SteerReview = {
    ...review,
    updatedAt: new Date().toISOString(),
  };
  writeJSON(store, KEYS.reviews, { ...all, [review.caseId]: next });
}

export function saveAllSteerReviews(
  reviews: Record<string, SteerReview>,
  store: KeyValueStore = defaultStore(),
) {
  writeJSON(store, KEYS.reviews, reviews);
}

export function loadAuthor(store: KeyValueStore = defaultStore()): Author {
  return store.getItem(KEYS.author) === 'oscar' ? 'oscar' : 'sam';
}

export function saveAuthor(author: Author, store: KeyValueStore = defaultStore()) {
  store.setItem(KEYS.author, author);
}

export function loadActiveId(store: KeyValueStore = defaultStore()): string | null {
  return store.getItem(KEYS.active);
}

export function saveActiveId(id: string, store: KeyValueStore = defaultStore()) {
  store.setItem(KEYS.active, id);
}

const SORT_FIELDS = new Set(['timestamp', 'number', 'stamp', 'session', 'project', 'parent']);

export function loadCaseSort(store: KeyValueStore = defaultStore()): CaseSort {
  const raw = readJSON<Partial<CaseSort> | null>(store, KEYS.sort, null);
  if (!raw || !SORT_FIELDS.has(String(raw.field))) return DEFAULT_CASE_SORT;
  return {
    field: raw.field as CaseSort['field'],
    direction: raw.direction === 'desc' ? 'desc' : 'asc',
  };
}

export function saveCaseSort(sort: CaseSort, store: KeyValueStore = defaultStore()) {
  writeJSON(store, KEYS.sort, sort);
}

export function loadInboxTab(store: KeyValueStore = defaultStore()): InboxTab {
  const raw = store.getItem(KEYS.inboxTab);
  if (raw === 'filed' || raw === 'archived') return raw;
  return 'inbox';
}

export function saveInboxTab(tab: InboxTab, store: KeyValueStore = defaultStore()) {
  store.setItem(KEYS.inboxTab, tab);
}

export function loadProjectFilter(store: KeyValueStore = defaultStore()): string | null {
  const raw = store.getItem(KEYS.projectFilter);
  return raw && raw.trim() ? raw.trim() : null;
}

export function saveProjectFilter(project: string | null, store: KeyValueStore = defaultStore()) {
  if (!project) {
    store.setItem(KEYS.projectFilter, '');
    return;
  }
  store.setItem(KEYS.projectFilter, project);
}

/** Parent filter key, e.g. `linear:CH-757`. */
export function loadParentFilter(store: KeyValueStore = defaultStore()): string | null {
  const raw = store.getItem(KEYS.parentFilter);
  return raw && raw.trim() ? raw.trim() : null;
}

export function saveParentFilter(parentKey: string | null, store: KeyValueStore = defaultStore()) {
  store.setItem(KEYS.parentFilter, parentKey?.trim() ?? '');
}

export function importSteerReviews(
  incoming: SteerReview[],
  store: KeyValueStore = defaultStore(),
): Record<string, SteerReview> {
  const all = { ...loadSteerReviews(store) };
  for (const review of incoming) {
    const [normalized] = parseSteerReviews([review]);
    all[normalized.caseId] = normalized;
  }
  writeJSON(store, KEYS.reviews, all);
  return all;
}

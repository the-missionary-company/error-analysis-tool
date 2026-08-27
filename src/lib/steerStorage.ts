import { SEED_STEERS } from '../data/steerSeed';
import type { SteerCase, SteerReview } from '../types/steers';
import { mergeCases, parseSteerReviews } from './steers';

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const KEYS = {
  cases: 'ea.steers.cases',
  reviews: 'ea.steers.reviews',
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

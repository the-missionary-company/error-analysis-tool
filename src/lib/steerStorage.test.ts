import { afterEach, describe, expect, it } from 'vitest';
import { SEED_STEERS } from '../data/steerSeed';
import { emptyReview } from './steers';
import {
  importSteerReviews,
  loadSteerCases,
  loadSteerReviews,
  saveImportedCases,
  saveSteerReview,
} from './steerStorage';

function memoryStore(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem(key: string) {
      return key in data ? data[key] : null;
    },
    setItem(key: string, value: string) {
      data[key] = value;
    },
  };
}

afterEach(() => {
  // storage is injected per test
});

describe('steerStorage', () => {
  it('loads the seed case without writing empty scores', () => {
    const store = memoryStore();
    const cases = loadSteerCases(store);
    expect(cases.map((c) => c.id)).toEqual(['will-not-green-production-migration']);
    expect(loadSteerReviews(store)).toEqual({});
    expect(store.getItem('ea.steers.reviews')).toBeNull();
  });

  it('persists a Content pass and an Action fail independently', () => {
    const store = memoryStore();
    const review = {
      ...emptyReview(SEED_STEERS[0].id),
      content: { passFail: 'pass' as const, comment: 'Closed the gap.' },
      action: { passFail: 'fail' as const, comment: 'Need a living instruction.' },
    };
    saveSteerReview(review, store);
    const loaded = loadSteerReviews(store)[SEED_STEERS[0].id];
    expect(loaded.content.passFail).toBe('pass');
    expect(loaded.action.passFail).toBe('fail');
    expect(loaded.content.comment).toBe('Closed the gap.');
    expect(loaded.action.comment).toBe('Need a living instruction.');
    expect(loaded.updatedAt).toMatch(/^\d{4}-/);
  });

  it('keeps highlights attached to span text after reload', () => {
    const store = memoryStore();
    saveSteerReview(
      {
        ...emptyReview('c1'),
        highlights: [
          {
            id: 'h1',
            section: 'choice',
            start: 0,
            end: 7,
            text: '2. Does',
            lane: 'action',
            passFail: 'pass',
            comment: 'Did not type secrets.',
          },
        ],
      },
      store,
    );
    const loaded = loadSteerReviews(store).c1;
    expect(loaded.highlights[0].text).toBe('2. Does');
    expect(loaded.highlights[0].lane).toBe('action');
  });

  it('persists Content labels separately from Action labels', () => {
    const store = memoryStore();
    saveSteerReview(
      {
        ...emptyReview(SEED_STEERS[0].id),
        content: {
          passFail: 'fail',
          comment: 'Unclear.',
          labels: ['agents mixed the reds'],
        },
        action: {
          passFail: 'pass',
          comment: 'HOLD stands.',
          labels: ['one-way door'],
        },
      },
      store,
    );
    const loaded = loadSteerReviews(store)[SEED_STEERS[0].id];
    expect(loaded.content.labels).toEqual(['agents mixed the reds']);
    expect(loaded.action.labels).toEqual(['one-way door']);
    expect(loaded.content.labels).not.toEqual(loaded.action.labels);
  });

  it('normalizes older reviews that have no labels array', () => {
    const store = memoryStore({
      'ea.steers.reviews': JSON.stringify({
        c1: {
          caseId: 'c1',
          content: { passFail: 'pass', comment: 'ok' },
          action: { passFail: 'fail', comment: 'no' },
          highlights: [],
        },
      }),
    });
    const loaded = loadSteerReviews(store).c1;
    expect(loaded.content.labels).toEqual([]);
    expect(loaded.action.labels).toEqual([]);
    expect(loaded.content.passFail).toBe('pass');
    expect(loaded.action.passFail).toBe('fail');
  });

  it('imports reviews to restore labels and merges imported cases', () => {
    const store = memoryStore();
    importSteerReviews(
      [
        {
          ...emptyReview(SEED_STEERS[0].id),
          content: { passFail: 'fail', comment: 'Missing the one-way door.' },
          action: { passFail: 'pass', comment: 'HOLD is correct.' },
        },
      ],
      store,
    );
    saveImportedCases(
      [
        {
          id: 'second-case',
          title: 'Later steer',
          session: 'Capture',
          stamp: 'HOLD',
          when: '2026-08-28',
          context: 'c',
          problem: 'p',
          options: 'o',
          choice: 'ch',
        },
      ],
      store,
    );
    const cases = loadSteerCases(store);
    expect(cases).toHaveLength(2);
    expect(cases[1].id).toBe('second-case');
    const restored = loadSteerReviews(store)[SEED_STEERS[0].id];
    expect(restored.content.passFail).toBe('fail');
    expect(restored.action.passFail).toBe('pass');
  });
});

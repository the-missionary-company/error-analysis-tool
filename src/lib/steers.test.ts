import { describe, expect, it } from 'vitest';
import { SEED_STEERS } from '../data/steerSeed';
import {
  CHIP_DEFS,
  LANE_DEFS,
  applyHighlightSegments,
  emptyReview,
  exportSteerBoardJSON,
  findSpanOffsets,
  mergeCases,
  parseSteerCases,
  parseSteerPayload,
  parseSteerReviews,
  reviewIsEmpty,
} from './steers';

describe('seed case', () => {
  it('includes the production-migration HOLD steer with no invented scores', () => {
    expect(SEED_STEERS).toHaveLength(1);
    const seed = SEED_STEERS[0];
    expect(seed.id).toBe('will-not-green-production-migration');
    expect(seed.title).toBe('3. Will not green a production migration to make a check pretty');
    expect(seed.session).toBe('Capture');
    expect(seed.stamp).toBe('HOLD');
    expect(seed.yourCall).toBe('Softer');
    expect(seed.when).toBe('2026-08-27');
    expect(seed.notionUrl).toBe(
      'https://app.notion.com/p/3c9efde7642b81ea8bcee31574c844f3',
    );
    expect(seed.context).toContain('CH-807');
    expect(seed.context).toContain('58 missing catalog objects');
    expect(seed.problem).toContain('schema change in production');
    expect(seed.options).toContain('HOLD (what Oscar did)');
    expect(seed.choice).toContain('Does not type secrets');
    expect(seed.choice).toContain('CH-810 SQL');

    const review = emptyReview(seed.id);
    expect(review.caseId).toBe(seed.id);
    expect(review.content).toEqual({ passFail: null, comment: '' });
    expect(review.action).toEqual({ passFail: null, comment: '' });
    expect(review.highlights).toEqual([]);
    expect(review.chips).toEqual([]);
    expect(reviewIsEmpty(review)).toBe(true);
  });
});

describe('parseSteerCases', () => {
  const valid = {
    id: 'case-2',
    title: 'Another steer',
    session: 'Capture',
    stamp: 'HOLD',
    when: '2026-08-28',
    context: 'Context text',
    problem: 'Problem text',
    options: '1. A\n2. B',
    choice: '2',
    notionUrl: 'https://example.com/n',
  };

  it('accepts a bare array of cases', () => {
    const cases = parseSteerCases(JSON.stringify([valid]));
    expect(cases).toHaveLength(1);
    expect(cases[0].id).toBe('case-2');
    expect(cases[0].options).toContain('1. A');
  });

  it('accepts { cases: [...] } and optional yourCall', () => {
    const cases = parseSteerCases({ cases: [{ ...valid, yourCall: 'Softer' }] });
    expect(cases[0].yourCall).toBe('Softer');
  });

  it('rejects traces-shaped JSON so Hub/A1 imports stay separate', () => {
    expect(() =>
      parseSteerCases({ traces: [{ id: 'hub-001', product: 'central-hub' }] }),
    ).toThrow(/steer/i);
  });

  it('rejects objects missing required steer fields', () => {
    expect(() => parseSteerCases([{ id: 'x', title: 'Nope' }])).toThrow(/missing/i);
  });
});

describe('parseSteerReviews', () => {
  it('keeps Content and Action as independent scores', () => {
    const reviews = parseSteerReviews({
      reviews: [
        {
          caseId: 'will-not-green-production-migration',
          content: { passFail: 'pass', comment: 'Gap closed.' },
          action: { passFail: 'fail', comment: 'Should have written the living instruction.' },
          highlights: [
            {
              section: 'choice',
              start: 0,
              end: 8,
              text: '2. Does ',
              lane: 'action',
              passFail: 'fail',
              comment: 'HOLD is right; write the rule down.',
            },
          ],
        },
      ],
    });
    expect(reviews).toHaveLength(1);
    expect(reviews[0].content.passFail).toBe('pass');
    expect(reviews[0].action.passFail).toBe('fail');
    expect(reviews[0].content.comment).not.toBe(reviews[0].action.comment);
    expect(reviews[0].highlights[0].lane).toBe('action');
    expect(reviews[0].highlights[0].section).toBe('choice');
  });

  it('does not collapse missing scores into pass or fail', () => {
    const [review] = parseSteerReviews([
      { caseId: 'c1', content: {}, action: { comment: 'only a note' } },
    ]);
    expect(review.content.passFail).toBeNull();
    expect(review.action.passFail).toBeNull();
    expect(review.action.comment).toBe('only a note');
    expect(reviewIsEmpty(review)).toBe(false);
  });

  it('accepts a downloaded board file and a bare reviews array', () => {
    const fromBoard = parseSteerReviews({
      kind: 'oscar-steer-board',
      reviews: [{ caseId: 'c1' }],
    });
    const fromBare = parseSteerReviews([{ caseId: 'c2' }]);
    expect(fromBoard[0].caseId).toBe('c1');
    expect(fromBare[0].caseId).toBe('c2');
  });
});

describe('exportSteerBoardJSON', () => {
  it('writes an obvious schema Sam can hand to Oscar', () => {
    const review = {
      ...emptyReview('will-not-green-production-migration'),
      content: { passFail: 'pass' as const, comment: 'Closed the gap.' },
      action: { passFail: 'fail' as const, comment: 'Need a living instruction.' },
      highlights: [
        {
          id: 'h1',
          section: 'problem' as const,
          start: 0,
          end: 6,
          text: 'Agents',
          lane: 'content' as const,
          passFail: 'pass' as const,
          comment: 'Names the mix-up.',
        },
      ],
      chips: ['too-thin-to-decide' as const],
      updatedAt: '2026-08-27T12:00:00.000Z',
    };
    const parsed = JSON.parse(exportSteerBoardJSON(SEED_STEERS, [review]));
    expect(parsed.kind).toBe('oscar-steer-board');
    expect(parsed.cases[0].id).toBe('will-not-green-production-migration');
    expect(parsed.reviews[0].caseId).toBe(review.caseId);
    expect(parsed.reviews[0].content.passFail).toBe('pass');
    expect(parsed.reviews[0].action.passFail).toBe('fail');
    expect(parsed.reviews[0].highlights[0].text).toBe('Agents');
    expect(parsed.exportedAt).toMatch(/^\d{4}-/);
  });

  it('round-trips through parse', () => {
    const json = exportSteerBoardJSON(SEED_STEERS, [
      { ...emptyReview('will-not-green-production-migration') },
    ]);
    expect(parseSteerCases(json)).toHaveLength(1);
    expect(parseSteerReviews(json)).toHaveLength(1);
  });

  it('Load-cases path restores labels from a board export, not only cases', () => {
    const json = exportSteerBoardJSON(SEED_STEERS, [
      {
        ...emptyReview('will-not-green-production-migration'),
        content: { passFail: 'pass', comment: 'Closed the gap.' },
        action: { passFail: 'fail', comment: 'Need a living instruction.' },
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
        chips: ['cathedral-ceremony'],
      },
    ]);
    const loaded = parseSteerPayload(json);
    expect(loaded.cases).toHaveLength(1);
    expect(loaded.reviews).toHaveLength(1);
    expect(loaded.reviews[0].content.passFail).toBe('pass');
    expect(loaded.reviews[0].action.passFail).toBe('fail');
    expect(loaded.reviews[0].highlights[0].text).toBe('2. Does');
    expect(loaded.reviews[0].chips).toEqual(['cathedral-ceremony']);
  });
});

describe('mergeCases', () => {
  it('keeps seed cases and replaces imported ids', () => {
    const imported = {
      ...SEED_STEERS[0],
      title: 'Updated title from Oscar',
    };
    const extra = {
      id: 'new-case',
      title: 'New',
      session: 'Capture',
      stamp: 'GO',
      when: '2026-08-28',
      context: 'c',
      problem: 'p',
      options: 'o',
      choice: 'ch',
    };
    const merged = mergeCases(SEED_STEERS, [imported, extra]);
    expect(merged).toHaveLength(2);
    expect(merged[0].title).toBe('Updated title from Oscar');
    expect(merged[1].id).toBe('new-case');
  });
});

describe('highlight spans', () => {
  it('attaches a highlight to the selected span via offsets', () => {
    const text = 'Leave check red, PR unmerged, child parked.';
    const offsets = findSpanOffsets(text, 'PR unmerged');
    expect(offsets).toEqual({ start: 17, end: 28, text: 'PR unmerged' });
    const segments = applyHighlightSegments(text, [
      {
        id: 'h1',
        section: 'options',
        ...offsets!,
        lane: 'action',
        passFail: 'pass',
        comment: 'Two-way door.',
      },
    ]);
    expect(segments.map((s) => s.text).join('')).toBe(text);
    const marked = segments.filter((s) => s.highlight);
    expect(marked).toHaveLength(1);
    expect(marked[0].text).toBe('PR unmerged');
    expect(marked[0].highlight?.lane).toBe('action');
  });

  it('reattaches by span text when stored offsets are stale', () => {
    const text = 'Prefix. Leave check red. Suffix.';
    const offsets = findSpanOffsets(text, 'Leave check red', { start: 99, end: 104, text: 'Leave check red' });
    expect(offsets?.start).toBe(8);
    expect(text.slice(offsets!.start, offsets!.end)).toBe('Leave check red');
  });
});

describe('lane labels', () => {
  it('names the two scores the way Sam stated them, and keeps them independent', () => {
    expect(LANE_DEFS.content.title).toBe('Content / understanding');
    expect(LANE_DEFS.content.question).toContain('How Oscar sent the message');
    expect(LANE_DEFS.content.question).toContain('Did Sam understand the write-up');
    expect(LANE_DEFS.content.question).toContain('what the agents are doing');
    expect(LANE_DEFS.content.hint).toContain('missing information');

    expect(LANE_DEFS.action.title).toBe('Action / tech lead');
    expect(LANE_DEFS.action.question).toBe('How Oscar acted as the tech lead.');
    expect(LANE_DEFS.content.title).not.toBe(LANE_DEFS.action.title);
    expect(Object.keys(LANE_DEFS)).toEqual(['content', 'action']);
  });
});

describe('optional chips', () => {
  it('exposes named misses without making them the score', () => {
    const ids = CHIP_DEFS.map((c) => c.id);
    expect(ids).toEqual([
      'jumped-to-options',
      'taught-the-feature',
      'too-thin-to-decide',
      'cathedral-ceremony',
    ]);
    expect(CHIP_DEFS.every((c) => c.label.length > 0)).toBe(true);
  });
});

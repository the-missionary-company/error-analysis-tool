import { describe, expect, it } from 'vitest';
import { emptyReview } from './steers';
import { filterQueueCases } from './caseQueue';
import type { SteerCase, SteerReview } from '../types/steers';

function steer(partial: Partial<SteerCase> & Pick<SteerCase, 'id' | 'title'>): SteerCase {
  return {
    session: 'Capture',
    stamp: 'KEEP',
    when: '2026-08-29',
    context: '',
    problem: '',
    options: '',
    choice: '',
    ...partial,
  };
}

describe('filterQueueCases', () => {
  const cases = [
    steer({ id: 'a', title: 'Tracer stay the course', number: 51 }),
    steer({ id: 'b', title: 'Ken bugs then close', number: 24 }),
  ];

  it('keeps every case when the filter is all and the query is empty', () => {
    expect(filterQueueCases(cases, {}, 'all', '').map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('hides scored cases from the open filter', () => {
    const reviews: Record<string, SteerReview> = {
      a: {
        ...emptyReview('a'),
        content: { passFail: 'pass', comment: '', labels: [] },
        action: { passFail: 'fail', comment: '', labels: [] },
      },
    };
    expect(filterQueueCases(cases, reviews, 'open', '').map((item) => item.id)).toEqual(['b']);
    expect(filterQueueCases(cases, reviews, 'scored', '').map((item) => item.id)).toEqual(['a']);
  });

  it('matches title or case number', () => {
    expect(filterQueueCases(cases, {}, 'all', '51').map((item) => item.id)).toEqual(['a']);
    expect(filterQueueCases(cases, {}, 'all', 'ken').map((item) => item.id)).toEqual(['b']);
  });
});

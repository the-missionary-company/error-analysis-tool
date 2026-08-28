import { describe, expect, it } from 'vitest';
import { notesForHighlight, stackGutterItems } from './gutterLayout';
import { emptyReview } from './steers';
import type { SteerNote } from '../types/steers';

function note(partial: Partial<SteerNote> & Pick<SteerNote, 'id'>): SteerNote {
  return {
    kind: 'comment',
    lane: 'content',
    author: 'sam',
    text: 'note',
    createdAt: '2026-08-27T00:00:00.000Z',
    replies: [],
    ...partial,
  };
}

describe('stackGutterItems', () => {
  it('keeps preferred tops when they already have a gap', () => {
    const tops = stackGutterItems(
      [
        { id: 'a', preferredTop: 10 },
        { id: 'b', preferredTop: 80 },
      ],
      40,
    );
    expect(tops).toEqual({ a: 10, b: 80 });
  });

  it('pushes later cards down when they would overlap', () => {
    const tops = stackGutterItems(
      [
        { id: 'a', preferredTop: 10 },
        { id: 'b', preferredTop: 20 },
        { id: 'c', preferredTop: 200 },
      ],
      48,
    );
    expect(tops.a).toBe(10);
    expect(tops.b).toBe(58);
    expect(tops.c).toBe(200);
  });

  it('sorts by preferred top before stacking', () => {
    const tops = stackGutterItems(
      [
        { id: 'late', preferredTop: 12 },
        { id: 'early', preferredTop: 0 },
      ],
      30,
    );
    expect(tops.early).toBe(0);
    expect(tops.late).toBe(30);
  });
});

describe('notesForHighlight', () => {
  it('returns notes attached to that span', () => {
    const review = emptyReview('case');
    const notes = [
      note({ id: 'n1', highlightId: 'h1' }),
      note({ id: 'n2', highlightId: 'h2', lane: 'action' }),
      note({ id: 'n3', highlightId: 'h1', lane: 'action' }),
    ];
    expect(notesForHighlight(notes, 'h1').map((item) => item.id)).toEqual(['n1', 'n3']);
    expect(notesForHighlight(review.notes, 'missing')).toEqual([]);
  });
});

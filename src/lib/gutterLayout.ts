import { noteIsResolved } from './steers';
import type { SteerNote } from '../types/steers';

export function notesForHighlight(notes: SteerNote[], highlightId: string): SteerNote[] {
  return notes.filter((note) => note.highlightId === highlightId);
}

export function resolvedHighlightIds(
  highlights: { id: string }[],
  notes: SteerNote[],
): string[] {
  return highlights
    .filter((highlight) => {
      const attached = notesForHighlight(notes, highlight.id);
      return attached.length > 0 && attached.every(noteIsResolved);
    })
    .map((highlight) => highlight.id);
}

export function stackGutterItems(
  items: { id: string; preferredTop: number }[],
  minGap: number,
): Record<string, number> {
  const ordered = [...items].sort((a, b) => a.preferredTop - b.preferredTop);
  const tops: Record<string, number> = {};
  let previous = Number.NEGATIVE_INFINITY;
  for (const item of ordered) {
    const top = Number.isFinite(previous)
      ? Math.max(item.preferredTop, previous + minGap)
      : item.preferredTop;
    tops[item.id] = top;
    previous = top;
  }
  return tops;
}

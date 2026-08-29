import { useEffect, useState, type RefObject } from 'react';
import { notesForHighlight, stackGutterItems } from '../lib/gutterLayout';
import { LANE_TONE } from '../lib/laneStyles';
import { AUTHOR_DEFS, LANE_DEFS, addThreadReply } from '../lib/steers';
import { cn, formatDate } from '../lib/utils';
import type { Author, SteerNote, SteerReview } from '../types/steers';
import { VoiceDictationButton } from './VoiceDictationButton';

const CARD_GAP = 76;

export function GutterNotes({
  review,
  author,
  focusedNoteId,
  bodyRef,
  onFocus,
  onChangeNotes,
  onEnrich,
  onRemoveHighlight,
}: {
  review: SteerReview;
  author: Author;
  focusedNoteId: string | null;
  bodyRef: RefObject<HTMLElement | null>;
  onFocus: (noteId: string) => void;
  onChangeNotes: (notes: SteerNote[]) => void;
  onEnrich: (note: SteerNote, newText: string) => void;
  onRemoveHighlight: (id: string) => void;
}) {
  const [tops, setTops] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const collapseByDefault = review.notes.length >= 4;

  useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;

    const measure = () => {
      const items = review.highlights.map((highlight) => {
        const mark = root.querySelector<HTMLElement>(`[data-highlight-id="${highlight.id}"]`);
        const preferredTop = mark
          ? mark.getBoundingClientRect().top - root.getBoundingClientRect().top
          : 0;
        return { id: highlight.id, preferredTop };
      });
      setTops(stackGutterItems(items, CARD_GAP));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [bodyRef, review.highlights, review.notes.length]);

  if (review.notes.length === 0) {
    return (
      <aside className="hidden min-h-[8rem] xl:block">
        <p className="sticky top-[8.5rem] text-xs leading-relaxed text-ink-400">
          Highlight a span. The note lands here, next to the text.
        </p>
      </aside>
    );
  }

  return (
    <aside
      className="relative min-h-[8rem]"
      style={{
        minHeight: Math.max(
          128,
          Math.max(0, ...Object.values(tops)) + review.notes.length * CARD_GAP,
        ),
      }}
    >
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400 xl:sr-only">
        Comments ({review.notes.length})
      </div>
      <div className="space-y-3 xl:space-y-0">
        {review.highlights.map((highlight) => {
          const attached = notesForHighlight(review.notes, highlight.id);
          if (!attached.length) return null;
          const open =
            expanded[highlight.id] ??
            attached.some((note) => note.id === focusedNoteId) ??
            !collapseByDefault;
          return (
            <article
              key={highlight.id}
              style={{ top: tops[highlight.id] ?? 0 }}
              className={cn(
                'rounded-lg border px-2.5 py-2 xl:absolute xl:left-0 xl:right-0',
                LANE_TONE[highlight.lane].card,
              )}
            >
              <button type="button" className="w-full text-left" onClick={() => onFocus(attached[0].id)}>
                <span
                  className={cn(
                    'inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1',
                    LANE_TONE[highlight.lane].chip,
                  )}
                >
                  {highlight.lane === 'content' ? 'Content' : 'Action'}
                </span>
                <p className="mt-1 line-clamp-2 text-xs italic text-ink-600">“{highlight.text}”</p>
              </button>
              {attached.map((note) => (
                <GutterCard
                  key={note.id}
                  note={note}
                  author={author}
                  focused={focusedNoteId === note.id}
                  collapsed={!open}
                  onToggle={() =>
                    setExpanded((prev) => ({ ...prev, [highlight.id]: !open }))
                  }
                  onChange={(next) =>
                    onChangeNotes(review.notes.map((item) => (item.id === next.id ? next : item)))
                  }
                  onEnrich={onEnrich}
                />
              ))}
              <button
                type="button"
                className="mt-1 text-[11px] text-ink-400 hover:text-fail"
                onClick={() => onRemoveHighlight(highlight.id)}
              >
                Remove
              </button>
            </article>
          );
        })}
      </div>
    </aside>
  );
}

function GutterCard({
  note,
  author,
  focused,
  collapsed,
  onToggle,
  onChange,
  onEnrich,
}: {
  note: SteerNote;
  author: Author;
  focused: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onChange: (note: SteerNote) => void;
  onEnrich: (note: SteerNote, newText: string) => void;
}) {
  const [reply, setReply] = useState('');
  const [replacement, setReplacement] = useState('');
  const question = note.kind === 'question';

  return (
    <div id={`note-${note.id}`} className={cn('mt-1.5', focused && 'rounded-md ring-2 ring-accent/40')}>
      <button type="button" className="w-full text-left" onClick={onToggle}>
        <p className="text-[10px] font-medium text-ink-400">
          {question ? 'Question' : 'Comment'} · {AUTHOR_DEFS[note.author].label} ·{' '}
          {LANE_DEFS[note.lane].title}
        </p>
        <p className={cn('mt-0.5 text-sm text-ink-900', collapsed && 'line-clamp-2')}>{note.text}</p>
      </button>
      {!collapsed && question && (
        <>
          <ul className="mt-2 space-y-1.5 border-l-2 border-ink-200 pl-2">
            {note.replies.map((item) => (
              <li key={item.id}>
                <p className="text-[10px] font-medium text-ink-400">
                  {AUTHOR_DEFS[item.author].label}
                  {item.createdAt ? ` · ${formatDate(item.createdAt)}` : ''}
                </p>
                <p className="text-xs text-ink-800">{item.text}</p>
              </li>
            ))}
          </ul>
          <form
            className="mt-2 space-y-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!reply.trim()) return;
              onChange(addThreadReply(note, author, reply));
              setReply('');
            }}
          >
            <div className="flex items-start gap-1.5">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Reply…"
                className="min-h-[48px] min-w-0 flex-1 resize-y rounded-md border border-ink-200 bg-white px-2 py-1.5 text-xs"
              />
              <VoiceDictationButton value={reply} onChange={setReply} compact className="shrink-0" />
            </div>
            <button type="submit" className="btn-secondary h-7 px-2 text-[11px]">
              Reply
            </button>
          </form>
          {note.spanText && note.section && author === 'oscar' && (
            <form
              className="mt-2 space-y-1.5 border-t border-ink-200 pt-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!replacement.trim()) return;
                onEnrich(note, replacement);
                setReplacement('');
              }}
            >
              <div className="flex items-start gap-1.5">
                <textarea
                  value={replacement}
                  onChange={(e) => setReplacement(e.target.value)}
                  placeholder={`Replace “${note.spanText}”…`}
                  className="min-h-[48px] min-w-0 flex-1 resize-y rounded-md border border-ink-200 bg-white px-2 py-1.5 text-xs"
                />
                <VoiceDictationButton
                  value={replacement}
                  onChange={setReplacement}
                  compact
                  className="shrink-0"
                />
              </div>
              <button type="submit" className="btn-primary h-7 px-2 text-[11px]">
                Apply revision
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}

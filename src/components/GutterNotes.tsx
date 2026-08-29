import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { notesForHighlight } from '../lib/gutterLayout';
import { LANE_TONE } from '../lib/laneStyles';
import {
  AUTHOR_DEFS,
  LANE_DEFS,
  addThreadReply,
  editSteerNote,
  noteIsResolved,
  resolveSteerNote,
  unresolveSteerNote,
} from '../lib/steers';
import { cn, formatDate } from '../lib/utils';
import type { Author, SteerNote, SteerReview } from '../types/steers';

type NoteFilter = 'open' | 'resolved' | 'all';

export function GutterNotes({
  review,
  author,
  focusedNoteId,
  onFocus,
  onChangeNotes,
  onEnrich,
  onRemoveHighlight,
}: {
  review: SteerReview;
  author: Author;
  focusedNoteId: string | null;
  onFocus: (noteId: string) => void;
  onChangeNotes: (notes: SteerNote[]) => void;
  onEnrich: (note: SteerNote, newText: string) => void;
  onRemoveHighlight: (id: string) => void;
}) {
  const [filter, setFilter] = useState<NoteFilter>('open');
  const listRef = useRef<HTMLDivElement>(null);
  const openCount = review.notes.filter((note) => !noteIsResolved(note)).length;
  const resolvedCount = review.notes.filter(noteIsResolved).length;

  const groups = useMemo(() => {
    return review.highlights
      .map((highlight) => {
        const attached = notesForHighlight(review.notes, highlight.id);
        const visible = attached.filter((note) => {
          if (note.id === focusedNoteId) return true;
          if (filter === 'all') return true;
          return filter === 'resolved' ? noteIsResolved(note) : !noteIsResolved(note);
        });
        return { highlight, attached, visible };
      })
      .filter((group) => group.visible.length > 0);
  }, [filter, focusedNoteId, review.highlights, review.notes]);

  useEffect(() => {
    if (!focusedNoteId || !listRef.current) return;
    const node = listRef.current.querySelector<HTMLElement>(`#note-${focusedNoteId}`);
    const scroller = listRef.current.closest('aside');
    if (!node || !scroller || scroller.scrollHeight <= scroller.clientHeight) return;
    const scrollerBox = scroller.getBoundingClientRect();
    const nodeBox = node.getBoundingClientRect();
    if (nodeBox.top < scrollerBox.top || nodeBox.bottom > scrollerBox.bottom) {
      scroller.scrollTop += nodeBox.top - scrollerBox.top - 8;
    }
  }, [focusedNoteId]);

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
    <aside className="xl:sticky xl:top-[8.5rem] xl:max-h-[calc(100vh-9.5rem)] xl:overflow-y-auto">
      <div className="mb-2 flex items-end justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            Comments ({review.notes.length})
          </div>
          <p className="mt-0.5 hidden text-[11px] leading-snug text-ink-400 xl:block">
            One card per highlight. Scroll this column — cards do not stack on each other.
          </p>
        </div>
      </div>
      <div className="mb-3 flex flex-wrap gap-1" role="tablist" aria-label="Comment filter">
        <FilterChip active={filter === 'open'} onClick={() => setFilter('open')}>
          Open {openCount}
        </FilterChip>
        <FilterChip active={filter === 'resolved'} onClick={() => setFilter('resolved')}>
          Resolved {resolvedCount}
        </FilterChip>
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
          All
        </FilterChip>
      </div>
      {groups.length === 0 ? (
        <p className="rounded-lg border border-dashed border-ink-200 bg-ink-50/80 px-3 py-2 text-xs text-ink-500">
          {filter === 'resolved' ? 'No resolved comments yet.' : 'No open comments.'}
        </p>
      ) : (
        <div ref={listRef} className="space-y-3">
          {groups.map(({ highlight, attached, visible }) => (
            <article
              key={highlight.id}
              className={cn(
                'rounded-lg border bg-white px-3 py-2.5 shadow-sm',
                attached.every(noteIsResolved) ? 'border-ink-200 opacity-70' : LANE_TONE[highlight.lane].card,
              )}
            >
              <button type="button" className="w-full text-left" onClick={() => onFocus(visible[0].id)}>
                <span
                  className={cn(
                    'inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1',
                    LANE_TONE[highlight.lane].chip,
                  )}
                >
                  {highlight.lane === 'content' ? 'Content' : 'Action'}
                </span>
                <p className="mt-1 line-clamp-3 text-xs italic text-ink-600">“{highlight.text}”</p>
              </button>
              {visible.map((note) => (
                <GutterCard
                  key={note.id}
                  note={note}
                  author={author}
                  focused={focusedNoteId === note.id}
                  onFocus={() => onFocus(note.id)}
                  onChange={(next) =>
                    onChangeNotes(review.notes.map((item) => (item.id === next.id ? next : item)))
                  }
                  onEnrich={onEnrich}
                />
              ))}
              <button
                type="button"
                className="mt-2 text-[11px] text-ink-400 hover:text-fail"
                onClick={() => onRemoveHighlight(highlight.id)}
              >
                Remove
              </button>
            </article>
          ))}
        </div>
      )}
    </aside>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'rounded-full px-2 py-0.5 text-[11px] font-medium ring-1',
        active ? 'bg-ink-900 text-white ring-ink-900' : 'bg-white text-ink-600 ring-ink-200 hover:bg-ink-50',
      )}
    >
      {children}
    </button>
  );
}

function GutterCard({
  note,
  author,
  focused,
  onFocus,
  onChange,
  onEnrich,
}: {
  note: SteerNote;
  author: Author;
  focused: boolean;
  onFocus: () => void;
  onChange: (note: SteerNote) => void;
  onEnrich: (note: SteerNote, newText: string) => void;
}) {
  const [reply, setReply] = useState('');
  const [replacement, setReplacement] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.text);
  const question = note.kind === 'question';
  const resolved = noteIsResolved(note);

  return (
    <div
      id={`note-${note.id}`}
      className={cn('mt-2 border-t border-ink-100 pt-2', focused && 'rounded-md ring-2 ring-accent/40')}
    >
      <button type="button" className="w-full text-left" onClick={onFocus}>
        <p className="text-[10px] font-medium text-ink-400">
          {question ? 'Question' : 'Comment'} · {AUTHOR_DEFS[note.author].label} · {LANE_DEFS[note.lane].title}
          {note.createdAt ? ` · ${formatDate(note.createdAt)}` : ''}
          {note.editedAt ? ' · edited' : ''}
          {resolved ? ' · resolved' : ''}
        </p>
        {!editing && <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink-900">{note.text}</p>}
      </button>
      {editing && (
        <form
          className="mt-1.5 space-y-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.trim()) return;
            onChange(editSteerNote(note, draft));
            setEditing(false);
          }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[72px] w-full resize-y rounded-md border border-ink-200 bg-white px-2 py-1.5 text-xs"
          />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary h-7 px-2 text-[11px]">
              Save
            </button>
            <button
              type="button"
              className="btn-secondary h-7 px-2 text-[11px]"
              onClick={() => {
                setDraft(note.text);
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
        {!editing && (
          <button
            type="button"
            className="text-[11px] font-medium text-accent hover:underline"
            onClick={() => {
              setDraft(note.text);
              setEditing(true);
            }}
          >
            Edit
          </button>
        )}
        <button
          type="button"
          className="text-[11px] font-medium text-ink-600 hover:underline"
          onClick={() => onChange(resolved ? unresolveSteerNote(note) : resolveSteerNote(note, author))}
        >
          {resolved ? 'Unresolve' : 'Resolve'}
        </button>
      </div>
      {question && (
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
          {!resolved && (
            <form
              className="mt-2 space-y-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                if (!reply.trim()) return;
                onChange(addThreadReply(note, author, reply));
                setReply('');
              }}
            >
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Reply…"
                className="min-h-[48px] w-full resize-y rounded-md border border-ink-200 bg-white px-2 py-1.5 text-xs"
              />
              <button type="submit" className="btn-secondary h-7 px-2 text-[11px]">
                Reply
              </button>
            </form>
          )}
          {note.spanText && note.section && author === 'oscar' && !resolved && (
            <form
              className="mt-2 space-y-1.5 border-t border-ink-200 pt-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!replacement.trim()) return;
                onEnrich(note, replacement);
                setReplacement('');
              }}
            >
              <textarea
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                placeholder={`Replace “${note.spanText}”…`}
                className="min-h-[48px] w-full resize-y rounded-md border border-ink-200 bg-white px-2 py-1.5 text-xs"
              />
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

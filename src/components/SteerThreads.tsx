import { useState } from 'react';
import { AUTHOR_DEFS, LANE_DEFS, addThreadReply } from '../lib/steers';
import { cn, formatDate } from '../lib/utils';
import type { Author, SteerNote, SteerReview } from '../types/steers';

export function SteerThreads({
  review,
  author,
  focusedNoteId,
  onChangeNotes,
  onEnrich,
}: {
  review: SteerReview;
  author: Author;
  focusedNoteId: string | null;
  onChangeNotes: (notes: SteerNote[]) => void;
  onEnrich: (note: SteerNote, newText: string) => void;
}) {
  if (review.notes.length === 0) return null;

  return (
    <section className="card p-4">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">
        Threads ({review.notes.length})
      </div>
      <p className="mb-3 text-[11px] leading-relaxed text-ink-500">
        A comment is a note. A question is a thread Oscar can answer. Posting as {AUTHOR_DEFS[author].label}.
      </p>
      <ul className="space-y-3">
        {review.notes.map((note) => (
          <li key={note.id}>
            <ThreadCard
              note={note}
              author={author}
              focused={focusedNoteId === note.id}
              onChange={(next) =>
                onChangeNotes(review.notes.map((item) => (item.id === next.id ? next : item)))
              }
              onEnrich={onEnrich}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ThreadCard({
  note,
  author,
  focused,
  onChange,
  onEnrich,
}: {
  note: SteerNote;
  author: Author;
  focused: boolean;
  onChange: (note: SteerNote) => void;
  onEnrich: (note: SteerNote, newText: string) => void;
}) {
  const [reply, setReply] = useState('');
  const [replacement, setReplacement] = useState('');
  const question = note.kind === 'question';
  const hasSpan = Boolean(note.spanText && note.section);

  return (
    <article
      id={`note-${note.id}`}
      className={cn(
        'rounded-lg border px-3 py-2.5',
        focused ? 'border-accent bg-accent-soft' : 'border-ink-200 bg-ink-50/70',
      )}
    >
      <p className="text-[11px] font-medium text-ink-400">
        {question ? 'Question' : 'Comment'} · {AUTHOR_DEFS[note.author].label} · {LANE_DEFS[note.lane].title}
        {note.createdAt ? ` · ${formatDate(note.createdAt)}` : ''}
      </p>
      {note.spanText && (
        <p className="mt-1 text-xs italic text-ink-600">“{note.spanText}”</p>
      )}
      <p className="mt-1 text-sm text-ink-900">{note.text}</p>
      {question && (
        <ul className="mt-2 space-y-2 border-l-2 border-ink-200 pl-3">
          {note.replies.map((item) => (
            <li key={item.id}>
              <p className="text-[11px] font-medium text-ink-400">
                {AUTHOR_DEFS[item.author].label}
                {item.createdAt ? ` · ${formatDate(item.createdAt)}` : ''}
              </p>
              <p className="text-sm text-ink-800">{item.text}</p>
            </li>
          ))}
        </ul>
      )}
      {question && (
        <form
          className="mt-2 space-y-2"
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
            placeholder={`${AUTHOR_DEFS[author].label} replies in this thread…`}
            className="min-h-[64px] w-full resize-y rounded-lg border border-ink-200 bg-surface px-2.5 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <button type="submit" className="btn-secondary h-8 px-3 text-xs">
            Reply
          </button>
        </form>
      )}
      {question && hasSpan && author === 'oscar' && (
        <form
          className="mt-3 space-y-2 border-t border-ink-200 pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!replacement.trim()) return;
            onEnrich(note, replacement);
            setReplacement('');
          }}
        >
          <p className="text-[11px] font-medium text-ink-500">
            Enrich the steer — strike the old span and show the replacement
          </p>
          <textarea
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            placeholder={`Replace “${note.spanText}”…`}
            className="min-h-[64px] w-full resize-y rounded-lg border border-ink-200 bg-surface px-2.5 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <button type="submit" className="btn-primary h-8 px-3 text-xs">
            Apply visible revision
          </button>
        </form>
      )}
    </article>
  );
}

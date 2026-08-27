import { useState } from 'react';
import { LANE_DEFS } from '../lib/steers';
import { cn } from '../lib/utils';
import type { NoteKind, PassFail, ScoreLane } from '../types/steers';
import type { PendingSpan } from './HighlightableText';

export function SteerHighlightPopover({
  span,
  authorLabel,
  onCancel,
  onSave,
}: {
  span: PendingSpan;
  authorLabel: string;
  onCancel: () => void;
  onSave: (input: {
    lane: ScoreLane;
    passFail: PassFail;
    kind: NoteKind;
    text: string;
  }) => void;
}) {
  const [lane, setLane] = useState<ScoreLane>('content');
  const [passFail, setPassFail] = useState<PassFail>(null);
  const [kind, setKind] = useState<NoteKind>('comment');
  const [text, setText] = useState('');

  return (
    <div
      className="fixed z-50 w-[min(100vw-1.5rem,360px)] rounded-xl border border-ink-200 bg-white p-3 shadow-soft"
      style={{
        left: Math.max(12, Math.min(span.x, window.innerWidth - 372)),
        top: Math.max(12, Math.min(span.y + 12, window.innerHeight - 420)),
      }}
      role="dialog"
      aria-label="Annotate highlighted span"
    >
      <p className="line-clamp-3 rounded-md bg-ink-50 px-2 py-1.5 text-xs italic text-ink-700">
        “{span.text}”
      </p>
      <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-ink-400">
        Posting as {authorLabel}
      </p>
      <div className="mt-1 grid grid-cols-2 gap-2">
        <button
          type="button"
          className={cn('btn-secondary h-9 text-xs', kind === 'comment' && 'ring-2 ring-accent')}
          onClick={() => setKind('comment')}
        >
          Comment
        </button>
        <button
          type="button"
          className={cn('btn-secondary h-9 text-xs', kind === 'question' && 'ring-2 ring-accent')}
          onClick={() => setKind('question')}
        >
          Question
        </button>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-ink-500">
        {kind === 'comment'
          ? 'A note. Does not require a reply.'
          : 'A thread. Oscar can reply here, like a Google Doc comment.'}
      </p>
      <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-ink-400">
        Belongs to one score
      </p>
      <div className="mt-1 grid grid-cols-1 gap-2">
        <button
          type="button"
          className={cn('btn-secondary h-auto min-h-9 py-2 text-left text-xs', lane === 'content' && 'ring-2 ring-accent')}
          onClick={() => setLane('content')}
        >
          {LANE_DEFS.content.title}
        </button>
        <button
          type="button"
          className={cn('btn-secondary h-auto min-h-9 py-2 text-left text-xs', lane === 'action' && 'ring-2 ring-accent')}
          onClick={() => setLane('action')}
        >
          {LANE_DEFS.action.title}
        </button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          className={cn('btn-pass h-9', passFail === 'pass' && 'ring-2 ring-pass')}
          onClick={() => setPassFail(passFail === 'pass' ? null : 'pass')}
        >
          Pass
        </button>
        <button
          type="button"
          className={cn('btn-fail h-9', passFail === 'fail' && 'ring-2 ring-fail')}
          onClick={() => setPassFail(passFail === 'fail' ? null : 'fail')}
        >
          Fail
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          kind === 'question'
            ? 'Ask the question attached to this span…'
            : `${LANE_DEFS[lane].title} note for this span…`
        }
        className="mt-2 min-h-[72px] w-full resize-y rounded-lg border border-ink-200 px-2.5 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
      <div className="mt-2 flex justify-end gap-2">
        <button type="button" className="btn-ghost h-9 px-3" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary h-9 px-3"
          onClick={() => onSave({ lane, passFail, kind, text: text.trim() })}
        >
          Keep highlight
        </button>
      </div>
    </div>
  );
}

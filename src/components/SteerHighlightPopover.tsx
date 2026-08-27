import { useState } from 'react';
import { cn } from '../lib/utils';
import type { PassFail, ScoreLane } from '../types/steers';
import type { PendingSpan } from './HighlightableText';

export function SteerHighlightPopover({
  span,
  onCancel,
  onSave,
}: {
  span: PendingSpan;
  onCancel: () => void;
  onSave: (input: { lane: ScoreLane; passFail: PassFail; comment: string }) => void;
}) {
  const [lane, setLane] = useState<ScoreLane>('content');
  const [passFail, setPassFail] = useState<PassFail>(null);
  const [comment, setComment] = useState('');

  return (
    <div
      className="fixed z-50 w-[min(100vw-1.5rem,340px)] rounded-xl border border-ink-200 bg-white p-3 shadow-soft"
      style={{
        left: Math.max(12, Math.min(span.x, window.innerWidth - 352)),
        top: Math.max(12, Math.min(span.y + 12, window.innerHeight - 280)),
      }}
      role="dialog"
      aria-label="Score highlighted span"
    >
      <p className="line-clamp-3 rounded-md bg-ink-50 px-2 py-1.5 text-xs italic text-ink-700">
        “{span.text}”
      </p>
      <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-ink-400">
        Comment belongs to
      </p>
      <div className="mt-1 grid grid-cols-2 gap-2">
        <button
          type="button"
          className={cn('btn-secondary h-9', lane === 'content' && 'ring-2 ring-accent')}
          onClick={() => setLane('content')}
        >
          Content
        </button>
        <button
          type="button"
          className={cn('btn-secondary h-9', lane === 'action' && 'ring-2 ring-accent')}
          onClick={() => setLane('action')}
        >
          Action
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
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={
          lane === 'content'
            ? 'Content note for this span…'
            : 'Action note for this span…'
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
          onClick={() => onSave({ lane, passFail, comment: comment.trim() })}
        >
          Keep highlight
        </button>
      </div>
    </div>
  );
}

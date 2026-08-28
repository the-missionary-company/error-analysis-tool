import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { LANE_DEFS } from '../lib/steers';
import { LANE_TONE } from '../lib/laneStyles';
import { cn } from '../lib/utils';
import type { NoteKind, ScoreLane } from '../types/steers';
import type { PendingSpan } from './HighlightableText';

const LANES: ScoreLane[] = ['content', 'action'];

export function SpanNoteComposer({
  span,
  onCancel,
  onSave,
}: {
  span: PendingSpan;
  onCancel: () => void;
  onSave: (notes: {
    content?: { kind: NoteKind; text: string };
    action?: { kind: NoteKind; text: string };
  }) => void;
}) {
  const [lane, setLane] = useState<ScoreLane | null>(null);
  const [kind, setKind] = useState<NoteKind>('comment');
  const [text, setText] = useState('');
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (lane) inputRef.current?.focus();
  }, [lane]);

  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) onCancel();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [onCancel]);

  const keep = () => {
    const trimmed = text.trim();
    if (!lane || !trimmed) return;
    onSave({
      [lane]: { kind, text: trimmed },
    });
  };

  const left = Math.min(Math.max(12, span.x + 8), window.innerWidth - 340);
  const top = Math.min(Math.max(12, span.y + 8), window.innerHeight - 280);

  return (
    <>
      <button
        type="button"
        aria-label="Dismiss comment"
        className="fixed inset-0 z-40 bg-ink-950/25 sm:hidden"
        onClick={onCancel}
      />
      <div
        ref={boxRef}
        id="span-composer"
        style={
          {
            '--composer-left': `${left}px`,
            '--composer-top': `${top}px`,
          } as CSSProperties
        }
        className={cn(
          'fixed z-50 border border-ink-200 bg-white shadow-soft',
          'inset-x-0 bottom-0 max-h-[min(85vh,32rem)] w-full overflow-y-auto rounded-t-2xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))]',
          'sm:inset-x-auto sm:bottom-auto sm:left-[var(--composer-left)] sm:top-[var(--composer-top)] sm:max-h-none sm:w-[320px] sm:rounded-xl sm:p-3 sm:pb-3',
        )}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink-200 sm:hidden" aria-hidden />
        <p className="line-clamp-4 text-sm italic text-ink-600 sm:line-clamp-3 sm:text-xs">
          “{span.quote || span.text}”
        </p>
        <p className="mt-2 text-xs text-ink-500 sm:text-[11px]">Which score is this note for?</p>
        <div className="mt-1.5 grid grid-cols-2 gap-2 sm:gap-1.5">
          {LANES.map((value) => (
            <button
              key={value}
              type="button"
              className={cn(
                'rounded-lg border px-2 py-3 text-left text-sm font-medium sm:py-2 sm:text-xs',
                lane === value ? LANE_TONE[value].buttonActive : LANE_TONE[value].button,
              )}
              onClick={() => setLane(value)}
            >
              {value === 'content' ? 'Content' : 'Action / tech lead'}
            </button>
          ))}
        </div>
        {lane && (
          <>
            <div className="mt-3 flex gap-2 sm:mt-2 sm:gap-1.5">
              {(['comment', 'question'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={cn(
                    'rounded-md px-3 py-2 text-xs ring-1 ring-ink-200 sm:px-2 sm:py-1 sm:text-[11px]',
                    kind === value ? 'bg-ink-900 text-white ring-ink-900' : 'bg-white text-ink-600',
                  )}
                  onClick={() => setKind(value)}
                >
                  {value === 'comment' ? 'Comment' : 'Question'}
                </button>
              ))}
            </div>
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  keep();
                }
              }}
              placeholder={
                kind === 'question'
                  ? `Question on ${LANE_DEFS[lane].title}… Enter to save`
                  : `Note on ${LANE_DEFS[lane].title}… Enter to save`
              }
              className="mt-2 min-h-[96px] w-full resize-y rounded-lg border border-ink-200 bg-ink-50/50 px-3 py-2.5 text-base focus:border-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-[72px] sm:px-2.5 sm:py-2 sm:text-sm"
            />
            <div className="mt-3 flex items-center justify-between gap-2 sm:mt-2">
              <p className="text-xs text-ink-400 sm:text-[11px]">Enter saves · Shift+Enter new line</p>
              <div className="flex gap-2">
                <button type="button" className="btn-ghost h-10 px-3 text-sm sm:h-8 sm:text-xs" onClick={onCancel}>
                  Cancel
                </button>
                <button type="button" className="btn-primary h-10 px-4 text-sm sm:h-8 sm:px-3 sm:text-xs" onClick={keep}>
                  Save
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

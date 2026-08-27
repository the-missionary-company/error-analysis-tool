import { useEffect, useRef, useState } from 'react';
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
    window.addEventListener('mousedown', onPointer);
    return () => window.removeEventListener('mousedown', onPointer);
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
    <div
      ref={boxRef}
      id="span-composer"
      style={{ left, top }}
      className="fixed z-50 w-[320px] rounded-xl border border-ink-200 bg-white p-3 shadow-soft"
    >
      <p className="line-clamp-3 text-xs italic text-ink-600">“{span.text}”</p>
      <p className="mt-2 text-[11px] text-ink-500">Which score is this note for?</p>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        {LANES.map((value) => (
          <button
            key={value}
            type="button"
            className={cn(
              'rounded-lg border px-2 py-2 text-left text-xs font-medium',
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
          <div className="mt-2 flex gap-1.5">
            {(['comment', 'question'] as const).map((value) => (
              <button
                key={value}
                type="button"
                className={cn(
                  'rounded-md px-2 py-1 text-[11px] ring-1 ring-ink-200',
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
            className="mt-2 min-h-[72px] w-full resize-y rounded-lg border border-ink-200 bg-ink-50/50 px-2.5 py-2 text-sm focus:border-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-[11px] text-ink-400">Enter saves · Shift+Enter new line</p>
            <button type="button" className="btn-primary h-8 px-3 text-xs" onClick={keep}>
              Save
            </button>
          </div>
        </>
      )}
    </div>
  );
}

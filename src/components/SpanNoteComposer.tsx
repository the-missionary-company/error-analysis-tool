import { useState } from 'react';
import { LANE_DEFS } from '../lib/steers';
import { cn } from '../lib/utils';
import type { NoteKind, ScoreLane } from '../types/steers';
import type { PendingSpan } from './HighlightableText';

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
  const [contentKind, setContentKind] = useState<NoteKind>('comment');
  const [actionKind, setActionKind] = useState<NoteKind>('comment');
  const [contentText, setContentText] = useState('');
  const [actionText, setActionText] = useState('');

  const keep = () => {
    const content = contentText.trim();
    const action = actionText.trim();
    onSave({
      content: content ? { kind: contentKind, text: content } : undefined,
      action: action ? { kind: actionKind, text: action } : undefined,
    });
  };

  return (
    <section id="span-composer" className="card border-accent/40 p-4 ring-1 ring-accent/20">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-400">This span</div>
      <p className="mt-1 line-clamp-4 text-sm italic text-ink-800">“{span.text}”</p>
      <p className="mt-2 text-[11px] leading-relaxed text-ink-500">
        Pass and Fail stay on the two scores below. Here you can leave a note on Content, Action,
        or both.
      </p>
      <LaneNote
        lane="content"
        kind={contentKind}
        text={contentText}
        onKind={setContentKind}
        onText={setContentText}
      />
      <LaneNote
        lane="action"
        kind={actionKind}
        text={actionText}
        onKind={setActionKind}
        onText={setActionText}
      />
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" className="btn-ghost h-9 px-3" onClick={onCancel}>
          Dismiss
        </button>
        <button type="button" className="btn-primary h-9 px-3" onClick={keep}>
          Keep highlight
        </button>
      </div>
    </section>
  );
}

function LaneNote({
  lane,
  kind,
  text,
  onKind,
  onText,
}: {
  lane: ScoreLane;
  kind: NoteKind;
  text: string;
  onKind: (kind: NoteKind) => void;
  onText: (text: string) => void;
}) {
  return (
    <div className="mt-3 rounded-lg border border-ink-200 bg-ink-50/60 p-2.5">
      <div className="text-xs font-medium text-ink-800">{LANE_DEFS[lane].title}</div>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        {(['comment', 'question'] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={cn(
              'btn-secondary h-8 text-[11px]',
              kind === value && 'ring-2 ring-accent',
            )}
            onClick={() => onKind(value)}
          >
            {value === 'comment' ? 'Comment' : 'Question'}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => onText(e.target.value)}
        placeholder={
          kind === 'question'
            ? `Question on ${LANE_DEFS[lane].title}…`
            : `Note on ${LANE_DEFS[lane].title}…`
        }
        className="mt-2 min-h-[72px] w-full resize-y rounded-lg border border-ink-200 bg-white px-2.5 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
    </div>
  );
}

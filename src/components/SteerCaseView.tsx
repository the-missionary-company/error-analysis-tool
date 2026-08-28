import { ExternalLink } from 'lucide-react';
import type { SteerCase, SteerHighlight, SteerRevision, SteerSection } from '../types/steers';
import { HighlightableText, type PendingSpan } from './HighlightableText';

const SECTIONS: { key: SteerSection; label: string }[] = [
  { key: 'context', label: 'Context' },
  { key: 'problem', label: 'Problem' },
  { key: 'options', label: 'Options' },
  { key: 'choice', label: 'Choice and why' },
];

export function SteerCaseView({
  steer,
  highlights,
  revisions,
  onSelect,
  onHighlightClick,
  onRevisionClick,
}: {
  steer: SteerCase;
  highlights: SteerHighlight[];
  revisions: SteerRevision[];
  onSelect: (span: PendingSpan) => void;
  onHighlightClick: (highlight: SteerHighlight) => void;
  onRevisionClick: (revision: SteerRevision) => void;
}) {
  return (
    <article className="space-y-4">
      <header className="card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Steer</p>
        <h2 className="mt-1 text-xl font-semibold leading-snug text-ink-950">{steer.title}</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {steer.number != null && <MetaChip label="Number" value={String(steer.number)} />}
          <MetaChip label="Session" value={steer.session} />
          <MetaChip label="Stamp" value={steer.stamp} tone={steer.stamp === 'HOLD' ? 'hold' : undefined} />
          {steer.tooAggressive && <MetaChip label="Too aggressive?" value={steer.tooAggressive} />}
          {steer.yourCall && <MetaChip label="Your call" value={steer.yourCall} />}
          <MetaChip label="When" value={steer.when} />
          {steer.timestamp && <MetaChip label="Timestamp" value={steer.timestamp} />}
        </div>
        {steer.notionUrl && (
          <a
            href={steer.notionUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
          >
            Open Notion source
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </header>

      <p className="rounded-lg border border-dashed border-ink-200 bg-ink-50/80 px-3 py-2 text-[12px] leading-snug text-ink-500 sm:hidden">
        Tap a paragraph to highlight it and leave a comment. On a laptop you can still drag-select a
        shorter span.
      </p>

      {SECTIONS.map(({ key, label }) => {
        const text = steer[key];
        if (!text.trim()) return null;
        return (
          <section key={key} className="card p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
              <span className="h-1.5 w-1.5 rounded-full bg-ink-300" aria-hidden />
              {key === 'context' ? steer.contextLabel ?? label : key === 'choice' ? steer.choiceLabel ?? label : label}
            </div>
            <HighlightableText
              text={text}
              section={key}
              highlights={highlights}
              revisions={revisions}
              onSelect={onSelect}
              onHighlightClick={onHighlightClick}
              onRevisionClick={onRevisionClick}
            />
          </section>
        );
      })}

      {steer.yourCallBody && (
        <section className="card p-5">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
            Your call
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-800">
            {steer.yourCallBody}
          </p>
        </section>
      )}
    </article>
  );
}

function MetaChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'hold';
}) {
  return (
    <span
      className={
        tone === 'hold'
          ? 'rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-900 ring-1 ring-amber-200'
          : 'rounded-full bg-ink-50 px-2.5 py-1 text-ink-700 ring-1 ring-ink-200'
      }
    >
      <span className="text-ink-400">{label}:</span> {value}
    </span>
  );
}

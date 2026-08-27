import { ExternalLink } from 'lucide-react';
import type { SteerCase, SteerHighlight, SteerSection } from '../types/steers';
import { HighlightableText, type PendingSpan } from './HighlightableText';

const SECTIONS: { key: SteerSection; label: string }[] = [
  { key: 'context', label: 'Context' },
  { key: 'problem', label: 'Problem' },
  { key: 'options', label: 'Options' },
  { key: 'choice', label: 'Choice' },
];

export function SteerCaseView({
  steer,
  highlights,
  onSelect,
  onHighlightClick,
}: {
  steer: SteerCase;
  highlights: SteerHighlight[];
  onSelect: (span: PendingSpan) => void;
  onHighlightClick: (highlight: SteerHighlight) => void;
}) {
  return (
    <article className="space-y-4">
      <header className="card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Steer</p>
        <h2 className="mt-1 text-xl font-semibold leading-snug text-ink-950">{steer.title}</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <MetaChip label="Session" value={steer.session} />
          <MetaChip label="Stamp" value={steer.stamp} tone={steer.stamp === 'HOLD' ? 'hold' : undefined} />
          {steer.yourCall && <MetaChip label="Your call" value={steer.yourCall} />}
          <MetaChip label="When" value={steer.when} />
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

      {SECTIONS.map(({ key, label }) => (
        <section key={key} className="card p-5">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
            {label}
          </div>
          <HighlightableText
            text={steer[key]}
            section={key}
            highlights={highlights}
            onSelect={onSelect}
            onHighlightClick={onHighlightClick}
          />
        </section>
      ))}
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

import type { A1Trace, CommitmentState } from '../types';
import { cn } from '../lib/utils';

const STATE_STYLES: Record<CommitmentState, string> = {
  closed: 'bg-pass-soft text-pass border-emerald-200',
  dropped: 'bg-purple-50 text-purple-700 border-purple-200',
  quiet: 'bg-amber-50 text-amber-800 border-amber-200',
  overdue: 'bg-fail-soft text-fail border-red-200',
};

export function A1TraceView({ trace }: { trace: A1Trace }) {
  return (
    <div className="space-y-4">
      <section className="card p-5">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">
          Project
        </div>
        <h2 className="text-lg font-semibold text-ink-950">{trace.projectName}</h2>
        <p className="mt-1 text-sm text-ink-500">
          Infer whether commitment states match the meeting series.
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="card p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
            Meeting series timeline
          </h3>
          <ol className="relative space-y-0 border-l border-ink-200 ml-2">
            {trace.meetings.map((m, i) => (
              <li key={i} className="relative pb-5 pl-5 last:pb-0">
                <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-accent shadow" />
                <div className="text-xs font-medium text-ink-500">
                  {m.date} · {m.title}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-ink-800">{m.excerpt}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">
            Inferred commitments ({trace.commitments.length})
          </h3>
          {trace.commitments.map((c) => (
            <article key={c.id} className="card p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
                    STATE_STYLES[c.inferredState],
                  )}
                >
                  {c.inferredState}
                </span>
                <span className="font-mono text-[11px] text-ink-400">{c.id}</span>
              </div>
              <p className="text-sm font-medium text-ink-900">{c.text}</p>
              {c.evidence && (
                <p className="mt-2 rounded-lg bg-ink-50 px-3 py-2 text-xs leading-relaxed text-ink-600">
                  <span className="font-medium text-ink-500">Evidence: </span>
                  {c.evidence}
                </p>
              )}
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}

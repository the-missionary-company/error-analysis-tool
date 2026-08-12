import { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Quote } from 'lucide-react';
import type { HubTrace } from '../types';
import { cn } from '../lib/utils';

export function HubTraceView({ trace }: { trace: HubTrace }) {
  const [chunksOpen, setChunksOpen] = useState(false);

  return (
    <div className="space-y-4">
      <section className="card p-5">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
          PM question
        </div>
        <h2 className="text-lg font-semibold leading-snug text-ink-950">{trace.question}</h2>
      </section>

      <section className="card p-5">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
          Answer
        </div>
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink-800">{trace.answer}</p>
      </section>

      <section className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-ink-400">
          Citations ({trace.citations.length})
        </div>
        <div className="grid gap-3">
          {trace.citations.map((c, i) => (
            <article key={i} className="card p-4">
              <div className="mb-2 flex items-start gap-2">
                <Quote className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <div>
                  <h3 className="text-sm font-semibold text-ink-900">{c.title}</h3>
                  {c.source && <p className="text-xs text-ink-500">{c.source}</p>}
                </div>
              </div>
              <p className="border-l-2 border-accent/30 pl-3 text-sm leading-relaxed text-ink-700">
                {c.excerpt}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="card overflow-hidden">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-ink-50"
          onClick={() => setChunksOpen((v) => !v)}
        >
          <span className="flex items-center gap-2 text-sm font-medium text-ink-800">
            <FileText className="h-4 w-4 text-ink-400" />
            Retrieved chunks ({trace.chunks.length})
          </span>
          {chunksOpen ? (
            <ChevronDown className="h-4 w-4 text-ink-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-ink-400" />
          )}
        </button>
        {chunksOpen && (
          <ul className="space-y-2 border-t border-ink-100 px-4 py-3">
            {trace.chunks.map((ch) => (
              <li
                key={ch.id}
                className={cn('rounded-lg border border-ink-100 bg-ink-50/60 px-3 py-2.5 text-sm')}
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-ink-400">
                  <span className="font-mono">{ch.id}</span>
                  {typeof ch.score === 'number' && (
                    <span>score {ch.score.toFixed(2)}</span>
                  )}
                </div>
                <p className="text-ink-700">{ch.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { caseProgress, type CaseProgress } from '../lib/steers';
import { cn } from '../lib/utils';
import type { SteerCase, SteerReview } from '../types/steers';

type Filter = 'all' | 'open' | 'scored';

export function SteerCaseQueue({
  cases,
  reviews,
  activeId,
  onSelect,
}: {
  cases: SteerCase[];
  reviews: Record<string, SteerReview>;
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const scoredCount = cases.filter((item) => caseProgress(reviews[item.id]) === 'scored').length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cases.filter((item) => {
      const progress = caseProgress(reviews[item.id]);
      if (filter === 'scored' && progress !== 'scored') return false;
      if (filter === 'open' && progress === 'scored') return false;
      if (!q) return true;
      return [item.title, item.session, item.stamp, item.when].some((part) =>
        part.toLowerCase().includes(q),
      );
    });
  }, [cases, filter, query, reviews]);

  return (
    <aside className="flex max-h-[min(70vh,40rem)] flex-col rounded-xl border border-ink-200 bg-white lg:max-h-[calc(100vh-7rem)] lg:sticky lg:top-[4.5rem]">
      <div className="border-b border-ink-100 px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink-950">Cases</h2>
          <p className="text-[11px] text-ink-500">
            {scoredCount}/{cases.length} scored
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, session, stamp"
          className="mt-2 w-full rounded-lg border border-ink-200 px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <div className="mt-2 grid grid-cols-3 gap-1">
          {(['all', 'open', 'scored'] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={cn(
                'rounded-md px-2 py-1 text-[11px] capitalize',
                filter === value ? 'bg-ink-900 text-white' : 'bg-ink-50 text-ink-600 hover:bg-ink-100',
              )}
              onClick={() => setFilter(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-ink-400">j / k move · n next open</p>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {visible.map((item) => {
          const review = reviews[item.id];
          const progress = caseProgress(review);
          return (
            <li key={item.id}>
              <button
                type="button"
                data-case-id={item.id}
                onClick={() => onSelect(item.id)}
                className={cn(
                  'mb-1 w-full rounded-lg px-2.5 py-2 text-left text-sm transition',
                  item.id === activeId
                    ? 'bg-accent-soft text-ink-950 ring-1 ring-accent/30'
                    : 'text-ink-700 hover:bg-ink-50',
                )}
              >
                <span className="block truncate font-medium">{item.title}</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-400">
                  <span>{item.session}</span>
                  <span>·</span>
                  <span>{item.stamp}</span>
                  <StatusDots progress={progress} content={review?.content.passFail} action={review?.action.passFail} notes={review?.notes.length ?? 0} />
                </span>
              </button>
            </li>
          );
        })}
        {visible.length === 0 && (
          <li className="px-2 py-6 text-center text-xs text-ink-400">No cases in this filter.</li>
        )}
      </ul>
    </aside>
  );
}

function StatusDots({
  progress,
  content,
  action,
  notes,
}: {
  progress: CaseProgress;
  content?: 'pass' | 'fail' | null;
  action?: 'pass' | 'fail' | null;
  notes: number;
}) {
  return (
    <span className="ml-auto inline-flex items-center gap-1">
      <Mark label="C" value={content} />
      <Mark label="A" value={action} />
      {notes > 0 && <span className="text-ink-500">{notes} note{notes === 1 ? '' : 's'}</span>}
      {progress === 'unscored' && notes === 0 && <span>unscored</span>}
    </span>
  );
}

function Mark({ label, value }: { label: string; value?: 'pass' | 'fail' | null }) {
  return (
    <span
      className={cn(
        'rounded px-1 py-px font-medium',
        value === 'pass' && 'bg-emerald-50 text-emerald-800',
        value === 'fail' && 'bg-rose-50 text-rose-800',
        !value && 'bg-ink-100 text-ink-400',
      )}
      title={`${label}: ${value ?? 'open'}`}
    >
      {label}
      {value === 'pass' ? '✓' : value === 'fail' ? '✗' : '·'}
    </span>
  );
}

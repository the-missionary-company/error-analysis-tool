import { useEffect, useMemo, useRef, useState, type Ref } from 'react';
import { filterQueueCases, type CaseQueueFilter } from '../lib/caseQueue';
import { caseProgress, type CaseProgress } from '../lib/steers';
import { cn } from '../lib/utils';
import type { CaseSort, CaseSortField, SteerCase, SteerReview } from '../types/steers';

const SORT_FIELDS: { id: CaseSortField; label: string }[] = [
  { id: 'timestamp', label: 'Timestamp' },
  { id: 'number', label: 'Number' },
  { id: 'stamp', label: 'Stamp' },
  { id: 'session', label: 'Session' },
];

export function SteerCaseQueue({
  cases,
  reviews,
  activeId,
  sort,
  onSortChange,
  onSelect,
}: {
  cases: SteerCase[];
  reviews: Record<string, SteerReview>;
  activeId: string;
  sort: CaseSort;
  onSortChange: (sort: CaseSort) => void;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CaseQueueFilter>('all');
  const [pickerOpen, setPickerOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const scoredCount = cases.filter((item) => caseProgress(reviews[item.id]) === 'scored').length;
  const visible = useMemo(
    () => filterQueueCases(cases, reviews, filter, query),
    [cases, filter, query, reviews],
  );
  const active = cases.find((item) => item.id === activeId);

  useEffect(() => {
    if (!pickerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus());
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setPickerOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKey);
    };
  }, [pickerOpen]);

  const chrome = (searchFocus?: boolean) => (
    <QueueChrome
      query={query}
      onQueryChange={setQuery}
      filter={filter}
      onFilterChange={setFilter}
      sort={sort}
      onSortChange={onSortChange}
      searchRef={searchFocus ? searchRef : undefined}
      hint="j / k move · n next open"
    />
  );

  const list = (
    <QueueList
      cases={visible}
      reviews={reviews}
      activeId={activeId}
      onSelect={(id) => {
        onSelect(id);
        setPickerOpen(false);
      }}
    />
  );

  return (
    <>
      <div className="md:hidden">
        <button
          type="button"
          className="card flex w-full items-center gap-3 p-3 text-left"
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
          onClick={() => setPickerOpen(true)}
        >
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              Updates · {cases.length}
              <span className="font-medium normal-case tracking-normal text-ink-500">
                {' '}
                · {scoredCount} scored
              </span>
            </p>
            <p className="mt-1 text-sm font-semibold leading-snug text-ink-950">
              {active?.number != null ? `${active.number} · ` : ''}
              {active?.title ?? 'Pick an update'}
            </p>
            <p className="mt-0.5 text-xs text-ink-500">Browse the list and open one to read it</p>
          </div>
          <span className="btn-secondary h-9 shrink-0 px-3 text-xs">Browse</span>
        </button>
      </div>

      {pickerOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-white md:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="case-picker-title"
        >
          <div className="flex items-center justify-between gap-3 border-b border-ink-200 px-4 py-3">
            <div>
              <h2 id="case-picker-title" className="text-sm font-semibold text-ink-950">
                Updates
              </h2>
              <p className="text-[11px] text-ink-500">
                {visible.length} shown · {cases.length} total
              </p>
            </div>
            <button type="button" className="btn-secondary h-9 px-3 text-xs" onClick={() => setPickerOpen(false)}>
              Close
            </button>
          </div>
          <div className="border-b border-ink-100 px-3 py-2.5">{chrome(true)}</div>
          <div className="min-h-0 flex-1 overflow-y-auto px-1.5 py-1.5">{list}</div>
        </div>
      )}

      <aside className="hidden max-h-[calc(100vh-7rem)] flex-col rounded-xl border border-ink-200 bg-white md:sticky md:top-[4.5rem] md:flex">
        <div className="border-b border-ink-100 px-3 py-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink-950">Cases</h2>
            <p className="text-[11px] text-ink-500">
              {scoredCount}/{cases.length} scored
            </p>
          </div>
          <div className="mt-2">{chrome()}</div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-1.5">{list}</div>
      </aside>
    </>
  );
}

function QueueChrome({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  sort,
  onSortChange,
  searchRef,
  hint,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  filter: CaseQueueFilter;
  onFilterChange: (value: CaseQueueFilter) => void;
  sort: CaseSort;
  onSortChange: (sort: CaseSort) => void;
  searchRef?: Ref<HTMLInputElement>;
  hint: string;
}) {
  return (
    <div>
      <input
        ref={searchRef}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search title, number, session, stamp"
        className="w-full rounded-lg border border-ink-200 px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
      <div className="mt-2 flex flex-wrap gap-1">
        {(['all', 'open', 'scored'] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={cn(
              'rounded-md px-2 py-1 text-[11px] capitalize md:flex-1',
              filter === value ? 'bg-ink-900 text-white' : 'bg-ink-50 text-ink-600 hover:bg-ink-100',
            )}
            onClick={() => onFilterChange(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <div className="mt-2">
        <p className="text-[11px] font-medium text-ink-400">Sort</p>
        <div className="mt-1 grid grid-cols-2 gap-1">
          {SORT_FIELDS.map((field) => (
            <button
              key={field.id}
              type="button"
              className={cn(
                'rounded-md px-2 py-1 text-[11px]',
                sort.field === field.id ? 'bg-ink-900 text-white' : 'bg-ink-50 text-ink-600 hover:bg-ink-100',
              )}
              onClick={() =>
                onSortChange({
                  field: field.id,
                  direction: sort.field === field.id && sort.direction === 'asc' ? 'desc' : 'asc',
                })
              }
            >
              {field.label}
              {sort.field === field.id ? (sort.direction === 'asc' ? ' ↑' : ' ↓') : ''}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-2 hidden text-[11px] text-ink-400 md:block">{hint}</p>
    </div>
  );
}

function QueueList({
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
  return (
    <ul>
      {cases.map((item) => {
        const review = reviews[item.id];
        const progress = caseProgress(review);
        return (
          <li key={item.id}>
            <button
              type="button"
              data-case-id={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                'mb-1 w-full rounded-lg px-2.5 py-2.5 text-left text-sm transition md:py-2',
                item.id === activeId
                  ? 'bg-accent-soft text-ink-950 ring-1 ring-accent/30'
                  : 'text-ink-700 hover:bg-ink-50',
              )}
            >
              <span className="block font-medium leading-snug">
                {item.number != null ? `${item.number} · ` : ''}
                {item.title}
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-400">
                <span>{item.session}</span>
                <span>·</span>
                <span>{item.stamp}</span>
                <StatusDots
                  progress={progress}
                  content={review?.content.passFail}
                  action={review?.action.passFail}
                  notes={review?.notes.length ?? 0}
                />
              </span>
            </button>
          </li>
        );
      })}
      {cases.length === 0 && (
        <li className="px-2 py-6 text-center text-xs text-ink-400">No cases in this filter.</li>
      )}
    </ul>
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
      {notes > 0 && (
        <span className="text-ink-500">
          {notes} note{notes === 1 ? '' : 's'}
        </span>
      )}
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

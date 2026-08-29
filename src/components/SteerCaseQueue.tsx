import { useMemo, useState } from 'react';
import {
  caseParentId,
  caseParentKey,
  caseParentTitle,
  caseProgress,
  caseProject,
  isFiled,
  listParentScopes,
  type CaseProgress,
} from '../lib/steers';
import { cn } from '../lib/utils';
import type {
  CaseSort,
  CaseSortField,
  InboxTab,
  SteerCase,
  SteerReview,
} from '../types/steers';

type ProgressFilter = 'all' | 'open' | 'scored';

const SORT_FIELDS: { id: CaseSortField; label: string }[] = [
  { id: 'timestamp', label: 'Timestamp' },
  { id: 'number', label: 'Number' },
  { id: 'parent', label: 'Parent' },
  { id: 'project', label: 'Project' },
  { id: 'stamp', label: 'Stamp' },
  { id: 'session', label: 'Session' },
];

export function SteerCaseQueue({
  cases,
  reviews,
  activeId,
  sort,
  inboxTab,
  parentFilter,
  onSortChange,
  onInboxTabChange,
  onParentFilterChange,
  onSelect,
}: {
  cases: SteerCase[];
  reviews: Record<string, SteerReview>;
  activeId: string;
  sort: CaseSort;
  inboxTab: InboxTab;
  parentFilter: string | null;
  onSortChange: (sort: CaseSort) => void;
  onInboxTabChange: (tab: InboxTab) => void;
  onParentFilterChange: (parentKey: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ProgressFilter>('all');
  const parents = useMemo(() => listParentScopes(cases), [cases]);

  const inboxCount = cases.filter((item) => !isFiled(reviews[item.id])).length;
  const filedCount = cases.length - inboxCount;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cases.filter((item) => {
      const review = reviews[item.id];
      const filed = isFiled(review);
      if (inboxTab === 'inbox' && filed) return false;
      if (inboxTab === 'filed' && !filed) return false;
      if (parentFilter && caseParentKey(item) !== parentFilter) return false;
      const progress = caseProgress(review);
      if (filter === 'scored' && progress !== 'scored') return false;
      if (filter === 'open' && progress === 'scored') return false;
      if (!q) return true;
      return [
        item.title,
        item.session,
        item.sessionId,
        caseProject(item),
        caseParentId(item),
        item.spec,
        item.stamp,
        item.when,
      ].some((part) => (part ?? '').toLowerCase().includes(q));
    });
  }, [cases, filter, inboxTab, parentFilter, query, reviews]);

  return (
    <aside className="flex max-h-[min(50vh,22rem)] flex-col rounded-xl border border-ink-200 bg-white md:max-h-[calc(100vh-7rem)] md:sticky md:top-[4.5rem]">
      <div className="border-b border-ink-100 px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink-950">Cases</h2>
          <p className="text-[11px] text-ink-500">
            {inboxCount} inbox · {filedCount} filed
          </p>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-1">
          {([
            ['inbox', `Inbox (${inboxCount})`],
            ['filed', `Filed (${filedCount})`],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={cn(
                'rounded-md px-2 py-1.5 text-[11px] font-medium',
                inboxTab === value ? 'bg-ink-900 text-white' : 'bg-ink-50 text-ink-600 hover:bg-ink-100',
              )}
              onClick={() => onInboxTabChange(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, Linear id, project…"
          className="mt-2 w-full rounded-lg border border-ink-200 px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />

        <div className="mt-2">
          <p className="text-[11px] font-medium text-ink-400">Parent (Linear)</p>
          <div className="-mx-1 mt-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
            <button
              type="button"
              className={cn(
                'shrink-0 rounded-md px-2 py-1 text-[11px]',
                !parentFilter ? 'bg-ink-900 text-white' : 'bg-ink-50 text-ink-600 hover:bg-ink-100',
              )}
              onClick={() => onParentFilterChange(null)}
            >
              All
            </button>
            {parents.map((parent) => (
              <button
                key={parent.key}
                type="button"
                title={`${parent.parentSystem}:${parent.parentId} — ${parent.parentTitle}`}
                className={cn(
                  'max-w-[14rem] shrink-0 truncate rounded-md px-2 py-1 text-[11px]',
                  parentFilter === parent.key
                    ? 'bg-ink-900 text-white'
                    : 'bg-ink-50 text-ink-600 hover:bg-ink-100',
                )}
                onClick={() => onParentFilterChange(parent.key)}
              >
                {parent.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {(['all', 'open', 'scored'] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={cn(
                'rounded-md px-2 py-1 text-[11px] capitalize md:flex-1',
                filter === value ? 'bg-ink-900 text-white' : 'bg-ink-50 text-ink-600 hover:bg-ink-100',
              )}
              onClick={() => setFilter(value)}
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
        <p className="mt-2 text-[11px] text-ink-400">j / k move · n next inbox · Done files it</p>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {visible.map((item) => {
          const review = reviews[item.id];
          const progress = caseProgress(review);
          const project = caseProject(item);
          const parentId = caseParentId(item);
          const parentTitle = caseParentTitle(item);
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
                <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-400">
                  {parentId ? (
                    <span className="font-mono text-violet-800">{parentId}</span>
                  ) : (
                    <span>{project || '—'}</span>
                  )}
                  {parentTitle && (
                    <>
                      <span>·</span>
                      <span className="truncate">{parentTitle}</span>
                    </>
                  )}
                  {!parentTitle && project && parentId && (
                    <>
                      <span>·</span>
                      <span>{project}</span>
                    </>
                  )}
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
        {visible.length === 0 && (
          <li className="px-2 py-6 text-center text-xs text-ink-400">
            {inboxTab === 'inbox' ? 'Inbox is clear for this filter.' : 'No filed cases in this filter.'}
          </li>
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

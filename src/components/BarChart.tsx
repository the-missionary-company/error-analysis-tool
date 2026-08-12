import { cn } from '../lib/utils';

interface Item {
  id: string;
  name: string;
  count: number;
}

export function BarChart({
  items,
  activeId,
  onSelect,
}: {
  items: Item[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-ink-200 px-4 py-8 text-center text-sm text-ink-500">
        No categories yet. Copy the clustering prompt or run LLM clustering after you have fail notes.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect?.(item.id)}
          className={cn(
            'group grid w-full grid-cols-[minmax(0,1fr)_3rem] items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-ink-50',
            activeId === item.id && 'bg-accent-soft',
          )}
        >
          <div className="min-w-0">
            <div className="mb-1 truncate text-sm font-medium text-ink-800">{item.name}</div>
            <div className="h-2 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
          </div>
          <div className="text-right text-sm font-semibold tabular-nums text-ink-700">
            {item.count}
          </div>
        </button>
      ))}
    </div>
  );
}

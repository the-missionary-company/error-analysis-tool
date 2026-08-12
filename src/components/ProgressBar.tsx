import { cn } from '../lib/utils';

export function ProgressBar({
  annotated,
  total,
  passRate,
  className,
}: {
  annotated: number;
  total: number;
  passRate: number | null;
  className?: string;
}) {
  const pct = total === 0 ? 0 : Math.round((annotated / total) * 100);
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between text-xs text-ink-500">
        <span>
          {annotated}/{total} annotated · {pct}%
        </span>
        <span>
          Pass rate:{' '}
          <span className="font-medium text-ink-800">
            {passRate === null ? '—' : `${Math.round(passRate * 100)}%`}
          </span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

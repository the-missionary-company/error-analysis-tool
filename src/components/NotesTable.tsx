import type { Annotation, Trace } from '../types';
import { cn, formatDate } from '../lib/utils';

interface Props {
  traces: Trace[];
  annotations: Record<string, Annotation>;
  activeTraceId?: string;
  onJump: (traceId: string) => void;
}

export function NotesTable({ traces, annotations, activeTraceId, onJump }: Props) {
  const rows = Object.values(annotations)
    .filter((a) => a.judgment !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  if (rows.length === 0) {
    return (
      <div className="card p-4 text-sm text-ink-500">
        No notes yet. Annotate items — your smoking-gun observations will collect here.
      </div>
    );
  }

  const labelFor = (id: string) => {
    const t = traces.find((x) => x.id === id);
    if (!t) return id;
    if (t.product === 'central-hub') return t.question;
    return `${t.projectName}: ${t.commitments[0]?.text ?? t.id}`;
  };

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-ink-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-ink-900">Notes so far</h3>
        <p className="text-xs text-ink-500">Click a row to jump. Later notes = sharper criteria.</p>
      </div>
      <div className="max-h-64 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-ink-50 text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-4 py-2 font-medium">When</th>
              <th className="px-4 py-2 font-medium">Result</th>
              <th className="px-4 py-2 font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr
                key={a.traceId}
                className={cn(
                  'cursor-pointer border-t border-ink-100 hover:bg-accent-soft/60',
                  activeTraceId === a.traceId && 'bg-accent-soft',
                )}
                onClick={() => onJump(a.traceId)}
              >
                <td className="whitespace-nowrap px-4 py-2.5 text-xs text-ink-500">
                  {formatDate(a.updatedAt)}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      a.judgment === 'pass' && 'bg-pass-soft text-pass',
                      a.judgment === 'fail' && 'bg-fail-soft text-fail',
                    )}
                  >
                    {a.judgment}
                  </span>
                </td>
                <td className="max-w-0 px-4 py-2.5">
                  <div className="truncate text-ink-800" title={a.note}>
                    {a.note || <span className="italic text-ink-400">(no note)</span>}
                  </div>
                  <div className="truncate text-xs text-ink-400">{labelFor(a.traceId)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

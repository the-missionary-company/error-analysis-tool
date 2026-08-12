import { clsx, type ClassValue } from 'clsx';
import type { Annotation, Trace } from '../types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function progressStats(traces: Trace[], annotations: Record<string, Annotation>) {
  const total = traces.length;
  const annotated = traces.filter((t) => {
    const a = annotations[t.id];
    return a && a.judgment !== null;
  }).length;
  const passes = traces.filter((t) => annotations[t.id]?.judgment === 'pass').length;
  const fails = traces.filter((t) => annotations[t.id]?.judgment === 'fail').length;
  const passRate = annotated === 0 ? null : passes / annotated;
  return { total, annotated, passes, fails, passRate };
}

export function isMac() {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
}

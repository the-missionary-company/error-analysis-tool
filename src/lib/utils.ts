import { clsx, type ClassValue } from 'clsx';
import type { Annotation, Trace } from '../types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Parse ISO / date-only strings for display. Date-only stays on that calendar day. */
export function parseDisplayDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (DATE_ONLY.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(Number);
    const local = new Date(y, m - 1, d);
    return Number.isNaN(local.getTime()) ? null : local;
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Local date + time for UI. Backend may store Zulu; never show Z/UTC to the viewer. */
export function formatLocalDateTime(iso: string): string {
  const date = parseDisplayDate(iso);
  if (!date) return iso;
  const dateOnly = DATE_ONLY.test(iso.trim());
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      ...(dateOnly
        ? {}
        : { hour: 'numeric', minute: '2-digit' }),
    }).format(date);
  } catch {
    return iso;
  }
}

/** Clock-focused local time for list scanning (e.g. "6:09 PM"). Other days include a short date. */
export function formatLocalTime(iso: string): string {
  if (DATE_ONLY.test(iso.trim())) return formatLocalDateTime(iso);
  const date = parseDisplayDate(iso);
  if (!date) return iso;
  try {
    const now = new Date();
    const sameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    if (sameDay) {
      return new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      }).format(date);
    }
    return formatLocalDateTime(iso);
  } catch {
    return iso;
  }
}

export function formatDate(iso: string) {
  return formatLocalDateTime(iso);
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

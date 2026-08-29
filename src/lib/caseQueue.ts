import { caseProgress } from './steers.js';
import type { SteerCase, SteerReview } from '../types/steers.js';

export type CaseQueueFilter = 'all' | 'open' | 'scored';

export function filterQueueCases(
  cases: SteerCase[],
  reviews: Record<string, SteerReview>,
  filter: CaseQueueFilter,
  query: string,
): SteerCase[] {
  const q = query.trim().toLowerCase();
  return cases.filter((item) => {
    const progress = caseProgress(reviews[item.id]);
    if (filter === 'scored' && progress !== 'scored') return false;
    if (filter === 'open' && progress === 'scored') return false;
    if (!q) return true;
    const haystack = [
      item.title,
      item.session,
      item.stamp,
      item.when,
      item.number != null ? String(item.number) : '',
    ];
    return haystack.some((part) => part.toLowerCase().includes(q));
  });
}

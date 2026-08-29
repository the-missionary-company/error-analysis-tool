import type { ScoreLane } from '../types/steers';

export const LANE_TONE: Record<
  ScoreLane,
  {
    mark: string;
    chip: string;
    card: string;
    bar: string;
    button: string;
    buttonActive: string;
  }
> = {
  content: {
    mark: 'bg-sky-100 text-sky-950 decoration-sky-700 dark:bg-sky-950 dark:text-sky-100 dark:decoration-sky-300',
    chip: 'bg-sky-100 text-sky-900 ring-sky-200 dark:bg-sky-950 dark:text-sky-100 dark:ring-sky-800',
    card: 'border-sky-200 bg-sky-50/80 dark:border-sky-800 dark:bg-sky-950/60',
    bar: 'border-sky-200 dark:border-sky-800',
    button: 'border-sky-200 text-sky-800 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-200 dark:hover:bg-sky-950',
    buttonActive: 'bg-sky-600 text-white border-sky-600 hover:bg-sky-600',
  },
  action: {
    mark: 'bg-amber-100 text-amber-950 decoration-amber-800 dark:bg-amber-950 dark:text-amber-100 dark:decoration-amber-300',
    chip: 'bg-amber-100 text-amber-950 ring-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-800',
    card: 'border-amber-200 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/60',
    bar: 'border-amber-200 dark:border-amber-800',
    button: 'border-amber-200 text-amber-900 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-950',
    buttonActive: 'bg-amber-600 text-white border-amber-600 hover:bg-amber-600',
  },
};

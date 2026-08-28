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
    mark: 'bg-sky-100 text-sky-950 decoration-sky-700',
    chip: 'bg-sky-100 text-sky-900 ring-sky-200',
    card: 'border-sky-200 bg-sky-50/80',
    bar: 'border-sky-200',
    button: 'border-sky-200 text-sky-800 hover:bg-sky-50',
    buttonActive: 'bg-sky-600 text-white border-sky-600 hover:bg-sky-600',
  },
  action: {
    mark: 'bg-amber-100 text-amber-950 decoration-amber-800',
    chip: 'bg-amber-100 text-amber-950 ring-amber-200',
    card: 'border-amber-200 bg-amber-50/80',
    bar: 'border-amber-200',
    button: 'border-amber-200 text-amber-900 hover:bg-amber-50',
    buttonActive: 'bg-amber-600 text-white border-amber-600 hover:bg-amber-600',
  },
};

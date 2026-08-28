import { SEED_STEERS } from '../data/steerSeed';
import type { SteerCase } from '../types/steers';
import { parseSteerCases } from './steers';

export async function fetchRemoteCases(): Promise<SteerCase[] | null> {
  try {
    const response = await fetch('/api/cases', { credentials: 'include' });
    if (!response.ok) return null;
    return parseSteerCases(await response.json());
  } catch {
    return null;
  }
}

export function remoteCaseExtras(remote: SteerCase[]): SteerCase[] {
  return remote.filter((item) => {
    const seed = SEED_STEERS.find((row) => row.id === item.id);
    if (!seed) return true;
    return JSON.stringify(seed) !== JSON.stringify(item);
  });
}

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

export async function postRemoteCases(input: SteerCase | SteerCase[]): Promise<void> {
  try {
    const body = Array.isArray(input) ? { cases: input } : input;
    await fetch('/api/cases', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    // Board stays on localStorage if the API is down.
  }
}

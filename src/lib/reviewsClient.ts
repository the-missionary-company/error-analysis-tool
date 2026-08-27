import type { SteerReview } from '../types/steers';
import { parseSteerReviews } from './steers';

export async function fetchRemoteReviews(): Promise<SteerReview[] | null> {
  try {
    const response = await fetch('/api/reviews', { credentials: 'include' });
    if (!response.ok) return null;
    return parseSteerReviews(await response.json());
  } catch {
    return null;
  }
}

export async function putRemoteReviews(input: SteerReview | SteerReview[]): Promise<void> {
  try {
    const body = Array.isArray(input) ? { reviews: input } : { review: input };
    await fetch('/api/reviews', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    // Board stays on localStorage if the API is down.
  }
}

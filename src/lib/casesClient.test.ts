import { describe, expect, it } from 'vitest';
import { SEED_STEERS } from '../data/steerSeed';
import { remoteCaseExtras } from './casesClient';

describe('remoteCaseExtras', () => {
  it('keeps posted extras and leaves unmodified seed rows out of local persist', () => {
    const extra = {
      ...SEED_STEERS[0],
      id: 'posted-extra',
      title: 'Posted extra',
    };
    expect(remoteCaseExtras([...SEED_STEERS, extra]).map((item) => item.id)).toEqual(['posted-extra']);
  });

  it('keeps an archived seed overlay so Oscar GET/POST can see the flag', () => {
    const archived = { ...SEED_STEERS[0], archived: true };
    expect(remoteCaseExtras([...SEED_STEERS.slice(1), archived]).map((item) => item.id)).toEqual([
      SEED_STEERS[0].id,
    ]);
  });
});

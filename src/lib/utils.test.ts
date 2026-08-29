import { describe, expect, it } from 'vitest';
import { formatDate } from './utils';

describe('formatDate', () => {
  it('shows a UTC timestamp in the viewer timezone, not the raw ISO string', () => {
    const korea = formatDate('2026-08-27T13:25:00.000Z', 'Asia/Seoul');
    expect(korea).not.toContain('T13:25');
    expect(korea).not.toContain('.000Z');
    expect(korea).toMatch(/22:25|10:25\s*PM/i);
    expect(korea).toMatch(/KST|GMT\+9|UTC\+9/i);
  });

  it('returns the original string when the value is not a date', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

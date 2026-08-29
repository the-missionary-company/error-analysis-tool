import { describe, expect, it } from 'vitest';
import { formatDate, formatLocalDateTime, formatLocalTime } from './utils';

describe('formatLocalDateTime', () => {
  it('formats an ISO Zulu timestamp in the local timezone without a Z suffix', () => {
    const out = formatLocalDateTime('2026-08-27T13:00:00.000Z');
    expect(out).not.toMatch(/Z$/);
    expect(out).not.toMatch(/UTC/i);
    expect(out.length).toBeGreaterThan(0);
    // Same instant as 1:00 PM UTC — local clock must include a time component.
    expect(out).toMatch(/\d/);
  });

  it('formats date-only values as calendar dates without shifting the day', () => {
    expect(formatLocalDateTime('2026-08-27')).toMatch(/Aug.*27|27.*Aug/i);
  });

  it('returns the original string when parsing fails', () => {
    expect(formatLocalDateTime('not-a-date')).toBe('not-a-date');
  });
});

describe('formatLocalTime', () => {
  it('shows clock time for an ISO timestamp', () => {
    const out = formatLocalTime('2026-08-27T18:00:00.000Z');
    expect(out).not.toMatch(/Z$/);
    expect(out).toMatch(/\d/);
  });

  it('falls back to formatLocalDateTime for date-only strings', () => {
    expect(formatLocalTime('2026-08-27')).toBe(formatLocalDateTime('2026-08-27'));
  });
});

describe('formatDate', () => {
  it('uses local time and never appends Z', () => {
    const out = formatDate('2026-08-27T13:25:00.000Z');
    expect(out).not.toMatch(/Z$/);
    expect(out).not.toMatch(/UTC/i);
  });
});

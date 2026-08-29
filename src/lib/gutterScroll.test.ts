import { describe, expect, it } from 'vitest';
import { shouldAutoScrollToComment } from './gutterScroll';

describe('shouldAutoScrollToComment', () => {
  it('does not jump to the comment list on mobile widths', () => {
    expect(shouldAutoScrollToComment({ matches: false })).toBe(false);
  });

  it('may scroll the side gutter into view on wide layouts', () => {
    expect(shouldAutoScrollToComment({ matches: true })).toBe(true);
  });
});

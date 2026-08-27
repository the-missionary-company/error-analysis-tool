import { describe, expect, it } from 'vitest';
import { SEED_STEERS } from '../data/steerSeed';
import { displayTextForRange, parseInlineMarkup, splitParagraphs } from './inlineMarkup';

describe('parseInlineMarkup', () => {
  it('turns markdown links into label tokens and leaves surrounding prose', () => {
    const text =
      'That package is [CH-807](https://linear.app/the-missionary-company/issue/CH-807/generic-capture-review-core). Ken sat with it.';
    const tokens = parseInlineMarkup(text);
    expect(tokens.map((token) => token.kind)).toEqual(['text', 'link', 'text']);
    const link = tokens[1];
    expect(link.kind).toBe('link');
    if (link.kind !== 'link') return;
    expect(link.display).toBe('CH-807');
    expect(link.href).toContain('linear.app');
    expect(text.slice(link.labelStart, link.labelEnd)).toBe('CH-807');
    expect(displayTextForRange(text, 0, text.length)).toBe('That package is CH-807. Ken sat with it.');
    expect(displayTextForRange(text, 0, text.length)).not.toContain('https://');
  });

  it('renders Capture background links without raw URLs', () => {
    const steer = SEED_STEERS.find(
      (item) => item.id === 'finish-path-capture-ken-bugs-then-close-adapters-elsewhere',
    );
    expect(steer).toBeDefined();
    const display = displayTextForRange(steer!.context, 0, steer!.context.length);
    expect(display).toContain('CH-807');
    expect(display).toContain('CH-838');
    expect(display).not.toContain('](https://');
    expect(display).not.toContain('linear.app');
  });

  it('keeps code and bold readable', () => {
    const text = 'Use `inbox.save` and **hold** the key.';
    const tokens = parseInlineMarkup(text);
    expect(tokens.map((token) => [token.kind, token.display])).toEqual([
      ['text', 'Use '],
      ['code', 'inbox.save'],
      ['text', ' and '],
      ['bold', 'hold'],
      ['text', ' the key.'],
    ]);
  });

  it('splits blank-line paragraphs', () => {
    const text = 'First thought.\n\nSecond thought.';
    expect(splitParagraphs(text)).toEqual([
      { start: 0, end: 'First thought.'.length },
      { start: 'First thought.\n\n'.length, end: text.length },
    ]);
  });
});

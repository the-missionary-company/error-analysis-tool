import { describe, expect, it } from 'vitest';
import { SEED_STEERS } from '../data/steerSeed';
import {
  displayTextForRange,
  groupMarkdownBlocks,
  parseInlineMarkup,
  splitMarkdownBlocks,
  splitParagraphs,
} from './inlineMarkup';

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

  it('keeps code, bold, and italic readable', () => {
    const text = 'Use `inbox.save` and **hold** the *key*.';
    const tokens = parseInlineMarkup(text);
    expect(tokens.map((token) => [token.kind, token.display])).toEqual([
      ['text', 'Use '],
      ['code', 'inbox.save'],
      ['text', ' and '],
      ['bold', 'hold'],
      ['text', ' the '],
      ['italic', 'key'],
      ['text', '.'],
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

describe('splitMarkdownBlocks', () => {
  it('turns headings and numbered lists into blocks without the raw markers', () => {
    const text = [
      'You have not sat with this project for a while.',
      '',
      '## What we were building',
      '',
      'Sync All is the mailroom.',
      '',
      '1. The list. Which projects exist.',
      '2. The lines. Where each project starts.',
      '3. The flow. Content actually arriving.',
    ].join('\n');
    const blocks = splitMarkdownBlocks(text);
    expect(blocks.map((block) => block.kind)).toEqual([
      'paragraph',
      'heading',
      'paragraph',
      'list-item',
      'list-item',
      'list-item',
    ]);
    const heading = blocks[1];
    expect(heading.kind).toBe('heading');
    if (heading.kind !== 'heading') return;
    expect(heading.level).toBe(2);
    expect(text.slice(heading.contentStart, heading.contentEnd)).toBe('What we were building');
    expect(text.slice(heading.start, heading.contentStart)).toBe('## ');

    const groups = groupMarkdownBlocks(blocks);
    expect(groups.map((group) => group.kind)).toEqual(['paragraph', 'heading', 'paragraph', 'list']);
    const list = groups[3];
    expect(list.kind).toBe('list');
    if (list.kind !== 'list') return;
    expect(list.list).toBe('ol');
    expect(list.items).toHaveLength(3);
    expect(text.slice(list.items[0].contentStart, list.items[0].contentEnd)).toBe(
      'The list. Which projects exist.',
    );
  });

  it('keeps bullets, quotes, and rules', () => {
    const text = '- First\n- Second\n\n> Hold this.\n\n---';
    const kinds = splitMarkdownBlocks(text).map((block) => block.kind);
    expect(kinds).toEqual(['list-item', 'list-item', 'quote', 'rule']);
  });
});

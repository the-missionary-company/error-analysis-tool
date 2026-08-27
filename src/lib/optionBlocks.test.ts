import { describe, expect, it } from 'vitest';
import { SEED_STEERS } from '../data/steerSeed';
import { hasOptionCards, parseOptionBlocks } from './optionBlocks';

describe('parseOptionBlocks', () => {
  it('splits steer 15 into A/B/C with Pro, Con, and LOE on their own rows', () => {
    const steer = SEED_STEERS.find(
      (item) => item.id === 'the-vitest-sweep-is-the-agent-making-itself-feel-safe',
    );
    expect(steer).toBeDefined();
    const blocks = parseOptionBlocks(steer!.options);
    expect(blocks).toHaveLength(3);
    expect(steer!.options.slice(blocks[0].parts[0].start, blocks[0].parts[0].end)).toContain(
      'Let it finish the suite',
    );
    expect(blocks[0].parts.map((part) => part.kind)).toEqual(['lead', 'pro', 'con', 'loe']);
    expect(blocks[1].parts.map((part) => part.kind)).toEqual(['lead', 'pro', 'con', 'loe']);
    expect(blocks[2].parts.map((part) => part.kind)).toEqual(['lead', 'pro', 'con', 'loe']);
    expect(steer!.options.slice(blocks[1].start, blocks[1].end)).toContain('CUT the sweep');
    const joined = blocks
      .flatMap((block) => block.parts)
      .map((part) => steer!.options.slice(part.start, part.end))
      .join('');
    expect(joined).toBe(steer!.options);
    expect(hasOptionCards(steer!.options)).toBe(true);
    expect(hasOptionCards('Just a paragraph with no choices.')).toBe(false);
  });

  it('keeps numbered options and leaves a line without Pro/Con as a single lead', () => {
    const text =
      '1. Treat the apply as authorized because I said keep moving. No. You authorized one file on Capture. Not this.\n2. Stop further prod apply. Pro: they cannot apply a second time. Con: the first apply already happened. LOE: one fence.';
    const blocks = parseOptionBlocks(text);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].parts).toEqual([{ kind: 'lead', start: 0, end: text.indexOf('\n') + 1 }]);
    expect(blocks[1].parts.map((part) => part.kind)).toEqual(['lead', 'pro', 'con', 'loe']);
  });
});

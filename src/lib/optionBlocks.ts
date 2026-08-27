export type OptionPartKind = 'lead' | 'pro' | 'con' | 'loe';

export interface OptionPart {
  kind: OptionPartKind;
  start: number;
  end: number;
}

export interface OptionBlock {
  start: number;
  end: number;
  parts: OptionPart[];
}

const OPTION_MARK = /(?:^|\n)(?:[A-Z]|\d+)\. /g;
const LABEL_MARK = /(\s)(Pro|Con|LOE):/g;

export function hasOptionCards(text: string): boolean {
  if (!text) return false;
  return optionStarts(text).length >= 2 && /(?:^|\s)(Pro|Con|LOE):/.test(text);
}

export function parseOptionBlocks(text: string): OptionBlock[] {
  if (!text) return [];
  const starts = optionStarts(text);
  if (starts.length === 0) {
    return [{ start: 0, end: text.length, parts: [{ kind: 'lead', start: 0, end: text.length }] }];
  }

  const blocks: OptionBlock[] = [];
  if (starts[0] > 0) {
    blocks.push({
      start: 0,
      end: starts[0],
      parts: [{ kind: 'lead', start: 0, end: starts[0] }],
    });
  }
  for (let i = 0; i < starts.length; i += 1) {
    const start = starts[i];
    const end = i + 1 < starts.length ? starts[i + 1] : text.length;
    blocks.push({ start, end, parts: splitParts(text, start, end) });
  }
  return blocks;
}

function optionStarts(text: string): number[] {
  const starts: number[] = [];
  const re = new RegExp(OPTION_MARK.source, 'g');
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    starts.push(match[0].startsWith('\n') ? match.index + 1 : match.index);
  }
  return starts;
}

function splitParts(text: string, start: number, end: number): OptionPart[] {
  const body = text.slice(start, end);
  const labels = [...body.matchAll(new RegExp(LABEL_MARK.source, 'g'))];
  if (labels.length === 0) {
    return [{ kind: 'lead', start, end }];
  }

  const parts: OptionPart[] = [];
  const firstAbs = start + (labels[0].index ?? 0);
  if (firstAbs > start) {
    parts.push({ kind: 'lead', start, end: firstAbs });
  }
  for (let i = 0; i < labels.length; i += 1) {
    const match = labels[i];
    const abs = start + (match.index ?? 0);
    const nextAbs = i + 1 < labels.length ? start + (labels[i + 1].index ?? 0) : end;
    const label = match[2].toLowerCase() as 'pro' | 'con' | 'loe';
    parts.push({ kind: label, start: abs, end: nextAbs });
  }
  return parts;
}

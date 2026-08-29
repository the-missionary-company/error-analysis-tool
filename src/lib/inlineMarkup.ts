export type InlineToken =
  | {
      kind: 'text';
      start: number;
      end: number;
      display: string;
    }
  | {
      kind: 'link';
      start: number;
      end: number;
      display: string;
      href: string;
      labelStart: number;
      labelEnd: number;
    }
  | {
      kind: 'code';
      start: number;
      end: number;
      display: string;
    }
  | {
      kind: 'bold';
      start: number;
      end: number;
      display: string;
    }
  | {
      kind: 'italic';
      start: number;
      end: number;
      display: string;
    };

const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
const CODE_RE = /`([^`]+)`/g;
const BOLD_RE = /\*\*([^*]+)\*\*/g;

interface RawMatch {
  kind: 'link' | 'code' | 'bold' | 'italic';
  start: number;
  end: number;
  display: string;
  href?: string;
  labelStart?: number;
  labelEnd?: number;
}

export function parseInlineMarkup(text: string): InlineToken[] {
  if (!text) return [];
  const matches = collectMatches(text).sort((a, b) => a.start - b.start || a.end - b.end);
  const tokens: InlineToken[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.start < cursor) continue;
    if (match.start > cursor) {
      tokens.push({ kind: 'text', start: cursor, end: match.start, display: text.slice(cursor, match.start) });
    }
    if (match.kind === 'link' && match.href && match.labelStart != null && match.labelEnd != null) {
      tokens.push({
        kind: 'link',
        start: match.start,
        end: match.end,
        display: match.display,
        href: match.href,
        labelStart: match.labelStart,
        labelEnd: match.labelEnd,
      });
    } else if (match.kind === 'code') {
      tokens.push({ kind: 'code', start: match.start, end: match.end, display: match.display });
    } else if (match.kind === 'bold') {
      tokens.push({ kind: 'bold', start: match.start, end: match.end, display: match.display });
    } else if (match.kind === 'italic') {
      tokens.push({ kind: 'italic', start: match.start, end: match.end, display: match.display });
    }
    cursor = match.end;
  }
  if (cursor < text.length) {
    tokens.push({ kind: 'text', start: cursor, end: text.length, display: text.slice(cursor) });
  }
  return tokens;
}

function collectMatches(text: string): RawMatch[] {
  const found: RawMatch[] = [];
  for (const match of text.matchAll(new RegExp(LINK_RE.source, 'g'))) {
    const full = match[0];
    const label = match[1];
    const href = match[2];
    const start = match.index ?? 0;
    found.push({
      kind: 'link',
      start,
      end: start + full.length,
      display: label,
      href,
      labelStart: start + 1,
      labelEnd: start + 1 + label.length,
    });
  }
  for (const match of text.matchAll(new RegExp(CODE_RE.source, 'g'))) {
    const full = match[0];
    const inner = match[1];
    const start = match.index ?? 0;
    found.push({
      kind: 'code',
      start,
      end: start + full.length,
      display: inner,
    });
  }
  for (const match of text.matchAll(new RegExp(BOLD_RE.source, 'g'))) {
    const full = match[0];
    const inner = match[1];
    const start = match.index ?? 0;
    found.push({
      kind: 'bold',
      start,
      end: start + full.length,
      display: inner,
    });
  }
  const kept: RawMatch[] = [];
  for (const match of found.sort((a, b) => a.start - b.start || b.end - a.end)) {
    if (kept.some((prior) => rangesOverlap(prior.start, prior.end, match.start, match.end))) continue;
    kept.push(match);
  }
  const italic = /\*([^*\n]+)\*/g;
  let match: RegExpExecArray | null;
  while ((match = italic.exec(text))) {
    const start = match.index;
    const end = start + match[0].length;
    if (kept.some((prior) => rangesOverlap(prior.start, prior.end, start, end))) {
      italic.lastIndex = start + 1;
      continue;
    }
    if (text[start - 1] === '*' || text[end] === '*') {
      italic.lastIndex = start + 1;
      continue;
    }
    kept.push({ kind: 'italic', start, end, display: match[1] });
  }
  return kept.sort((a, b) => a.start - b.start || b.end - a.end);
}

function rangesOverlap(a0: number, a1: number, b0: number, b1: number): boolean {
  return a0 < b1 && b0 < a1;
}

export type MarkdownBlock =
  | {
      kind: 'heading';
      start: number;
      end: number;
      contentStart: number;
      contentEnd: number;
      level: 1 | 2 | 3 | 4 | 5 | 6;
    }
  | {
      kind: 'paragraph' | 'quote' | 'rule';
      start: number;
      end: number;
      contentStart: number;
      contentEnd: number;
    }
  | {
      kind: 'list-item';
      start: number;
      end: number;
      contentStart: number;
      contentEnd: number;
      list: 'ol' | 'ul';
    };

export type MarkdownGroup =
  | MarkdownBlock
  | { kind: 'list'; list: 'ol' | 'ul'; items: Extract<MarkdownBlock, { kind: 'list-item' }>[] };

const HEADING_LINE = /^(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/;
const UL_LINE = /^[ \t]{0,3}[-*+][ \t]+(.+)$/;
const OL_LINE = /^[ \t]{0,3}\d{1,3}\.[ \t]+(.+)$/;
const QUOTE_LINE = /^>[ \t]?(.*)$/;
const RULE_LINE = /^(?:\*\s*){3,}$|^(?:-\s*){3,}$|^(?:_\s*){3,}$/;

function lineSpans(text: string): { start: number; end: number; text: string }[] {
  if (!text) return [];
  const lines: { start: number; end: number; text: string }[] = [];
  let cursor = 0;
  while (cursor <= text.length) {
    const nl = text.indexOf('\n', cursor);
    if (nl < 0) {
      lines.push({ start: cursor, end: text.length, text: text.slice(cursor) });
      break;
    }
    lines.push({ start: cursor, end: nl, text: text.slice(cursor, nl) });
    cursor = nl + 1;
  }
  return lines;
}

function classifyLine(line: string):
  | { kind: 'blank' }
  | { kind: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; contentOffset: number; content: string }
  | { kind: 'list-item'; list: 'ol' | 'ul'; contentOffset: number; content: string }
  | { kind: 'quote'; contentOffset: number; content: string }
  | { kind: 'rule' }
  | { kind: 'paragraph' } {
  if (!line.trim()) return { kind: 'blank' };
  if (RULE_LINE.test(line.trim())) return { kind: 'rule' };
  const heading = line.match(HEADING_LINE);
  if (heading) {
    const pad = line.slice(heading[1].length).match(/^[ \t]+/)?.[0].length ?? 0;
    return {
      kind: 'heading',
      level: heading[1].length as 1 | 2 | 3 | 4 | 5 | 6,
      contentOffset: heading[1].length + pad,
      content: heading[2],
    };
  }
  const quote = line.match(QUOTE_LINE);
  if (quote) {
    return { kind: 'quote', contentOffset: line.length - quote[1].length, content: quote[1] };
  }
  const ol = line.match(OL_LINE);
  if (ol) {
    return { kind: 'list-item', list: 'ol', contentOffset: line.length - ol[1].length, content: ol[1] };
  }
  const ul = line.match(UL_LINE);
  if (ul) {
    return { kind: 'list-item', list: 'ul', contentOffset: line.length - ul[1].length, content: ul[1] };
  }
  return { kind: 'paragraph' };
}

export function splitMarkdownBlocks(text: string): MarkdownBlock[] {
  if (!text) return [];
  const lines = lineSpans(text);
  const blocks: MarkdownBlock[] = [];
  let paraStart: number | null = null;
  let paraEnd = 0;

  const flushPara = () => {
    if (paraStart == null) return;
    blocks.push({
      kind: 'paragraph',
      start: paraStart,
      end: paraEnd,
      contentStart: paraStart,
      contentEnd: paraEnd,
    });
    paraStart = null;
  };

  for (const line of lines) {
    const classified = classifyLine(line.text);
    if (classified.kind === 'blank') {
      flushPara();
      continue;
    }
    if (classified.kind === 'paragraph') {
      if (paraStart == null) paraStart = line.start;
      paraEnd = line.end;
      continue;
    }
    flushPara();
    if (classified.kind === 'rule') {
      blocks.push({
        kind: 'rule',
        start: line.start,
        end: line.end,
        contentStart: line.start,
        contentEnd: line.end,
      });
      continue;
    }
    if (classified.kind === 'heading') {
      blocks.push({
        kind: 'heading',
        start: line.start,
        end: line.end,
        contentStart: line.start + classified.contentOffset,
        contentEnd: line.start + classified.contentOffset + classified.content.length,
        level: classified.level,
      });
      continue;
    }
    if (classified.kind === 'quote') {
      blocks.push({
        kind: 'quote',
        start: line.start,
        end: line.end,
        contentStart: line.start + classified.contentOffset,
        contentEnd: line.end,
      });
      continue;
    }
    blocks.push({
      kind: 'list-item',
      start: line.start,
      end: line.end,
      contentStart: line.start + classified.contentOffset,
      contentEnd: line.end,
      list: classified.list,
    });
  }
  flushPara();
  return blocks.length ? blocks : [{ kind: 'paragraph', start: 0, end: text.length, contentStart: 0, contentEnd: text.length }];
}

export function groupMarkdownBlocks(blocks: MarkdownBlock[]): MarkdownGroup[] {
  const groups: MarkdownGroup[] = [];
  for (const block of blocks) {
    const prev = groups[groups.length - 1];
    if (
      block.kind === 'list-item' &&
      prev &&
      prev.kind === 'list' &&
      prev.list === block.list
    ) {
      prev.items.push(block);
      continue;
    }
    if (block.kind === 'list-item') {
      groups.push({ kind: 'list', list: block.list, items: [block] });
      continue;
    }
    groups.push(block);
  }
  return groups;
}

export function splitParagraphs(text: string): { start: number; end: number }[] {
  if (!text) return [];
  const parts: { start: number; end: number }[] = [];
  const re = /\n[ \t]*\n+/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    if (match.index > last) parts.push({ start: last, end: match.index });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ start: last, end: text.length });
  if (parts.length === 0) parts.push({ start: 0, end: text.length });
  return parts;
}

export function displayTextForRange(text: string, start: number, end: number): string {
  if (end <= start) return '';
  const from = Math.max(0, start);
  const to = Math.min(text.length, end);
  let out = '';
  for (const token of parseInlineMarkup(text)) {
    if (token.end <= from || token.start >= to) continue;
    if (token.kind === 'text') {
      const sliceStart = Math.max(from, token.start) - token.start;
      const sliceEnd = Math.min(to, token.end) - token.start;
      out += token.display.slice(sliceStart, sliceEnd);
      continue;
    }
    if (token.kind === 'link') {
      const labelFrom = Math.max(from, token.labelStart);
      const labelTo = Math.min(to, token.labelEnd);
      if (labelTo > labelFrom) {
        out += token.display.slice(labelFrom - token.labelStart, labelTo - token.labelStart);
      } else if (from <= token.start && to >= token.end) {
        out += token.display;
      } else if (rangesOverlap(from, to, token.start, token.end)) {
        out += token.display;
      }
      continue;
    }
    if (from <= token.start && to >= token.end) {
      out += token.display;
    } else if (rangesOverlap(from, to, token.start, token.end)) {
      out += token.display;
    }
  }
  return out;
}

export function tokensCovering(text: string, start: number, end: number): InlineToken[] {
  return parseInlineMarkup(text).filter((token) => token.end > start && token.start < end);
}

export function linkHrefLooksSafe(href: string): boolean {
  try {
    const url = new URL(href);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

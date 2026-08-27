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
    };

const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
const CODE_RE = /`([^`]+)`/g;
const BOLD_RE = /\*\*([^*]+)\*\*/g;

interface RawMatch {
  kind: 'link' | 'code' | 'bold';
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
  return kept;
}

function rangesOverlap(a0: number, a1: number, b0: number, b1: number): boolean {
  return a0 < b1 && b0 < a1;
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

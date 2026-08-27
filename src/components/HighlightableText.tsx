import type { ReactNode } from 'react';
import { useRef } from 'react';
import { applyBodySegments, type BodySegment } from '../lib/steers';
import { displayTextForRange, linkHrefLooksSafe, parseInlineMarkup, splitParagraphs } from '../lib/inlineMarkup';
import { hasOptionCards, parseOptionBlocks, type OptionPartKind } from '../lib/optionBlocks';
import { LANE_TONE } from '../lib/laneStyles';
import { rangeOffsetsInRoot } from '../lib/selection';
import { cn } from '../lib/utils';
import type { SteerHighlight, SteerRevision, SteerSection } from '../types/steers';

export interface PendingSpan {
  section: SteerSection;
  start: number;
  end: number;
  text: string;
  quote?: string;
  x: number;
  y: number;
}

interface Props {
  text: string;
  section: SteerSection;
  highlights: SteerHighlight[];
  revisions: SteerRevision[];
  onSelect: (span: PendingSpan) => void;
  onHighlightClick: (highlight: SteerHighlight) => void;
  onRevisionClick: (revision: SteerRevision) => void;
}

interface PositionedSegment extends BodySegment {
  start: number;
  end: number;
  after?: number;
}

function positionSegments(text: string, segments: BodySegment[]): PositionedSegment[] {
  let cursor = 0;
  return segments.map((segment) => {
    if (segment.role === 'replacement') {
      return { ...segment, start: -1, end: -1, after: cursor };
    }
    const start = cursor;
    const end = cursor + segment.text.length;
    cursor = end;
    if (text.slice(start, end) !== segment.text) {
      const idx = text.indexOf(segment.text, start);
      if (idx >= 0) {
        cursor = idx + segment.text.length;
        return { ...segment, start: idx, end: idx + segment.text.length };
      }
    }
    return { ...segment, start, end };
  });
}

function overlappingSegment(segments: PositionedSegment[], start: number, end: number): PositionedSegment | undefined {
  return segments.find((segment) => segment.role !== 'replacement' && segment.start < end && segment.end > start);
}

export function HighlightableText({
  text,
  section,
  highlights,
  revisions,
  onSelect,
  onHighlightClick,
  onRevisionClick,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scopedHighlights = highlights.filter((h) => h.section === section);
  const scopedRevisions = revisions.filter((r) => r.section === section);
  const segments = positionSegments(text, applyBodySegments(text, scopedHighlights, scopedRevisions));
  const useCards = hasOptionCards(text);

  const renderRange = (from: number, to: number, keyPrefix: string) =>
    renderSourceRange({
      text,
      from,
      to,
      segments,
      keyPrefix,
      onHighlightClick,
      onRevisionClick,
    });

  return (
    <div
      ref={rootRef}
      className="text-[15px] leading-[1.65] text-ink-800"
      onMouseUp={(event) => {
        const root = rootRef.current;
        const sel = window.getSelection();
        if (!root || !sel || sel.isCollapsed || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        const offsets = rangeOffsetsInRoot(root, range);
        if (!offsets) return;
        const sourceText = text.slice(offsets.start, offsets.end);
        if (!sourceText.trim()) return;
        onSelect({
          section,
          start: offsets.start,
          end: offsets.end,
          text: sourceText,
          quote: displayTextForRange(text, offsets.start, offsets.end) || offsets.text,
          x: event.clientX,
          y: event.clientY,
        });
      }}
    >
      {useCards
        ? parseOptionBlocks(text).map((block, blockIndex) => {
            const isChoice = block.parts.some((part) => part.kind !== 'lead');
            return (
              <div
                key={`opt-${blockIndex}`}
                className={
                  isChoice
                    ? 'mb-3 last:mb-0 rounded-xl border border-ink-200 bg-ink-50/70 p-3.5 shadow-sm'
                    : 'mb-3 last:mb-0'
                }
              >
                {block.parts.map((part, partIndex) => (
                  <div
                    key={`opt-${blockIndex}-${part.kind}-${partIndex}`}
                    className={cn('whitespace-pre-wrap', part.kind !== 'lead' && 'mt-2')}
                  >
                    {part.kind !== 'lead' && <PartBadge kind={part.kind} />}
                    {renderRange(
                      visiblePartStart(text, part.start, part.end, part.kind),
                      part.end,
                      `b${blockIndex}p${partIndex}`,
                    )}
                  </div>
                ))}
              </div>
            );
          })
        : splitParagraphs(text).map((para, index) => (
            <p key={`p-${index}`} className="mb-3 whitespace-pre-wrap last:mb-0">
              {renderRange(para.start, para.end, `p${index}`)}
            </p>
          ))}
    </div>
  );
}

function visiblePartStart(text: string, start: number, end: number, kind: OptionPartKind): number {
  if (kind === 'lead') return start;
  const slice = text.slice(start, end);
  const match = slice.match(/^\s*(Pro|Con|LOE):\s*/);
  return match ? start + match[0].length : start;
}

function PartBadge({ kind }: { kind: OptionPartKind }) {
  if (kind === 'lead') return null;
  const styles =
    kind === 'pro'
      ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
      : kind === 'con'
        ? 'bg-rose-50 text-rose-800 ring-rose-200'
        : 'bg-ink-100 text-ink-700 ring-ink-200';
  return (
    <span className={cn('mr-2 inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1', styles)}>
      {kind}
    </span>
  );
}

function ReplacementMark({
  segment,
  onRevisionClick,
}: {
  segment: PositionedSegment;
  onRevisionClick: (revision: SteerRevision) => void;
}) {
  return (
    <mark
      data-role="replacement"
      className="ml-1 cursor-pointer rounded-sm bg-emerald-100 px-0.5 text-emerald-950"
      title="Revision — new text"
      onClick={(event) => {
        event.stopPropagation();
        if (segment.revision) onRevisionClick(segment.revision);
      }}
    >
      {segment.text}
    </mark>
  );
}

function renderSourceRange({
  text,
  from,
  to,
  segments,
  keyPrefix,
  onHighlightClick,
  onRevisionClick,
}: {
  text: string;
  from: number;
  to: number;
  segments: PositionedSegment[];
  keyPrefix: string;
  onHighlightClick: (highlight: SteerHighlight) => void;
  onRevisionClick: (revision: SteerRevision) => void;
}): ReactNode {
  const nodes: ReactNode[] = [];
  const tokens = parseInlineMarkup(text);
  for (const token of tokens) {
    if (token.end <= from || token.start >= to) continue;
    if (token.kind === 'text') {
      const start = Math.max(from, token.start);
      const end = Math.min(to, token.end);
      if (end <= start) continue;
      nodes.push(
        ...renderPlainRuns({
          text,
          start,
          end,
          segments,
          keyPrefix: `${keyPrefix}-${start}`,
          onHighlightClick,
          onRevisionClick,
        }),
      );
      continue;
    }

    const overlap = overlappingSegment(segments, token.start, token.end);
    const displayStart = token.kind === 'link' ? token.labelStart : token.start + wrapperPrefix(token.kind);
    nodes.push(
      wrapRun({
        key: `${keyPrefix}-${token.kind}-${token.start}`,
        srcStart: displayStart,
        segment: overlap,
        onHighlightClick,
        onRevisionClick,
        children:
          token.kind === 'link' ? (
            <TicketLink href={token.href} label={token.display} srcStart={token.labelStart} />
          ) : token.kind === 'code' ? (
            <code className="rounded bg-ink-100 px-1 py-0.5 font-mono text-[13px] text-ink-900">{token.display}</code>
          ) : (
            <strong className="font-semibold text-ink-950">{token.display}</strong>
          ),
      }),
    );
    if (overlap?.role === 'struck' && token.end >= overlap.end) {
      nodes.push(
        ...replacementsAfter(segments, overlap.end, `${keyPrefix}-rep-${overlap.end}`, onRevisionClick),
      );
    }
  }
  return nodes;
}

function wrapperPrefix(kind: 'code' | 'bold'): number {
  return kind === 'code' ? 1 : 2;
}

function renderPlainRuns({
  text,
  start,
  end,
  segments,
  keyPrefix,
  onHighlightClick,
  onRevisionClick,
}: {
  text: string;
  start: number;
  end: number;
  segments: PositionedSegment[];
  keyPrefix: string;
  onHighlightClick: (highlight: SteerHighlight) => void;
  onRevisionClick: (revision: SteerRevision) => void;
}): ReactNode[] {
  const hits = segments
    .filter((segment) => segment.role !== 'replacement' && segment.start < end && segment.end > start)
    .sort((a, b) => a.start - b.start);
  const nodes: ReactNode[] = [];
  let cursor = start;
  for (const segment of hits) {
    const from = Math.max(cursor, segment.start);
    const to = Math.min(end, segment.end);
    if (from > cursor) {
      nodes.push(
        <MappedText key={`${keyPrefix}-t-${cursor}`} srcStart={cursor} text={text.slice(cursor, from)} />,
      );
    }
    if (to > from) {
      nodes.push(
        wrapRun({
          key: `${keyPrefix}-s-${from}`,
          srcStart: from,
          segment,
          onHighlightClick,
          onRevisionClick,
          children: text.slice(from, to),
        }),
      );
      if (segment.role === 'struck' && to >= segment.end) {
        nodes.push(...replacementsAfter(segments, segment.end, `${keyPrefix}-rep-${segment.end}`, onRevisionClick));
      }
    }
    cursor = Math.max(cursor, to);
  }
  if (cursor < end) {
    nodes.push(<MappedText key={`${keyPrefix}-t-${cursor}`} srcStart={cursor} text={text.slice(cursor, end)} />);
  }
  return nodes;
}

function replacementsAfter(
  segments: PositionedSegment[],
  sourceEnd: number,
  keyPrefix: string,
  onRevisionClick: (revision: SteerRevision) => void,
): ReactNode[] {
  return segments
    .filter((segment) => segment.role === 'replacement' && segment.after === sourceEnd)
    .map((segment, i) => (
      <ReplacementMark key={`${keyPrefix}-${i}`} segment={segment} onRevisionClick={onRevisionClick} />
    ));
}

function MappedText({ srcStart, text }: { srcStart: number; text: string }) {
  return <span data-src-start={srcStart}>{text}</span>;
}

function wrapRun({
  key,
  srcStart,
  segment,
  children,
  onHighlightClick,
  onRevisionClick,
}: {
  key: string;
  srcStart: number;
  segment?: PositionedSegment;
  children: ReactNode;
  onHighlightClick: (highlight: SteerHighlight) => void;
  onRevisionClick: (revision: SteerRevision) => void;
}): ReactNode {
  if (segment?.role === 'struck') {
    return (
      <s
        key={key}
        data-src-start={srcStart}
        className="mr-1 rounded-sm bg-fail-soft px-0.5 text-ink-500 decoration-ink-700"
        title="Previous text — not deleted"
        onClick={(event) => {
          event.stopPropagation();
          if (segment.revision) onRevisionClick(segment.revision);
        }}
      >
        {children}
      </s>
    );
  }
  if (segment?.highlight) {
    return (
      <mark
        key={key}
        data-src-start={srcStart}
        data-highlight-id={segment.highlight.id}
        data-lane={segment.highlight.lane}
        className={cn(
          'cursor-pointer rounded-sm px-0.5 underline decoration-dotted underline-offset-2',
          LANE_TONE[segment.highlight.lane].mark,
        )}
        title={
          segment.highlight.lane === 'content' ? 'Content / understanding' : 'Action / tech lead'
        }
        onClick={(event) => {
          event.stopPropagation();
          onHighlightClick(segment.highlight!);
        }}
      >
        {children}
      </mark>
    );
  }
  return (
    <span key={key} data-src-start={srcStart}>
      {children}
    </span>
  );
}

function TicketLink({ href, label, srcStart }: { href: string; label: string; srcStart: number }) {
  if (!linkHrefLooksSafe(href)) {
    return <span data-src-start={srcStart}>{label}</span>;
  }
  const linear = /linear\.app\/.+\/issue\//i.test(href);
  const github = /github\.com\/.+\/(issues|pull)\//i.test(href);
  return (
    <a
      href={href}
      data-src-start={srcStart}
      target="_blank"
      rel="noreferrer"
      className={cn(
        'mx-0.5 inline-flex translate-y-px items-center rounded-md px-1.5 py-0.5 text-[13px] font-medium no-underline ring-1 transition',
        linear
          ? 'bg-violet-50 text-violet-900 ring-violet-200 hover:bg-violet-100'
          : github
            ? 'bg-ink-100 text-ink-900 ring-ink-200 hover:bg-ink-200'
            : 'bg-sky-50 text-sky-900 ring-sky-200 hover:bg-sky-100',
      )}
      onClick={(event) => event.stopPropagation()}
    >
      {label}
    </a>
  );
}

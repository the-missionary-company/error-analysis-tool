import { useRef } from 'react';
import { applyHighlightSegments, LANE_DEFS } from '../lib/steers';
import { rangeOffsetsInRoot } from '../lib/selection';
import { cn } from '../lib/utils';
import type { ScoreLane, SteerHighlight, SteerSection } from '../types/steers';

export interface PendingSpan {
  section: SteerSection;
  start: number;
  end: number;
  text: string;
  x: number;
  y: number;
}

interface Props {
  text: string;
  section: SteerSection;
  highlights: SteerHighlight[];
  onSelect: (span: PendingSpan) => void;
  onHighlightClick: (highlight: SteerHighlight) => void;
}

function laneClass(lane: ScoreLane, passFail: SteerHighlight['passFail']) {
  if (passFail === 'fail') {
    return lane === 'action' ? 'bg-red-100 text-red-950 decoration-red-400' : 'bg-amber-100 text-amber-950 decoration-amber-400';
  }
  if (passFail === 'pass') {
    return lane === 'action' ? 'bg-emerald-100 text-emerald-950 decoration-emerald-400' : 'bg-sky-100 text-sky-950 decoration-sky-400';
  }
  return 'bg-ink-100 text-ink-900 decoration-ink-300';
}

export function HighlightableText({
  text,
  section,
  highlights,
  onSelect,
  onHighlightClick,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scoped = highlights.filter((h) => h.section === section);
  const segments = applyHighlightSegments(text, scoped);

  return (
    <div
      ref={rootRef}
      className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink-800"
      onMouseUp={(event) => {
        const root = rootRef.current;
        const sel = window.getSelection();
        if (!root || !sel || sel.isCollapsed || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        const offsets = rangeOffsetsInRoot(root, range);
        if (!offsets) return;
        if (text.slice(offsets.start, offsets.end) !== offsets.text) {
          const idx = text.indexOf(offsets.text);
          if (idx < 0) return;
          offsets.start = idx;
          offsets.end = idx + offsets.text.length;
        }
        onSelect({
          section,
          start: offsets.start,
          end: offsets.end,
          text: offsets.text,
          x: event.clientX,
          y: event.clientY,
        });
      }}
    >
      {segments.map((segment, i) =>
        segment.highlight ? (
          <mark
            key={`${segment.highlight.id}-${i}`}
            className={cn(
              'cursor-pointer rounded-sm px-0.5 decoration-clone underline decoration-dotted underline-offset-2',
              laneClass(segment.highlight.lane, segment.highlight.passFail),
            )}
            title={`${LANE_DEFS[segment.highlight.lane].title} ${segment.highlight.passFail ?? 'unscored'}`}
            onClick={(event) => {
              event.stopPropagation();
              onHighlightClick(segment.highlight!);
            }}
          >
            {segment.text}
          </mark>
        ) : (
          <span key={`t-${i}`}>{segment.text}</span>
        ),
      )}
    </div>
  );
}

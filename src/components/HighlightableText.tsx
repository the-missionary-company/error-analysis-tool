import { useRef } from 'react';
import { applyBodySegments } from '../lib/steers';
import { rangeOffsetsInRoot } from '../lib/selection';
import type { SteerHighlight, SteerRevision, SteerSection } from '../types/steers';

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
  revisions: SteerRevision[];
  onSelect: (span: PendingSpan) => void;
  onHighlightClick: (highlight: SteerHighlight) => void;
  onRevisionClick: (revision: SteerRevision) => void;
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
  const segments = applyBodySegments(text, scopedHighlights, scopedRevisions);

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
      {segments.map((segment, i) => {
        if (segment.role === 'struck') {
          return (
            <s
              key={`s-${i}`}
              className="mr-1 rounded-sm bg-fail-soft px-0.5 text-ink-500 decoration-ink-700"
              title="Previous text — not deleted"
              onClick={(event) => {
                event.stopPropagation();
                if (segment.revision) onRevisionClick(segment.revision);
              }}
            >
              {segment.text}
            </s>
          );
        }
        if (segment.role === 'replacement') {
          return (
            <mark
              key={`r-${i}`}
              data-role="replacement"
              className="cursor-pointer rounded-sm bg-emerald-100 px-0.5 text-emerald-950"
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
        if (segment.highlight) {
          return (
            <mark
              key={`${segment.highlight.id}-${i}`}
              className="cursor-pointer rounded-sm bg-sky-100 px-0.5 text-sky-950 underline decoration-dotted underline-offset-2"
              title="Highlighted span"
              onClick={(event) => {
                event.stopPropagation();
                onHighlightClick(segment.highlight!);
              }}
            >
              {segment.text}
            </mark>
          );
        }
        return <span key={`t-${i}`}>{segment.text}</span>;
      })}
    </div>
  );
}

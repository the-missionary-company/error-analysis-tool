import { ChevronDown, CircleHelp } from 'lucide-react';
import { useId, useState } from 'react';
import { cn } from '../lib/utils';

export function HowThisWorks() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <>
      <button
        type="button"
        className="btn-ghost h-8 gap-1.5 px-2 text-xs text-ink-500"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <CircleHelp className="h-3.5 w-3.5" />
        How this works
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <section id={panelId} className="card w-full basis-full p-4">
          <h2 className="text-sm font-semibold text-ink-950">How this board works</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-600">
            There is no Process button. Scores and comments save as you go. Pass/Fail the two
            scores. Highlight a span when you want Oscar to change something now, or when you are
            collecting a pattern for later. Broader analysis waits until you have a pile — it does
            not run from this board yet.
          </p>
          <ol className="mt-4 max-w-3xl list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-ink-700">
            <li>
              Open a case, or press <kbd className="kbd">n</kbd> for the next one that is not fully
              scored.
            </li>
            <li>
              Read Background → Problem → Options → Choice. Mark <strong>Pass</strong> or{' '}
              <strong>Fail</strong> on <strong>Content / understanding</strong> and on{' '}
              <strong>Action / tech lead</strong>. They are independent.
            </li>
            <li>
              Highlight a sentence. In the popover, pick Content (blue) or Action (amber). Type the
              note. Press <kbd className="kbd">Enter</kbd>. The card appears to the right of that
              span.
            </li>
            <li>
              <strong>Change this right away:</strong> write it on the span. Oscar can act on that
              one note. You do not wait for fifty cases.
            </li>
            <li>
              <strong>Broader pattern:</strong> keep scoring. After a pile of scored cases and
              comments, Oscar can look for repeated misses and later build an eval skill. Nothing
              auto-clusters from your notes today.
            </li>
            <li>
              Export JSON when you want a backup or to hand Oscar the board. Import only to restore
              a file.
            </li>
          </ol>
        </section>
      )}
    </>
  );
}

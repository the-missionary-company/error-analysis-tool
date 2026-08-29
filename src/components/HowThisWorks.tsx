import { useState } from 'react';

export function HowThisWorks() {
  const [open, setOpen] = useState(false);

  return (
    <section className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink-950">How this board works</h2>
          <p className="mt-1 hidden max-w-3xl text-sm leading-relaxed text-ink-600 sm:block">
            There is no Process button. Scores and comments save as you go. Pass/Fail the two
            scores. Highlight a span when you want Oscar to change something now, or when you are
            collecting a pattern for later. Broader analysis waits until you have a pile — it does
            not run from this board yet.
          </p>
        </div>
        <button type="button" className="btn-secondary h-9 shrink-0 px-3 text-xs" onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide steps' : 'What do I do?'}
        </button>
      </div>
      {open && (
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
            <strong>Change this right away:</strong> write it on the span. Oscar can act on that one
            note. You do not wait for fifty cases.
          </li>
          <li>
            <strong>Broader pattern:</strong> keep scoring. After a pile of scored cases and
            comments, Oscar can look for repeated misses and later build an eval skill. Nothing
            auto-clusters from your notes today.
          </li>
          <li>
            Export JSON when you want a backup or to hand Oscar the board. Import only to restore a
            file.
          </li>
        </ol>
      )}
    </section>
  );
}

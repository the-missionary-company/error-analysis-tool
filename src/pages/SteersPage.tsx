import { useEffect, useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { SteerCaseView } from '../components/SteerCaseView';
import { SteerHighlightPopover } from '../components/SteerHighlightPopover';
import { SteerScorePanel } from '../components/SteerScorePanel';
import type { PendingSpan } from '../components/HighlightableText';
import { useSteers } from '../hooks/useSteers';
import { useToast } from '../hooks/useToast';
import { downloadText } from '../lib/storage';
import { newHighlightId, parseSteerPayload, parseSteerReviews, reviewIsEmpty } from '../lib/steers';
import { cn } from '../lib/utils';
import type { LaneScore, ScoreLane, SteerChipId, SteerHighlight } from '../types/steers';

export function SteersPage() {
  const {
    cases,
    reviews,
    activeCase,
    activeReview,
    activeId,
    setActiveId,
    persistReview,
    importCases,
    importReviews,
    exportBoard,
  } = useSteers();
  const { push } = useToast();
  const [pending, setPending] = useState<PendingSpan | null>(null);
  const casesInput = useRef<HTMLInputElement>(null);
  const labelsInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPending(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!activeCase) {
    return (
      <div className="card px-6 py-12 text-center text-sm text-ink-500">
        No steer cases. Load a JSON file from Oscar to get started.
      </div>
    );
  }

  const updateReview = (next: typeof activeReview) => {
    persistReview(next);
  };

  const onLaneChange = (lane: ScoreLane, score: LaneScore) => {
    updateReview({ ...activeReview, [lane]: score });
  };

  const onToggleChip = (chip: SteerChipId) => {
    const chips = activeReview.chips.includes(chip)
      ? activeReview.chips.filter((c) => c !== chip)
      : [...activeReview.chips, chip];
    updateReview({ ...activeReview, chips });
  };

  const onRemoveHighlight = (id: string) => {
    updateReview({
      ...activeReview,
      highlights: activeReview.highlights.filter((h) => h.id !== id),
    });
  };

  const addHighlight = (input: {
    lane: ScoreLane;
    passFail: SteerHighlight['passFail'];
    comment: string;
  }) => {
    if (!pending) return;
    const highlight: SteerHighlight = {
      id: newHighlightId(),
      section: pending.section,
      start: pending.start,
      end: pending.end,
      text: pending.text,
      lane: input.lane,
      passFail: input.passFail,
      comment: input.comment,
    };
    updateReview({
      ...activeReview,
      highlights: [...activeReview.highlights, highlight],
    });
    setPending(null);
    window.getSelection()?.removeAllRanges();
    push('Highlight saved', 'success');
  };

  const readFile = async (file: File) => JSON.parse(await file.text()) as unknown;

  return (
    <div className="space-y-5">
      <section className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
          Oscar Vorflux steers
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
          Same case, two independent scores. Content is whether the write-up closed the
          understanding gap. Action is whether Oscar did the right thing. Do not collapse
          them into one Pass/Fail. Labels persist in this browser and in the JSON you export.
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-secondary" onClick={() => casesInput.current?.click()}>
          <Upload className="h-4 w-4" />
          Load cases
        </button>
        <button type="button" className="btn-secondary" onClick={() => labelsInput.current?.click()}>
          <Upload className="h-4 w-4" />
          Import labels
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            downloadText('oscar-steer-board.json', exportBoard());
            push('Board exported', 'success');
          }}
        >
          <Download className="h-4 w-4" />
          Export JSON
        </button>
        <input
          ref={casesInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
                try {
                  const parsed = await readFile(file);
                  const { cases, reviews: incomingReviews } = parseSteerPayload(parsed);
                  if (incomingReviews.length) importReviews(incomingReviews);
                  if (cases.length) {
                    const next = importCases(cases);
                    if (!next.find((c) => c.id === activeId) && next[0]) setActiveId(next[0].id);
                  }
                  const parts = [
                    cases.length ? `${cases.length} case${cases.length === 1 ? '' : 's'}` : null,
                    incomingReviews.length
                      ? `${incomingReviews.length} labeled case${incomingReviews.length === 1 ? '' : 's'}`
                      : null,
                  ].filter(Boolean);
                  push(`Loaded ${parts.join(' and ')}`, 'success');
                } catch (err) {
              push(err instanceof Error ? err.message : 'Import failed', 'error');
            }
          }}
        />
        <input
          ref={labelsInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            try {
              const parsed = await readFile(file);
              const list = parseSteerReviews(parsed);
              if (!list.length) throw new Error('No labels in file');
              importReviews(list);
              push(`Restored ${list.length} labeled case${list.length === 1 ? '' : 's'}`, 'success');
            } catch (err) {
              push(err instanceof Error ? err.message : 'Import failed', 'error');
            }
          }}
        />
        <a
          href={`${import.meta.env.BASE_URL}sample-steer-cases.json`}
          className="text-xs text-accent hover:underline"
        >
          Case JSON shape
        </a>
        <span className="text-xs text-ink-500">
          localStorage + JSON · empty scores until you mark them
        </span>
      </div>

      {cases.length > 1 && (
        <nav className="flex flex-wrap gap-2">
          {cases.map((item) => {
            const review = reviews[item.id];
            const scored = review && !reviewIsEmpty(review);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveId(item.id)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-left text-sm transition',
                  item.id === activeId
                    ? 'border-accent bg-accent-soft text-ink-950'
                    : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-50',
                )}
              >
                <span className="block max-w-[220px] truncate font-medium">{item.title}</span>
                <span className="text-[11px] text-ink-400">
                  {item.stamp} · {scored ? 'labeled' : 'unscored'}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      <div className="rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-sm text-sky-950">
        Highlight a span in the steer, then mark <strong>Content</strong> or{' '}
        <strong>Action</strong> — or score the whole case on the right. A Content Fail is a
        question for the next write-up. An Action Fail is a living instruction.
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <SteerCaseView
          steer={activeCase}
          highlights={activeReview.highlights}
          onSelect={setPending}
          onHighlightClick={() => setPending(null)}
        />
        <SteerScorePanel
          review={activeReview}
          onLaneChange={onLaneChange}
          onToggleChip={onToggleChip}
          onRemoveHighlight={onRemoveHighlight}
          onFocusHighlight={() => setPending(null)}
        />
      </div>

      {pending && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-ink-950/10"
            aria-label="Dismiss highlight popover"
            onClick={() => setPending(null)}
          />
          <SteerHighlightPopover
            span={pending}
            onCancel={() => setPending(null)}
            onSave={addHighlight}
          />
        </>
      )}
    </div>
  );
}

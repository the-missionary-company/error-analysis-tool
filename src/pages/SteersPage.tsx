import { useEffect, useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { GutterNotes } from '../components/GutterNotes';
import { HowThisWorks } from '../components/HowThisWorks';
import { SpanNoteComposer } from '../components/SpanNoteComposer';
import { SteerCaseQueue } from '../components/SteerCaseQueue';
import { SteerCaseView } from '../components/SteerCaseView';
import { SteerScorePanel } from '../components/SteerScorePanel';
import type { PendingSpan } from '../components/HighlightableText';
import { useSteers } from '../hooks/useSteers';
import { useToast } from '../hooks/useToast';
import { loadAuthor, loadCaseSort, saveAuthor, saveCaseSort } from '../lib/steerStorage';
import { shouldAutoScrollToComment } from '../lib/gutterScroll';
import { downloadText } from '../lib/storage';
import {
  AUTHOR_DEFS,
  addThreadReply,
  attachSpanNotes,
  caseProgress,
  createRevisionFromQuestion,
  parseSteerPayload,
  parseSteerReviews,
  sortCases,
  usedLabelsForLane,
} from '../lib/steers';
import type { CaseSort } from '../types/steers';
import { cn } from '../lib/utils';
import type { Author, LaneScore, NoteKind, ScoreLane } from '../types/steers';

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
  const [sort, setSort] = useState<CaseSort>(() => loadCaseSort());
  const [author, setAuthor] = useState<Author>(() => loadAuthor());
  const orderedCases = sortCases(cases, sort);
  const [focusedNoteId, setFocusedNoteId] = useState<string | null>(null);
  const casesInput = useRef<HTMLInputElement>(null);
  const labelsInput = useRef<HTMLInputElement>(null);
  const caseBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.querySelector(`[data-case-id="${activeId}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [activeId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        if (e.key === 'Escape') setPending(null);
        return;
      }
      if (e.key === 'Escape') {
        setPending(null);
        return;
      }
      const ids = orderedCases.map((item) => item.id);
      const index = ids.indexOf(activeId);
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = ids[Math.min(ids.length - 1, index + 1)];
        if (next) setActiveId(next);
      }
      if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = ids[Math.max(0, index - 1)];
        if (prev) setActiveId(prev);
      }
      if (e.key === 'n') {
        e.preventDefault();
        const open = ids.filter((id) => caseProgress(reviews[id]) !== 'scored');
        if (!open.length) return;
        const from = open.find((id) => ids.indexOf(id) > index) ?? open[0];
        setActiveId(from);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeId, orderedCases, reviews, setActiveId]);

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

  const onRemoveHighlight = (id: string) => {
    updateReview({
      ...activeReview,
      highlights: activeReview.highlights.filter((h) => h.id !== id),
      notes: activeReview.notes.filter((note) => note.highlightId !== id),
    });
  };

  const focusNote = (noteId: string, opts?: { scroll?: boolean }) => {
    setFocusedNoteId(noteId);
    if (opts?.scroll === false || !shouldAutoScrollToComment()) return;
    window.setTimeout(() => {
      document.getElementById(`note-${noteId}`)?.scrollIntoView({ block: 'nearest' });
    }, 0);
  };

  const addHighlight = (input: {
    content?: { kind: NoteKind; text: string };
    action?: { kind: NoteKind; text: string };
  }) => {
    if (!pending) return;
    const next = attachSpanNotes({
      review: activeReview,
      span: pending,
      author,
      content: input.content,
      action: input.action,
    });
    const scrollY = window.scrollY;
    updateReview(next);
    const added = next.notes[next.notes.length - 1];
    if (added) focusNote(added.id, { scroll: false });
    setPending(null);
    window.getSelection()?.removeAllRanges();
    requestAnimationFrame(() => window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' }));
    push('Comment saved next to the span', 'success');
  };

  const readFile = async (file: File) => JSON.parse(await file.text()) as unknown;

  return (
    <div className="space-y-5">
      <section className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
          Eval dashboard
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
          Score each case, then keep going. There is no Process button. A span comment is enough
          when something should change now. Broader patterns wait for a pile of scored cases.
        </p>
      </section>
      <HowThisWorks />

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
        <span className="ml-auto flex items-center gap-2 text-xs text-ink-500">
          Posting as
          <span className="inline-flex rounded-lg border border-ink-200 bg-white p-0.5">
            {(['sam', 'oscar'] as const).map((who) => (
              <button
                key={who}
                type="button"
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs',
                  author === who ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-50',
                )}
                onClick={() => {
                  setAuthor(who);
                  saveAuthor(who);
                }}
              >
                {AUTHOR_DEFS[who].label}
              </button>
            ))}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]">
        <div className="min-w-0">
        <SteerCaseQueue
          cases={orderedCases}
          reviews={reviews}
          activeId={activeId}
          sort={sort}
          onSortChange={(next) => {
            setSort(next);
            saveCaseSort(next);
          }}
          onSelect={(id) => {
            setActiveId(id);
            setPending(null);
          }}
        />
        </div>
        <div className="min-w-0 space-y-4">
        <SteerScorePanel
          review={activeReview}
          reuseByLane={{
            content: usedLabelsForLane(Object.values(reviews), 'content'),
            action: usedLabelsForLane(Object.values(reviews), 'action'),
          }}
          onLaneChange={onLaneChange}
        />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div ref={caseBodyRef} className="min-w-0">
            <SteerCaseView
              steer={activeCase}
              highlights={activeReview.highlights}
              notes={activeReview.notes}
              revisions={activeReview.revisions}
              onSelect={(span) => {
                setPending(span);
                window.getSelection()?.removeAllRanges();
              }}
              onHighlightClick={(highlight) => {
                const note = activeReview.notes.find((item) => item.highlightId === highlight.id);
                if (note) focusNote(note.id);
                setPending(null);
              }}
              onRevisionClick={(revision) => {
                focusNote(revision.questionId);
                setPending(null);
              }}
            />
          </div>
          <GutterNotes
            review={activeReview}
            author={author}
            focusedNoteId={focusedNoteId}
            onFocus={focusNote}
            onChangeNotes={(notes) => updateReview({ ...activeReview, notes })}
            onRemoveHighlight={onRemoveHighlight}
            onEnrich={(note, newText) => {
              if (!note.section) return;
              const revision = createRevisionFromQuestion(note, newText, activeCase[note.section]);
              const threaded = addThreadReply(
                note,
                'oscar',
                `Updated the steer: struck “${revision.oldText}” and added “${revision.newText}”.`,
              );
              updateReview({
                ...activeReview,
                notes: activeReview.notes.map((item) => (item.id === note.id ? threaded : item)),
                revisions: [...activeReview.revisions, revision],
              });
              push('Visible revision applied', 'success');
            }}
          />
        </div>
        </div>
      </div>
      {pending && (
        <SpanNoteComposer
          span={pending}
          onCancel={() => setPending(null)}
          onSave={addHighlight}
        />
      )}

    </div>
  );
}

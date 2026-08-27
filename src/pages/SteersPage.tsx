import { useEffect, useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { SteerCaseView } from '../components/SteerCaseView';
import { SteerHighlightPopover } from '../components/SteerHighlightPopover';
import { SteerScorePanel } from '../components/SteerScorePanel';
import { SteerThreads } from '../components/SteerThreads';
import type { PendingSpan } from '../components/HighlightableText';
import { useSteers } from '../hooks/useSteers';
import { useToast } from '../hooks/useToast';
import { loadAuthor, saveAuthor } from '../lib/steerStorage';
import { downloadText } from '../lib/storage';
import {
  AUTHOR_DEFS,
  addThreadReply,
  createRevisionFromQuestion,
  newHighlightId,
  newId,
  parseSteerPayload,
  parseSteerReviews,
  reviewIsEmpty,
  usedLabelsForLane,
} from '../lib/steers';
import { cn } from '../lib/utils';
import type { Author, LaneScore, NoteKind, PassFail, ScoreLane, SteerNote } from '../types/steers';

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
  const [author, setAuthor] = useState<Author>(() => loadAuthor());
  const [focusedNoteId, setFocusedNoteId] = useState<string | null>(null);
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

  const onRemoveHighlight = (id: string) => {
    updateReview({
      ...activeReview,
      highlights: activeReview.highlights.filter((h) => h.id !== id),
    });
  };

  const focusNote = (noteId: string) => {
    setFocusedNoteId(noteId);
    window.setTimeout(() => {
      document.getElementById(`note-${noteId}`)?.scrollIntoView({ block: 'nearest' });
    }, 0);
  };

  const addHighlight = (input: {
    lane: ScoreLane;
    passFail: PassFail;
    kind: NoteKind;
    text: string;
  }) => {
    if (!pending) return;
    const highlightId = newHighlightId();
    const highlight = {
      id: highlightId,
      section: pending.section,
      start: pending.start,
      end: pending.end,
      text: pending.text,
      lane: input.lane,
      passFail: input.passFail,
      comment: input.text,
    };
    const notes = [...activeReview.notes];
    if (input.text) {
      const note: SteerNote = {
        id: newId('n'),
        kind: input.kind,
        lane: input.lane,
        author,
        text: input.text,
        createdAt: new Date().toISOString(),
        replies: [],
        highlightId,
        section: pending.section,
        start: pending.start,
        end: pending.end,
        spanText: pending.text,
      };
      notes.push(note);
      focusNote(note.id);
    }
    updateReview({
      ...activeReview,
      highlights: [...activeReview.highlights, highlight],
      notes,
    });
    setPending(null);
    window.getSelection()?.removeAllRanges();
    push(input.kind === 'question' ? 'Question attached to span' : 'Highlight saved', 'success');
  };

  const readFile = async (file: File) => JSON.parse(await file.text()) as unknown;

  return (
    <div className="space-y-5">
      <section className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
          Eval dashboard
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
          Same case, two independent scores. <strong>Content / understanding</strong> is how
          Oscar sent the message: did Sam understand the write-up, and did he understand what
          the agents are doing? <strong>Action / tech lead</strong> is how Oscar acted as the
          tech lead. Pass one and Fail the other if that is what happened. Do not share one
          Pass/Fail across both. Each score has its own labels so cases can be differentiated.
          Labels persist in this browser and in the JSON you export.
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
        Highlight a span, then leave a <strong>comment</strong> (a note) or a{' '}
        <strong>question</strong> (a thread). Questions stay on that span. Oscar replies in the
        thread, or updates the steer with a visible revision: old text is struck, new text is
        highlighted. Each score still has its own Pass or Fail, labels, and comment.
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <SteerCaseView
          steer={activeCase}
          highlights={activeReview.highlights}
          revisions={activeReview.revisions}
          onSelect={setPending}
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
        <div className="space-y-4">
        <SteerScorePanel
          review={activeReview}
          reuseByLane={{
            content: usedLabelsForLane(Object.values(reviews), 'content'),
            action: usedLabelsForLane(Object.values(reviews), 'action'),
          }}
          onLaneChange={onLaneChange}
          onRemoveHighlight={onRemoveHighlight}
          onFocusHighlight={(highlight) => {
            const note = activeReview.notes.find((item) => item.highlightId === highlight.id);
            if (note) focusNote(note.id);
          }}
        />
        <SteerThreads
          review={activeReview}
          author={author}
          focusedNoteId={focusedNoteId}
          onChangeNotes={(notes) => updateReview({ ...activeReview, notes })}
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
            authorLabel={AUTHOR_DEFS[author].label}
            onCancel={() => setPending(null)}
            onSave={addHighlight}
          />
        </>
      )}
    </div>
  );
}

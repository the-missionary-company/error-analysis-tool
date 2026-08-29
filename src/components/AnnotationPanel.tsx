import { Save } from 'lucide-react';
import type { Annotation, Judgment } from '../types';
import { cn, isMac } from '../lib/utils';

interface Props {
  judgment: Judgment;
  note: string;
  saved?: Annotation | null;
  onJudgment: (j: Judgment) => void;
  onNote: (note: string) => void;
  onSave: () => void;
  dirty: boolean;
}

export function AnnotationPanel({
  judgment,
  note,
  saved,
  onJudgment,
  onNote,
  onSave,
  dirty,
}: Props) {
  const mod = isMac() ? '⌘' : 'Ctrl';

  return (
    <aside className="card sticky top-[4.5rem] flex flex-col gap-4 p-4 lg:max-h-[calc(100vh-6rem)]">
      <div>
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">
          Annotation
        </div>
        <p className="text-sm text-ink-600">
          Binary only. Free-form note first — categories come later.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className={cn(
            'btn-pass h-11 text-base',
            judgment === 'pass' && 'ring-2 ring-pass ring-offset-1',
          )}
          onClick={() => onJudgment('pass')}
        >
          Pass <span className="kbd ml-1">1</span>
        </button>
        <button
          type="button"
          className={cn(
            'btn-fail h-11 text-base',
            judgment === 'fail' && 'ring-2 ring-fail ring-offset-1',
          )}
          onClick={() => onJudgment('fail')}
        >
          Fail <span className="kbd ml-1">2</span>
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <label className="text-xs font-medium text-ink-500" htmlFor="note">
          What&apos;s wrong? (or why it passes — optional)
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => onNote(e.target.value)}
          placeholder="Smoking-gun observation… e.g. “Answer says approved but citation says revise & resubmit.”"
          className="min-h-[140px] flex-1 resize-y rounded-lg border border-ink-200 bg-ink-50/50 px-3 py-2.5 text-sm leading-relaxed text-ink-900 placeholder:text-ink-400 focus:border-accent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <button type="button" className="btn-primary w-full" onClick={onSave} disabled={!dirty && !!saved}>
        <Save className="h-4 w-4" />
        Save
        <span className="kbd bg-white/20 text-white border-white/30">{mod}+S</span>
      </button>

      {saved?.judgment && (
        <p className="text-xs text-ink-500">
          Last saved:{' '}
          <span
            className={cn(
              'font-medium',
              saved.judgment === 'pass' ? 'text-pass' : 'text-fail',
            )}
          >
            {saved.judgment.toUpperCase()}
          </span>
          {dirty && <span className="ml-2 text-amber-600">· unsaved edits</span>}
        </p>
      )}
    </aside>
  );
}

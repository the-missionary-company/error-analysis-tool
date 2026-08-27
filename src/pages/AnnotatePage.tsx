import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Download,
  HelpCircle,
  Keyboard,
  SkipForward,
  Upload,
} from 'lucide-react';
import { useDatasetSession } from '../hooks/useDataset';
import { useHotkeys } from '../hooks/useHotkeys';
import { useToast } from '../hooks/useToast';
import { AnnotationPanel } from '../components/AnnotationPanel';
import { GuidanceStrip } from '../components/GuidanceStrip';
import { HotkeyCheatsheet } from '../components/HotkeyCheatsheet';
import { HubTraceView } from '../components/HubTraceView';
import { A1TraceView } from '../components/A1TraceView';
import { NotesTable } from '../components/NotesTable';
import { ProgressBar } from '../components/ProgressBar';
import {
  downloadText,
  exportAnnotationsJSON,
} from '../lib/storage';
import { progressStats } from '../lib/utils';
import type { Annotation, Judgment } from '../types';

export function AnnotatePage() {
  const { datasetId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { dataset, annotations, upsertAnnotation, importAnnotations } = useDatasetSession(datasetId);
  const { push } = useToast();
  const [index, setIndex] = useState(0);
  const [judgment, setJudgment] = useState<Judgment>(null);
  const [note, setNote] = useState('');
  const [cheatsheet, setCheatsheet] = useState(false);

  const traces = dataset?.traces ?? [];
  const trace = traces[index];
  const saved = trace ? annotations[trace.id] : null;

  useEffect(() => {
    const q = searchParams.get('trace');
    if (!q || !traces.length) return;
    const i = traces.findIndex((t) => t.id === q);
    if (i >= 0) setIndex(i);
    searchParams.delete('trace');
    setSearchParams(searchParams, { replace: true });
  }, [datasetId, traces.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!trace) return;
    setJudgment(saved?.judgment ?? null);
    setNote(saved?.note ?? '');
  }, [trace?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = useMemo(() => {
    if (!trace) return false;
    const s = annotations[trace.id];
    if (!s) return judgment !== null || note.trim().length > 0;
    return s.judgment !== judgment || s.note !== note;
  }, [annotations, judgment, note, trace]);

  const stats = useMemo(
    () => progressStats(traces, annotations),
    [traces, annotations],
  );

  const go = (next: number) => {
    if (traces.length === 0) return;
    setIndex(Math.max(0, Math.min(traces.length - 1, next)));
  };

  const jumpTo = (traceId: string) => {
    const i = traces.findIndex((t) => t.id === traceId);
    if (i >= 0) setIndex(i);
  };

  const nextUnlabeled = () => {
    if (!traces.length) return;
    for (let step = 1; step <= traces.length; step++) {
      const i = (index + step) % traces.length;
      const a = annotations[traces[i].id];
      if (!a || a.judgment === null) {
        setIndex(i);
        return;
      }
    }
    push('All items labeled', 'info');
  };

  const save = () => {
    if (!trace || !datasetId) return;
    if (judgment === null) {
      push('Pick Pass or Fail before saving', 'error');
      return;
    }
    const annotation: Annotation = {
      traceId: trace.id,
      judgment,
      note: note.trim(),
      updatedAt: new Date().toISOString(),
    };
    upsertAnnotation(annotation);
    push('Annotation saved', 'success');
  };

  useHotkeys(
    {
      '1': (e) => {
        e.preventDefault();
        setJudgment('pass');
      },
      p: (e) => {
        e.preventDefault();
        setJudgment('pass');
      },
      '2': (e) => {
        e.preventDefault();
        setJudgment('fail');
      },
      f: (e) => {
        e.preventDefault();
        setJudgment('fail');
      },
      ArrowLeft: (e) => {
        e.preventDefault();
        go(index - 1);
      },
      j: (e) => {
        e.preventDefault();
        go(index - 1);
      },
      ArrowRight: (e) => {
        e.preventDefault();
        go(index + 1);
      },
      k: (e) => {
        e.preventDefault();
        go(index + 1);
      },
      n: (e) => {
        e.preventDefault();
        nextUnlabeled();
      },
      '?': (e) => {
        e.preventDefault();
        setCheatsheet((v) => !v);
      },
      'mod+s': (e) => {
        e.preventDefault();
        save();
      },
      'mod+Enter': (e) => {
        e.preventDefault();
        save();
      },
    },
    [index, judgment, note, traces, annotations],
    { allowInInputKeys: ['mod+s', 'mod+Enter'] },
  );

  if (!dataset) {
    return (
      <div className="card px-6 py-12 text-center">
        <p className="text-sm text-ink-600">Dataset not found.</p>
        <Link to="/datasets" className="btn-primary mt-4">
          Back to datasets
        </Link>
      </div>
    );
  }

  if (!trace) {
    return (
      <div className="card px-6 py-12 text-center text-sm text-ink-500">
        This dataset has no traces.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/datasets" className="mb-2 inline-flex items-center gap-1 text-xs text-ink-500 hover:text-ink-800">
            <ArrowLeft className="h-3.5 w-3.5" />
            Datasets
          </Link>
          <h1 className="text-xl font-semibold text-ink-950">{dataset.name}</h1>
          <p className="text-sm text-ink-500">
            Item {index + 1} of {traces.length} · <span className="font-mono text-xs">{trace.id}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-ghost" onClick={() => setCheatsheet(true)}>
            <Keyboard className="h-4 w-4" />
            Shortcuts
            <span className="kbd">?</span>
          </button>
          <Link to={`/taxonomy/${dataset.id}`} className="btn-secondary">
            Taxonomy
          </Link>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              const json = exportAnnotationsJSON(dataset.id, annotations);
              downloadText(`${dataset.id}-annotations.json`, json);
              push('Annotations exported', 'success');
            }}
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <label className="btn-secondary cursor-pointer">
            <Upload className="h-4 w-4" />
            Import annotations
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                try {
                  const parsed = JSON.parse(await file.text()) as {
                    annotations?: Annotation[];
                  } | Annotation[];
                  const list = Array.isArray(parsed)
                    ? parsed
                    : parsed.annotations ?? [];
                  if (!list.length) throw new Error('No annotations in file');
                  importAnnotations(list);
                  push(`Imported ${list.length} annotations`, 'success');
                } catch (err) {
                  push(err instanceof Error ? err.message : 'Import failed', 'error');
                }
              }}
            />
          </label>
        </div>
      </div>

      <ProgressBar
        annotated={stats.annotated}
        total={stats.total}
        passRate={stats.passRate}
      />

      <GuidanceStrip />

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-secondary" onClick={() => go(index - 1)} disabled={index === 0}>
          <ArrowLeft className="h-4 w-4" />
          Prev
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => go(index + 1)}
          disabled={index >= traces.length - 1}
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </button>
        <button type="button" className="btn-ghost" onClick={nextUnlabeled}>
          <SkipForward className="h-4 w-4" />
          Next unlabeled
          <span className="kbd">n</span>
        </button>
        <span className="ml-auto hidden items-center gap-1 text-xs text-ink-400 sm:flex">
          <HelpCircle className="h-3.5 w-3.5" />
          Don&apos;t show category pickers here — cluster after saturation.
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          {trace.product === 'central-hub' ? (
            <HubTraceView trace={trace} />
          ) : (
            <A1TraceView trace={trace} />
          )}
        </div>
        <AnnotationPanel
          judgment={judgment}
          note={note}
          saved={saved}
          onJudgment={setJudgment}
          onNote={setNote}
          onSave={save}
          dirty={dirty}
        />
      </div>

      <NotesTable
        traces={traces}
        annotations={annotations}
        activeTraceId={trace.id}
        onJump={jumpTo}
      />

      <HotkeyCheatsheet open={cheatsheet} onClose={() => setCheatsheet(false)} />
    </div>
  );
}

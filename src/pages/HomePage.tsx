import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Database, Upload } from 'lucide-react';
import { useDatasetsList } from '../hooks/useDataset';
import { loadAnnotations } from '../lib/storage';
import { progressStats } from '../lib/utils';
import { ProgressBar } from '../components/ProgressBar';
import { useToast } from '../hooks/useToast';
import type { Dataset, Trace } from '../types';

function isTrace(x: unknown): x is Trace {
  if (!x || typeof x !== 'object') return false;
  const t = x as Trace;
  return typeof t.id === 'string' && (t.product === 'central-hub' || t.product === 'a1');
}

export function HomePage() {
  const { datasets, importDataset } = useDatasetsList();
  const fileRef = useRef<HTMLInputElement>(null);
  const { push } = useToast();

  const onImport = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;

      let dataset: Dataset | null = null;

      if (
        parsed &&
        typeof parsed === 'object' &&
        Array.isArray((parsed as Dataset).traces) &&
        typeof (parsed as Dataset).id === 'string'
      ) {
        dataset = parsed as Dataset;
      } else if (Array.isArray(parsed) && parsed.every(isTrace)) {
        const product = parsed[0]?.product ?? 'central-hub';
        dataset = {
          id: `imported-${Date.now()}`,
          name: file.name.replace(/\.json$/i, ''),
          product,
          description: 'Imported JSON traces',
          traces: parsed,
        };
      } else if (
        parsed &&
        typeof parsed === 'object' &&
        Array.isArray((parsed as { traces: Trace[] }).traces)
      ) {
        const traces = (parsed as { traces: Trace[] }).traces;
        const product = traces[0]?.product ?? 'central-hub';
        dataset = {
          id: `imported-${Date.now()}`,
          name: (parsed as { name?: string }).name || file.name.replace(/\.json$/i, ''),
          product,
          description: 'Imported JSON traces',
          traces,
        };
      }

      if (!dataset || !dataset.traces.length) {
        throw new Error('Unrecognized JSON. Expect Dataset or { traces: Trace[] }.');
      }

      importDataset(dataset);
      push(`Imported “${dataset.name}” (${dataset.traces.length} traces)`, 'success');
    } catch (e) {
      push(e instanceof Error ? e.message : 'Import failed', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <section className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
          Error analysis for Central Hub & A1
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
          Annotate like a PM: free-form notes first, binary pass/fail, capture{' '}
          <em>what</em> is wrong — not why. Saturate notes, then cluster into a taxonomy.
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4" />
          Import JSON traces
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onImport(f);
            e.target.value = '';
          }}
        />
        <span className="text-xs text-ink-500">
          Local-only · localStorage + export. No backend.
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {datasets.map((ds) => {
          const annotations = loadAnnotations(ds.id);
          const stats = progressStats(ds.traces, annotations);
          return (
            <article key={ds.id} className="card flex flex-col p-5 transition hover:shadow-soft">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <Database className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-ink-950">{ds.name}</h2>
                    <p className="mt-0.5 text-xs uppercase tracking-wide text-ink-400">
                      {ds.product} · {ds.traces.length} traces
                    </p>
                  </div>
                </div>
              </div>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-ink-600">{ds.description}</p>
              <ProgressBar
                annotated={stats.annotated}
                total={stats.total}
                passRate={stats.passRate}
                className="mb-4"
              />
              <div className="flex flex-wrap gap-2">
                <Link to={`/annotate/${ds.id}`} className="btn-primary">
                  Annotate
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to={`/taxonomy/${ds.id}`} className="btn-secondary">
                  Taxonomy
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {datasets.length === 0 && (
        <div className="card px-6 py-12 text-center text-sm text-ink-500">
          No datasets. Import JSON traces to get started.
        </div>
      )}
    </div>
  );
}

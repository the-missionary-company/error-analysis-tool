import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardCopy,
  Filter,
  Loader2,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useDatasetSession } from '../hooks/useDataset';
import { useToast } from '../hooks/useToast';
import { BarChart } from '../components/BarChart';
import {
  buildClusteringPrompt,
  categoryCounts,
  clusterWithLLM,
  orderedFailNotes,
  parseTaxonomyJSON,
} from '../lib/clustering';
import { loadSettings, saveSettings } from '../lib/storage';
import { cn, formatDate } from '../lib/utils';
import type { AppSettings, FindingKind, TaxonomyCategory } from '../types';

export function TaxonomyPage() {
  const { datasetId } = useParams();
  const { dataset, annotations, taxonomy, updateTaxonomy } = useDatasetSession(datasetId);
  const { push } = useToast();
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [clustering, setClustering] = useState(false);
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const fails = useMemo(
    () => (dataset ? orderedFailNotes(dataset.traces, annotations) : []),
    [dataset, annotations],
  );

  const counts = useMemo(() => categoryCounts(taxonomy), [taxonomy]);

  const prompt = useMemo(() => {
    if (!dataset) return '';
    return buildClusteringPrompt(dataset.name, dataset.product, fails);
  }, [dataset, fails]);

  const filteredTraceIds = useMemo(() => {
    if (!filterCat) return null;
    return new Set(
      taxonomy.assignments.find((a) => a.categoryId === filterCat)?.traceIds ?? [],
    );
  }, [filterCat, taxonomy.assignments]);

  const visibleFails = filterCat
    ? fails.filter((f) => filteredTraceIds?.has(f.traceId))
    : fails;

  const persistSettings = (next: AppSettings) => {
    setSettings(next);
    saveSettings(next);
  };

  const setFindingKind = (categoryId: string, findingKind: FindingKind) => {
    const categories: TaxonomyCategory[] = taxonomy.categories.map((c) =>
      c.id === categoryId ? { ...c, findingKind } : c,
    );
    updateTaxonomy({ ...taxonomy, categories, updatedAt: new Date().toISOString() });
  };

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

  return (
    <div className="space-y-6">
      <div>
        <Link to="/datasets" className="mb-2 inline-flex items-center gap-1 text-xs text-ink-500 hover:text-ink-800">
          <ArrowLeft className="h-3.5 w-3.5" />
          Datasets
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-ink-950">Taxonomy / Cluster</h1>
            <p className="text-sm text-ink-500">
              {dataset.name} · {fails.length} fail notes (ordered oldest → newest)
            </p>
          </div>
          <Link to={`/annotate/${dataset.id}`} className="btn-secondary">
            Back to annotate
          </Link>
        </div>
      </div>

      <div className="card space-y-3 p-4">
        <p className="text-sm text-ink-600">
          After you&apos;ve saturated free-form fail notes, cluster them into failure modes.
          Prefer the copy-prompt path (works offline). Optional API key clustering stays in
          localStorage only.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary"
            onClick={async () => {
              await navigator.clipboard.writeText(prompt);
              push('Clustering prompt copied', 'success');
            }}
            disabled={!fails.length}
          >
            <ClipboardCopy className="h-4 w-4" />
            Copy clustering prompt
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setPasteOpen((v) => !v)}
          >
            <Upload className="h-4 w-4" />
            Paste categories JSON
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={!fails.length || clustering || !settings.apiKey}
            onClick={async () => {
              setClustering(true);
              try {
                const result = await clusterWithLLM(prompt, settings);
                // Preserve findingKind for matching ids
                const merged = {
                  ...result,
                  categories: result.categories.map((c) => {
                    const prev = taxonomy.categories.find((p) => p.id === c.id || p.name === c.name);
                    return { ...c, findingKind: prev?.findingKind ?? 'unset' };
                  }),
                };
                updateTaxonomy(merged);
                push('Clustered with LLM', 'success');
              } catch (e) {
                push(e instanceof Error ? e.message : 'Clustering failed', 'error');
              } finally {
                setClustering(false);
              }
            }}
          >
            {clustering ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Cluster with LLM
          </button>
          <button type="button" className="btn-ghost" onClick={() => setShowKey((v) => !v)}>
            {showKey ? 'Hide' : 'API settings'}
          </button>
        </div>

        {showKey && (
          <div className="grid gap-3 rounded-xl border border-ink-100 bg-ink-50/80 p-3 sm:grid-cols-3">
            <label className="block text-xs text-ink-500 sm:col-span-1">
              API key (localStorage only)
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-ink-200 bg-surface px-3 py-2 text-sm"
                value={settings.apiKey}
                onChange={(e) => persistSettings({ ...settings, apiKey: e.target.value })}
                placeholder="sk-..."
              />
            </label>
            <label className="block text-xs text-ink-500">
              Base URL
              <input
                className="mt-1 w-full rounded-lg border border-ink-200 bg-surface px-3 py-2 text-sm"
                value={settings.apiBaseUrl}
                onChange={(e) => persistSettings({ ...settings, apiBaseUrl: e.target.value })}
              />
            </label>
            <label className="block text-xs text-ink-500">
              Model
              <input
                className="mt-1 w-full rounded-lg border border-ink-200 bg-surface px-3 py-2 text-sm"
                value={settings.model}
                onChange={(e) => persistSettings({ ...settings, model: e.target.value })}
              />
            </label>
          </div>
        )}

        {pasteOpen && (
          <div className="space-y-2">
            <textarea
              className="h-40 w-full rounded-lg border border-ink-200 bg-surface px-3 py-2 font-mono text-xs"
              placeholder='Paste {"categories":[...],"assignments":[...]} from ChatGPT'
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                try {
                  const parsed = parseTaxonomyJSON(pasteText);
                  updateTaxonomy(parsed);
                  setPasteOpen(false);
                  setPasteText('');
                  push('Taxonomy imported', 'success');
                } catch (e) {
                  push(e instanceof Error ? e.message : 'Invalid JSON', 'error');
                }
              }}
            >
              Import pasted JSON
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <section className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Pivot · category × count</h2>
            {filterCat && (
              <button
                type="button"
                className="btn-ghost px-2 text-xs"
                onClick={() => setFilterCat(null)}
              >
                Clear filter
              </button>
            )}
          </div>
          <BarChart
            items={counts}
            activeId={filterCat}
            onSelect={(id) => setFilterCat((cur) => (cur === id ? null : id))}
          />

          {taxonomy.categories.length > 0 && (
            <div className="mt-5 space-y-2 border-t border-ink-100 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                Tag findings
              </h3>
              {taxonomy.categories.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink-100 px-2.5 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink-800">{c.name}</div>
                    {c.description && (
                      <div className="truncate text-xs text-ink-500">{c.description}</div>
                    )}
                  </div>
                  <select
                    className="rounded-md border border-ink-200 bg-surface px-2 py-1 text-xs"
                    value={c.findingKind}
                    onChange={(e) => setFindingKind(c.id, e.target.value as FindingKind)}
                  >
                    <option value="unset">Unset</option>
                    <option value="eval-worthy">Eval-worthy</option>
                    <option value="product-ux">Product / UX fix</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card overflow-hidden">
          <div className="border-b border-ink-100 px-4 py-3">
            <h2 className="text-sm font-semibold">
              Fail notes in order
              {filterCat && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                  <Filter className="h-3 w-3" />
                  filtered
                </span>
              )}
            </h2>
            <p className="text-xs text-ink-500">
              Later notes often encode updated criteria — weight them accordingly when clustering.
            </p>
          </div>
          {visibleFails.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-ink-500">
              {fails.length === 0
                ? 'No fail notes yet. Annotate failures first, then cluster.'
                : 'No notes in this category.'}
            </div>
          ) : (
            <ol className="divide-y divide-ink-100">
              {visibleFails.map((f) => {
                const cats = taxonomy.assignments
                  .filter((a) => a.traceIds.includes(f.traceId))
                  .map((a) => taxonomy.categories.find((c) => c.id === a.categoryId)?.name)
                  .filter(Boolean);
                return (
                  <li key={`${f.traceId}-${f.index}`} className="px-4 py-3.5">
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-ink-400">
                      <span className="font-mono">#{f.index}</span>
                      <span className="font-mono">{f.traceId}</span>
                      <span>{formatDate(f.updatedAt)}</span>
                      {cats.map((name) => (
                        <span
                          key={String(name)}
                          className={cn(
                            'rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-700',
                          )}
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-ink-800">{f.note}</p>
                    <Link
                      to={`/annotate/${dataset.id}?trace=${encodeURIComponent(f.traceId)}`}
                      className="mt-1 inline-block text-xs text-accent hover:underline"
                    >
                      Open in annotate →
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

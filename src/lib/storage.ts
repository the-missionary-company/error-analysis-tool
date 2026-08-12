import type { Annotation, AppSettings, Dataset, TaxonomyState } from '../types';
import { SEED_DATASETS } from '../data/seed';

const KEYS = {
  datasets: 'ea.datasets',
  annotations: 'ea.annotations',
  taxonomy: 'ea.taxonomy',
  settings: 'ea.settings',
  activeDataset: 'ea.activeDataset',
} as const;

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadDatasets(): Dataset[] {
  const custom = readJSON<Dataset[]>(KEYS.datasets, []);
  const seedIds = new Set(SEED_DATASETS.map((d) => d.id));
  const extras = custom.filter((d) => !seedIds.has(d.id));
  return [...SEED_DATASETS, ...extras];
}

export function saveCustomDataset(dataset: Dataset) {
  const custom = readJSON<Dataset[]>(KEYS.datasets, []);
  const next = [...custom.filter((d) => d.id !== dataset.id), dataset];
  writeJSON(KEYS.datasets, next);
}

export function loadAnnotations(datasetId: string): Record<string, Annotation> {
  const all = readJSON<Record<string, Record<string, Annotation>>>(KEYS.annotations, {});
  return all[datasetId] ?? {};
}

export function saveAnnotation(datasetId: string, annotation: Annotation) {
  const all = readJSON<Record<string, Record<string, Annotation>>>(KEYS.annotations, {});
  const forDataset = { ...(all[datasetId] ?? {}), [annotation.traceId]: annotation };
  writeJSON(KEYS.annotations, { ...all, [datasetId]: forDataset });
}

export function saveAllAnnotations(datasetId: string, annotations: Record<string, Annotation>) {
  const all = readJSON<Record<string, Record<string, Annotation>>>(KEYS.annotations, {});
  writeJSON(KEYS.annotations, { ...all, [datasetId]: annotations });
}

export function loadTaxonomy(datasetId: string): TaxonomyState {
  const all = readJSON<Record<string, TaxonomyState>>(KEYS.taxonomy, {});
  return (
    all[datasetId] ?? {
      categories: [],
      assignments: [],
      updatedAt: new Date(0).toISOString(),
    }
  );
}

export function saveTaxonomy(datasetId: string, taxonomy: TaxonomyState) {
  const all = readJSON<Record<string, TaxonomyState>>(KEYS.taxonomy, {});
  writeJSON(KEYS.taxonomy, { ...all, [datasetId]: taxonomy });
}

export function loadSettings(): AppSettings {
  return readJSON<AppSettings>(KEYS.settings, {
    apiKey: '',
    apiBaseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  });
}

export function saveSettings(settings: AppSettings) {
  writeJSON(KEYS.settings, settings);
}

export function getActiveDatasetId(): string | null {
  return localStorage.getItem(KEYS.activeDataset);
}

export function setActiveDatasetId(id: string) {
  localStorage.setItem(KEYS.activeDataset, id);
}

export function exportAnnotationsJSON(
  datasetId: string,
  annotations: Record<string, Annotation>,
): string {
  return JSON.stringify(
    {
      datasetId,
      exportedAt: new Date().toISOString(),
      annotations: Object.values(annotations),
    },
    null,
    2,
  );
}

export function downloadText(filename: string, content: string, mime = 'application/json') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

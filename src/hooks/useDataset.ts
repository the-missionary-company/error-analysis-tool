import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Annotation, Dataset, TaxonomyState } from '../types';
import {
  loadAnnotations,
  loadDatasets,
  loadTaxonomy,
  saveAllAnnotations,
  saveAnnotation,
  saveCustomDataset,
  saveTaxonomy,
  setActiveDatasetId,
  getActiveDatasetId,
} from '../lib/storage';

export function useDatasetsList() {
  const [datasets, setDatasets] = useState<Dataset[]>(() => loadDatasets());

  const refresh = useCallback(() => setDatasets(loadDatasets()), []);

  const importDataset = useCallback(
    (dataset: Dataset) => {
      saveCustomDataset(dataset);
      refresh();
    },
    [refresh],
  );

  return { datasets, refresh, importDataset };
}

export function useDatasetSession(datasetId: string | undefined) {
  const datasets = useMemo(() => loadDatasets(), [datasetId]);
  const dataset = datasets.find((d) => d.id === datasetId);

  const [annotations, setAnnotations] = useState<Record<string, Annotation>>({});
  const [taxonomy, setTaxonomy] = useState<TaxonomyState>({
    categories: [],
    assignments: [],
    updatedAt: new Date(0).toISOString(),
  });

  useEffect(() => {
    if (!datasetId) return;
    setActiveDatasetId(datasetId);
    setAnnotations(loadAnnotations(datasetId));
    setTaxonomy(loadTaxonomy(datasetId));
  }, [datasetId]);

  const upsertAnnotation = useCallback(
    (annotation: Annotation) => {
      if (!datasetId) return;
      saveAnnotation(datasetId, annotation);
      setAnnotations((prev) => ({ ...prev, [annotation.traceId]: annotation }));
    },
    [datasetId],
  );

  const importAnnotations = useCallback(
    (incoming: Annotation[]) => {
      if (!datasetId) return;
      const next = { ...annotations };
      for (const a of incoming) {
        next[a.traceId] = a;
      }
      saveAllAnnotations(datasetId, next);
      setAnnotations(next);
    },
    [annotations, datasetId],
  );

  const updateTaxonomy = useCallback(
    (next: TaxonomyState) => {
      if (!datasetId) return;
      saveTaxonomy(datasetId, next);
      setTaxonomy(next);
    },
    [datasetId],
  );

  return {
    dataset,
    annotations,
    taxonomy,
    upsertAnnotation,
    importAnnotations,
    updateTaxonomy,
    lastActiveId: getActiveDatasetId(),
  };
}

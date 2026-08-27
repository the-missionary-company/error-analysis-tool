import { useCallback, useMemo, useState } from 'react';
import { SEED_STEERS } from '../data/steerSeed';
import {
  importSteerReviews,
  loadActiveId,
  loadSteerCases,
  loadSteerReviews,
  saveActiveId,
  saveImportedCases,
  saveSteerReview,
} from '../lib/steerStorage';
import { emptyReview, exportSteerBoardJSON } from '../lib/steers';
import type { SteerCase, SteerReview } from '../types/steers';

export function useSteers() {
  const [cases, setCases] = useState<SteerCase[]>(() => loadSteerCases());
  const [reviews, setReviews] = useState<Record<string, SteerReview>>(() => loadSteerReviews());
  const [activeId, setActiveIdState] = useState<string>(() => {
    const cases = loadSteerCases();
    const saved = loadActiveId();
    if (saved && cases.some((item) => item.id === saved)) return saved;
    return cases[0]?.id ?? SEED_STEERS[0].id;
  });
  const setActiveId = useCallback((id: string) => {
    saveActiveId(id);
    setActiveIdState(id);
  }, []);

  const activeCase = useMemo(
    () => cases.find((item) => item.id === activeId) ?? cases[0] ?? null,
    [activeId, cases],
  );

  const activeReview = useMemo(() => {
    if (!activeCase) return emptyReview('unknown');
    return reviews[activeCase.id] ?? emptyReview(activeCase.id);
  }, [activeCase, reviews]);

  const persistReview = useCallback((next: SteerReview) => {
    saveSteerReview(next);
    setReviews(loadSteerReviews());
  }, []);

  const importCases = useCallback((incoming: SteerCase[]) => {
    saveImportedCases(incoming);
    const next = loadSteerCases();
    setCases(next);
    return next;
  }, []);

  const importReviews = useCallback((incoming: SteerReview[]) => {
    importSteerReviews(incoming);
    const next = loadSteerReviews();
    setReviews(next);
    return next;
  }, []);

  const exportBoard = useCallback(() => {
    return exportSteerBoardJSON(cases, Object.values(reviews));
  }, [cases, reviews]);

  return {
    cases,
    reviews,
    activeCase,
    activeReview,
    activeId: activeCase?.id ?? activeId,
    setActiveId,
    persistReview,
    importCases,
    importReviews,
    exportBoard,
  };
}

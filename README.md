# Error Analysis Tool — Central Hub + A1

A production-quality, keyboard-first annotation app for **open coding / error analysis** on Liam's construction-PM products:

- **Central Hub** — RAG/hybrid-search cited answers
- **A1** — meeting-series commitment reconciliation (closed / dropped / quiet / overdue)

Built around Hamel Husain's error analysis method: free-form notes first, binary pass/fail, record *what* is wrong (not why), saturate human notes, then cluster into a taxonomy and count.

## Stack

Vite + React + TypeScript + Tailwind CSS. No backend — `localStorage` + JSON export/import. Optional OpenAI-compatible clustering from the browser (key stored only in `localStorage`), plus offline "Copy prompt → paste JSON back."

## Run

From `/workspace/error-analysis-tool`:

```text
# install dependencies, then start the Vite dev server on 0.0.0.0:5173
# package scripts: install → run dev | run build | run preview
```

Use the package manager scripts defined in `package.json` (`dev`, `build`, `preview`).

## Hamel workflow (encoded in the product)

1. **Annotate** — For each trace, mark Pass/Fail and write a short smoking-gun note. Do **not** pick categories yet.
2. **Saturate** — Keep going until new notes stop surprising you (criteria stabilize; later notes are sharper).
3. **Cluster** — Copy the clustering prompt (or Cluster with LLM) to group fail notes into failure modes.
4. **Count** — Use the pivot (category × count). Tag modes as *eval-worthy* vs *product/UX fix*.
5. **Act** — Fix product issues; turn eval-worthy modes into regression tests / eval sets.

## Keyboard shortcuts (Annotate)

| Key | Action |
| --- | --- |
| `1` / `p` | Pass |
| `2` / `f` | Fail |
| `Cmd/Ctrl+S` or `Cmd/Ctrl+Enter` | Save |
| `Left` / `j` | Previous |
| `Right` / `k` | Next |
| `n` | Next unlabeled |
| `?` | Cheatsheet |

## Data

Seeded datasets live in `src/data/seed.ts`. Import custom traces as:

- a full `Dataset` object, or
- `{ "traces": Trace[] }`, or
- a bare `Trace[]` array

Export/import annotations from the Annotate view as JSON.

## First 15 minutes

1. Open the app → pick **Central Hub — cited answers**.
2. Skim guidance strip; annotate 5–8 items with Pass/Fail + one concrete note each (`1`/`2`, then save).
3. Spot intentional failure modes in the seed (wrong approval, missing open submittal, hallucinated certainty, raw doc IDs).
4. Switch to **A1** and annotate a few commitment-state mistakes (false closed, missed dropped, false overdue).
5. Open **Taxonomy** → **Copy clustering prompt** → paste into ChatGPT → paste JSON back (or set an API key and Cluster with LLM).
6. Review pivot counts; tag categories eval-worthy vs product/UX; export annotations JSON for the team.

## Privacy

API keys and annotations never leave the browser except when you explicitly call an LLM endpoint or export JSON.

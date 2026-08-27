# Error Analysis Tool — Steers + Central Hub + A1

A production-quality annotation app for Liam's construction-PM products.

**Steers** (default board) — Sam scores Oscar Vorflux write-ups. Same case, two independent scores: **Content** (did the write-up close the understanding gap?) and **Action** (did Oscar do the right thing?). Highlights stay attached to spans. Labels persist in `localStorage` and in a downloadable JSON file.

**Central Hub** and **A1** — Hamel-style open coding: free-form notes first, binary pass/fail, then cluster into a taxonomy.

No Phoenix, no Braintrust, no LLM judge, no 1-to-5 stars.

## Live URL

After GitHub Pages is enabled and this workflow has deployed:

https://the-missionary-company.github.io/error-analysis-tool/

## Stack

Vite + React + TypeScript + Tailwind CSS. No backend — `localStorage` + JSON export/import.

## Run

```bash
npm ci
npm test
npm run dev
```

The Vite `base` is `/error-analysis-tool/`, so the app is at `http://localhost:5173/error-analysis-tool/`.

```bash
npm run build
npm run preview
```

## Steers scoring

Do **not** collapse Content and Action into one Pass/Fail.

1. **Content** — Did the write-up close the understanding gap (context, problem, options, choice)? Pass or Fail + its own comment. A question here means missing information for the next write-up.
2. **Action** — Did Oscar as tech lead / portfolio orchestrator do the right thing? Pass or Fail + its own comment. A fix here is behavior / living instruction.

Sam can Pass content and Fail action, or the reverse.

Optional chips (not the score): jumped to options; taught the feature instead of the development story; too thin to decide; cathedral / extra ceremony.

The seed case ships **unscored**. Do not invent labels.

## Load more cases

Oscar drops a JSON array (or `{ "cases": [...] }`) with:

```json
{
  "id": "stable-id",
  "title": "3. Title",
  "session": "Capture",
  "stamp": "HOLD",
  "when": "2026-08-27",
  "yourCall": "Softer",
  "notionUrl": "https://app.notion.com/...",
  "context": "...",
  "problem": "...",
  "options": "1. ...\n2. ...",
  "choice": "..."
}
```

`public/sample-steer-cases.json` is the seed case in that shape.

## Labels JSON (hand to Oscar)

Export writes:

```json
{
  "kind": "oscar-steer-board",
  "exportedAt": "2026-08-27T12:00:00.000Z",
  "cases": [],
  "reviews": [
    {
      "caseId": "will-not-green-production-migration",
      "content": { "passFail": "pass", "comment": "..." },
      "action": { "passFail": "fail", "comment": "..." },
      "highlights": [
        {
          "id": "h1",
          "section": "choice",
          "start": 0,
          "end": 12,
          "text": "span text",
          "lane": "action",
          "passFail": "fail",
          "comment": "..."
        }
      ],
      "chips": ["too-thin-to-decide"],
      "updatedAt": "2026-08-27T12:00:00.000Z"
    }
  ]
}
```

Import that file to restore labels after a refresh on another machine.

## Hub + A1 (unchanged)

1. Open **Hub + A1**.
2. Annotate traces with Pass/Fail + a smoking-gun note.
3. Taxonomy → copy clustering prompt or cluster with an optional LLM key.

Keyboard shortcuts on Annotate: `1`/`p` Pass, `2`/`f` Fail, `⌘/Ctrl+S` save, `j`/`k` prev/next, `n` next unlabeled, `?` cheatsheet.

## Deploy

`.github/workflows/deploy.yml` runs `npm ci`, `npm run build`, and uploads **`dist`** to GitHub Pages (not the repo root).

In the repo: **Settings → Pages → Source: GitHub Actions**.

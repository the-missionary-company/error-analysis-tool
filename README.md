# Eval dashboard — Steers + Central Hub + A1

Sam's eval dashboard for scoring Oscar's past steers.

**Steers** (default board) — Same case, two independent scores: **Content / understanding** (how Oscar sent the message — did Sam understand the write-up, and what the agents are doing?) and **Action / tech lead** (how Oscar acted as the tech lead). Highlights stay attached to spans. Labels persist in `localStorage` and in a downloadable JSON file.

**Central Hub** and **A1** — Hamel-style open coding: free-form notes first, binary pass/fail, then cluster into a taxonomy.

No Phoenix, no Braintrust, no LLM judge, no 1-to-5 stars.

## Live URL

https://eval-dashboard-zeta.vercel.app/

Vercel project `eval-dashboard`. GitHub Pages stays blocked.

## Stack

Vite + React + TypeScript + Tailwind CSS. Cases and reviews persist on `/api/cases` and `/api/reviews` (Vercel Blob) so Oscar can post a steer and comment without Notion.

Oscar’s reference: **[API.md](API.md)**. Update that file in the same commit as any API change.

## Run

```bash
npm ci
npm test
npm run dev
```

The Vite `base` is `/`, so the app is at `http://localhost:5173/`.

```bash
npm run build
npm run preview
```

## How Sam uses the board

Read [HOW-IT-WORKS.md](HOW-IT-WORKS.md). Short version:

There is **no Process button**. Scores and span comments save as you go.

1. Pass/Fail **Content / understanding** and **Action / tech lead** on each case.
2. Highlight a span → pick Content (blue) or Action (amber) → type → Enter. The note sits to the right of that sentence.
3. “Change this now” is a comment on that span. Oscar can act on it immediately.
4. Broader patterns wait until you have a pile of scored cases. Nothing auto-clusters or trains an eval skill from this board yet.

Oscar posts with Bearer auth. See **[API.md](API.md)** (and the short copy in [HOW-IT-WORKS.md](HOW-IT-WORKS.md#oscar-post-on-the-board-no-notion)). Do not PUT a whole review to leave a comment — that can overwrite Sam's scores.

## Steers scoring

Do **not** collapse Content / understanding and Action / tech lead into one Pass/Fail.

1. **Content / understanding** — How Oscar sent the message. Did Sam understand the write-up, and did he understand what the agents are doing? Its own Pass or Fail, its own labels, its own comment. A question here means missing information.
2. **Action / tech lead** — How Oscar acted as the tech lead. Its own Pass or Fail, its own labels, its own comment.

Labels are per score. Type a new one or reuse one already used on that score. Content labels stay on Content; Action labels stay on Action.

A **comment** is a note and does not require a reply. A **question** is a thread (Sam vs Oscar). When a question came from a highlight, it stays attached to that span. If Oscar updates the steer from a question, the old span is struck through and the replacement is highlighted. The JSON stores `{ oldText, newText, questionId, offsets }` — the original case text is not silently rewritten.

Sam can Pass content and Fail action, or the reverse.

Optional chips (not the score): jumped to options; taught the feature instead of the development story; too thin to decide; cathedral / extra ceremony.

Seed cases ship **unscored**. Do not invent labels. Content and Action stay empty until Sam marks them.

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
  "tooAggressive": "Yes",
  "yourCallBody": "Open. Score Content ... Score Action ...",
  "notionUrl": "https://app.notion.com/...",
  "context": "...",
  "problem": "...",
  "options": "1. ...\n2. ...",
  "choice": "..."
}
```

`public/sample-steer-cases.json` is the seed cases in that shape.

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
      "content": { "passFail": "pass", "comment": "...", "labels": ["too thin to decide"] },
      "action": { "passFail": "fail", "comment": "...", "labels": ["one-way door"] },
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
      "notes": [
        {
          "id": "q1",
          "kind": "question",
          "lane": "content",
          "author": "sam",
          "text": "What does two-way mean here?",
          "replies": [{ "id": "r1", "author": "oscar", "text": "Capture work can still finish." }],
          "highlightId": "h1",
          "section": "options",
          "start": 17,
          "end": 28,
          "spanText": "PR unmerged"
        }
      ],
      "revisions": [
        {
          "id": "rev1",
          "questionId": "q1",
          "section": "options",
          "oldText": "PR unmerged",
          "newText": "PR stays unmerged on purpose",
          "start": 17,
          "end": 28
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

Ship on Vercel. Vite `base` is `/` so assets load at the domain root. GitHub Pages stays blocked. The Pages workflow may still exist; do not treat github.io as the live URL.

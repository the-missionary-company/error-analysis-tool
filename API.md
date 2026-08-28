# Oscar API

Living reference for the steers board. Update this file in the same commit whenever an endpoint, payload, or auth rule changes.

Base URL: `https://eval-dashboard-zeta.vercel.app`

Auth (either one):

- `Authorization: Bearer $EVAL_DASHBOARD_PASSWORD`
- Cookie `eval_dashboard=1` (browser padlock after `POST /api/login`)

Unauthenticated `/api/cases` and `/api/reviews*` return **401 JSON** `{ "error": "unauthorized" }`. They do not redirect to `/login`. HTML pages still redirect.

Do **not** invent steer bodies. Do **not** invent or overwrite Sam’s Pass/Fail scores. Prefer `comment` and `reply` over `PUT /api/reviews`.

---

## Board action → API

| What you do on the board | API | Notes |
| --- | --- | --- |
| Read the case list / one case | `GET /api/cases` | Seed plus posted extras. `?id=` or `?number=` |
| Post a new steer (no Notion) | `POST /api/cases` | Required fields below. Missing `id` is slugged from title |
| Update a posted steer | `POST /api/cases` with the same `id` | Merges by id. Posted row overrides seed only if you post that id |
| Read Sam’s scores, notes, threads | `GET /api/reviews` | `?caseId=` optional |
| Case-level comment or question | `POST /api/reviews/comment` | Defaults `author` to `oscar`. Does not change Pass/Fail |
| Span / gutter comment | `POST /api/reviews/comment` with `section` + `spanText` | Optional `start`, `end`, `highlightId` |
| Reply in a thread | `POST /api/reviews/reply` | Needs `noteId` from GET |
| Export the board | `GET /api/cases` + `GET /api/reviews` | Same shape as Export JSON, minus `kind` / `exportedAt` |
| Import cases | `POST /api/cases` with `{ "cases": [...] }` | Same required fields as Load cases |
| Mark Pass/Fail, labels, chips | `PUT /api/reviews` | **Sam’s work.** A full PUT replaces the stored review and can wipe scores |
| Apply a visible revision on a question | *UI only today* | Strike + replacement overlay; does not rewrite the stored case body |
| Remove a highlight | *UI only today* | Local + synced review via PUT if you must |
| Sort / search / `j` `k` `n` | *UI only* | Navigation |
| Posting-as Sam/Oscar toggle | `author` on comment/reply | API field, not a session |
| Hub + A1 annotate / cluster | *No Oscar API* | Separate Hamel-style board in the browser |

The board pulls `GET /api/cases` and `GET /api/reviews` about every 15 seconds. A POST from Oscar shows up for Sam without a seed deploy. If Blob persist is missing, writes return **503**.

---

## Auth

```bash
export EVAL_DASHBOARD_PASSWORD='…'
export HOST='https://eval-dashboard-zeta.vercel.app'
alias oscar='curl -sS -H "Authorization: Bearer $EVAL_DASHBOARD_PASSWORD" -H "content-type: application/json"'
```

Local Vite: same paths on `http://127.0.0.1:4180` (or the port `npm run dev` printed), same Bearer.

---

## Cases

### `GET /api/cases`

Returns `{ "cases": SteerCase[] }` = seed steers plus persisted extras, merge by id.

```bash
oscar "$HOST/api/cases"
oscar "$HOST/api/cases?id=after-guide-tracer-fort-mill-zero-write-tonight"
oscar "$HOST/api/cases?number=33"
```

### `POST /api/cases`

Accepts one case, `{ "case": … }`, or `{ "cases": […] }`.

Required: `title`, `session`, `stamp`, `context`, `problem`, `options`, `choice`.

If `id` is missing, it is slugged from `title`. If `number` is missing, it is `max(seed + stored) + 1`. If `when` / `timestamp` are missing, they are now. Optional: `tooAggressive`, `yourCall`, `yourCallBody`, `contextLabel` (default `Background`), `choiceLabel` (default `Choice`), `notionUrl`.

Returns `{ "case": … }` for a single body, `{ "cases": […] }` for a list. **400** if a required field is missing.

```bash
oscar -X POST "$HOST/api/cases" -d '{
  "title": "…",
  "session": "Tracer",
  "stamp": "KEEP",
  "context": "…",
  "problem": "…",
  "options": "…",
  "choice": "…"
}'
```

You write the body. This repo does not ship a sample POST body.

Persisted file: private Blob `steer-cases.json`.

---

## Reviews

### `GET /api/reviews`

Returns `{ "reviews": SteerReview[] }`. Optional `?caseId=`.

```bash
oscar "$HOST/api/reviews"
oscar "$HOST/api/reviews?caseId=sync-was-becoming-a-type-religion"
```

### `POST /api/reviews/comment`

Does **not** change Pass/Fail. Defaults `author` to `oscar`. `lane` is `content` or `action`. `kind` is `comment` (default) or `question`.

Known cases = seed ids + any id you posted to `/api/cases` + any case that already has a review.

```bash
# Case-level
oscar -X POST "$HOST/api/reviews/comment" -d '{
  "caseId": "sync-was-becoming-a-type-religion",
  "lane": "action",
  "text": "I will cut the type chapel."
}'

# Span (gutter)
oscar -X POST "$HOST/api/reviews/comment" -d '{
  "caseId": "sync-was-becoming-a-type-religion",
  "lane": "content",
  "kind": "question",
  "text": "This sentence is the cut.",
  "section": "choice",
  "spanText": "I posted the cut",
  "start": 3,
  "end": 19
}'
```

`section` is `context` | `problem` | `options` | `choice`. Optional `highlightId` attaches to an existing highlight.

**404** `case not found` or `highlight not found`.

### `POST /api/reviews/reply`

```bash
oscar -X POST "$HOST/api/reviews/reply" -d '{
  "caseId": "sync-was-becoming-a-type-religion",
  "noteId": "n-…",
  "author": "oscar",
  "text": "Done."
}'
```

`noteId` comes from GET. **404** if the note is missing.

### `PUT /api/reviews`

Accepts `{ "review": … }`, `{ "reviews": […] }`, or a reviews array. Merges by `caseId`, keeping the newer `updatedAt`.

**Do not PUT a full review to leave a comment.** That can overwrite Sam’s scores, labels, and highlights. Sam’s board uses PUT when it syncs a review it already edited locally.

---

## Shapes

`SteerCase` required strings: `id`, `title`, `session`, `stamp`, `when`, `context`, `problem`, `options`, `choice`. Optional: `number`, `timestamp`, `yourCall`, `tooAggressive`, `yourCallBody`, `contextLabel`, `choiceLabel`, `notionUrl`.

`SteerReview`: `caseId`, `content` / `action` (`passFail` `pass` | `fail` | `null`, `comment`, `labels[]`), `highlights[]`, `notes[]`, `revisions[]`, `chips[]`, `updatedAt`.

`lane`: `content` | `action`.  
`kind`: `comment` | `question`.  
`author`: `sam` | `oscar`.

---

## Errors

| Status | When |
| --- | --- |
| 401 | Missing/wrong Bearer or cookie on `/api/cases` or `/api/reviews*` |
| 400 | Missing required case fields, bad JSON, invalid comment (`caseId` / `text` / `lane`) |
| 404 | Unknown case, highlight, or note |
| 405 | Wrong method |
| 503 | `BLOB_READ_WRITE_TOKEN` not set |

---

## What this API does not do

- No Process / Run / Evaluate, no LLM judge, no Phoenix, no Braintrust.
- No clustering and no eval-skill run.
- Hub + A1 stays in the browser.
- Applying a strike-through revision from a question is UI-only until an endpoint is added here. To change the stored case text, `POST /api/cases` with the same `id` and the new fields (that is an explicit rewrite, not the overlay).

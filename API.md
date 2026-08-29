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
| Read the case list / one case | `GET /api/cases` | Seed plus posted extras. `?id=` or `?number=` or `?project=` / `?parentTicket=` / `?spec=` |
| Post a new steer (no Notion) | `POST /api/cases` | Required fields below. Always send `project` + `parentTicket` when you know them |
| Update a posted steer | `POST /api/cases` with the same `id` | Merges by id. Posted row overrides seed only if you post that id |
| Read Sam’s scores, notes, threads | `GET /api/reviews` | `?caseId=` optional. `filedAt` means Sam filed it out of inbox |
| Case-level comment or question | `POST /api/reviews/comment` | Defaults `author` to `oscar`. Does not change Pass/Fail or filing |
| Span / gutter comment | `POST /api/reviews/comment` with `section` + `spanText` | Optional `start`, `end`, `highlightId` |
| Reply in a thread | `POST /api/reviews/reply` | Needs `noteId` from GET |
| Export the board | `GET /api/cases` + `GET /api/reviews` | Same shape as Export JSON, minus `kind` / `exportedAt` |
| Import cases | `POST /api/cases` with `{ "cases": [...] }` | Same required fields as Load cases |
| Mark Pass/Fail, labels, chips, file/unfile | `PUT /api/reviews` | **Sam’s work.** A full PUT replaces the stored review and can wipe scores / `filedAt` |
| Apply a visible revision on a question | *UI only today* | Strike + replacement overlay; does not rewrite the stored case body |
| Remove a highlight | *UI only today* | Local + synced review via PUT if you must |
| Sort / search / project filter / inbox · `j` `k` `n` | *UI only* | Navigation. `n` = next unscored inbox case |
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
oscar "$HOST/api/cases?project=Tracer"
oscar "$HOST/api/cases?parentTicket=CH-757"
oscar "$HOST/api/cases?spec=AF-CAL-01"
```

Filter query params (AND together when combined):

| Param | Matches |
| --- | --- |
| `project` | Case `project` (falls back to `session` if Oscar omitted `project`) |
| `parentTicket` | Linear parent id, e.g. `CH-757` |
| `spec` | Spec id / slug Oscar sent, e.g. `AF-CAL-01` |

### `POST /api/cases`

Accepts one case, `{ "case": … }`, or `{ "cases": […] }`.

Required: `title`, `session`, `stamp`, `context`, `problem`, `options`, `choice`.

If `id` is missing, it is slugged from `title`. If `number` is missing, it is `max(seed + stored) + 1`. If `when` / `timestamp` are missing, they are now. Optional: `tooAggressive`, `yourCall`, `yourCallBody`, `contextLabel` (default `Background`), `choiceLabel` (default `Choice`), `notionUrl`, **`project`**, **`parentTicket`**, **`parentTicketUrl`**, **`spec`**.

**Oscar / Nick — always send scope fields** so Sam can work one project at a time:

| Field | Example | Meaning |
| --- | --- | --- |
| `project` | `"Tracer"` | The parent project / agent lane Sam filters on. Prefer this over relying on `session`. Use the five live names: `Capture`, `Sync`, `Tracer`, `Calendar`, `Fireflies` (or another clear project name). |
| `parentTicket` | `"CH-757"` | Linear parent ticket for that project |
| `parentTicketUrl` | `"https://linear.app/.../CH-757/..."` | Optional link shown on the board |
| `spec` | `"AF-CAL-01"` | Optional spec id or short slug when the steer is about a named spec |

`session` stays the agent/session label (often the same as `project`). Sam’s board falls back to `session` when `project` is missing, and fills known parent tickets for Capture/Sync/Tracer/Fireflies/Calendar when `parentTicket` is omitted — but **do not rely on that**. Send the fields.

```bash
oscar -X POST "$HOST/api/cases" -d '{
  "title": "…",
  "session": "Tracer",
  "project": "Tracer",
  "parentTicket": "CH-757",
  "parentTicketUrl": "https://linear.app/the-missionary-company/issue/CH-757/answer-engine-tracer-bullet-approved-better-implementation-package",
  "spec": "CH-757",
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

`filedAt` on a review means Sam pressed **Done — file it** and moved the case out of the inbox. Oscar should not clear or invent `filedAt`. Leave it alone on comment/reply. A full `PUT /api/reviews` that omits `filedAt` can wipe Sam’s filing if that PUT wins on `updatedAt` — prefer comment/reply.

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

`SteerCase` required strings: `id`, `title`, `session`, `stamp`, `when`, `context`, `problem`, `options`, `choice`. Optional: `number`, `timestamp`, `yourCall`, `tooAggressive`, `yourCallBody`, `contextLabel`, `choiceLabel`, `notionUrl`, `project`, `parentTicket`, `parentTicketUrl`, `spec`.

`SteerReview`: `caseId`, `content` / `action` (`passFail` `pass` | `fail` | `null`, `comment`, `labels[]`), `highlights[]`, `notes[]`, `revisions[]`, `chips[]`, `filedAt?` (ISO when Sam filed it out of the inbox), `updatedAt`.

`lane`: `content` | `action`.  
`kind`: `comment` | `question`.  
`author`: `sam` | `oscar`.

---

## Board inbox (Sam)

- Default list is **Inbox** (cases without `filedAt`).
- **Done — file it** sets `filedAt` on that review and jumps to the next inbox case (honoring the project filter).
- **Filed** is a separate tab so Sam can still find finished cases.
- Filter chips by **Project** (and search by parent ticket / spec).

Oscar posts cases with `project` + `parentTicket` so those chips work. Filing is Sam’s workflow, not an Oscar API action.

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

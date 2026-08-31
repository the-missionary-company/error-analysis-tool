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
| Read the case list / one case | `GET /api/cases` | Seed plus posted extras. Filter with `?parentId=` / `?parentSystem=` / `?parentKey=` / `?project=` / `?spec=` |
| Post a new steer (no Notion) | `POST /api/cases` | Required body fields below. **Always send `parentId` + `parentSystem`** (Linear). `sessionId` optional |
| Update a posted steer | `POST /api/cases` with the same `id` | Merges by id. Posted row overrides seed only if you post that id |
| Archive a superseded case | `POST /api/cases` with the same `id` and `archived: true` | Shelf, not File. Hides from Inbox / Filed. Does **not** set `filedAt` or ping the File webhook |
| Unarchive | `POST /api/cases` with the same `id` and `archived: false` | Returns to Inbox (or Filed if the review still has `filedAt`) |
| Read Sam’s scores, notes, threads | `GET /api/reviews` | `?caseId=` optional. `filedAt` means Sam filed it out of inbox |
| Case-level comment or question | `POST /api/reviews/comment` | `author` is `sam` \| `oscar` \| `oscar-clone`. Defaults `oscar` when omitted. Unknown `author` is 400. Does not change Pass/Fail or filing |
| Span / gutter comment | `POST /api/reviews/comment` with `section` + `spanText` | Optional `start`, `end`, `highlightId` |
| Reply in a thread | `POST /api/reviews/reply` | Needs `noteId` from GET. Same `author` rules as comment |
| Export the board | `GET /api/cases` + `GET /api/reviews` | Same shape as Export JSON, minus `kind` / `exportedAt` |
| Import cases | `POST /api/cases` with `{ "cases": [...] }` | Same required fields as Load cases |
| Mark Pass/Fail, labels, chips, file/unfile | `PUT /api/reviews` | **Sam’s work.** A full PUT replaces the stored review and can wipe scores / `filedAt` |
| Apply a visible revision on a question | *UI only today* | Strike + replacement overlay; does not rewrite the stored case body |
| Remove a highlight | *UI only today* | Local + synced review via PUT if you must |
| Sort / search / parent filter / inbox · `j` `k` `n` | *UI only* | Navigation. Filter chips are Linear parent titles (`CH-757 · Answer Engine Tracer`). `n` = next unscored inbox case |
| Dictate into a comment / reply / label | `POST /api/transcribe` | Mic button. Grok STT. Screen wake lock, max 3 minutes |
| Posting-as Sam / Oscar / Oscar Clone toggle | `author` on comment/reply | API field, not a session. Clone must send `author: "oscar-clone"` |
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
oscar "$HOST/api/cases?parentId=CH-757"
oscar "$HOST/api/cases?parentSystem=linear&parentId=CH-757"
oscar "$HOST/api/cases?parentKey=linear:CH-757"
oscar "$HOST/api/cases?project=Tracer"
oscar "$HOST/api/cases?spec=AF-CAL-01"
```

Filter query params (AND together when combined):

| Param | Matches |
| --- | --- |
| `parentId` | Durable parent id (Linear issue key). **Preferred filter.** Alias: `parentTicket` |
| `parentSystem` | Tracker system. Default / usual value: `linear` |
| `parentKey` | Combined `system:id`, e.g. `linear:CH-757` |
| `project` | Human project label (Capture / Sync / Tracer / …) |
| `spec` | Spec id / slug, e.g. `AF-CAL-01` |

### `POST /api/cases`

Accepts one case, `{ "case": … }`, or `{ "cases": […] }`.

Required: `title`, `stamp`, `context`, `problem`, `options`, `choice`.

**`session` is optional.** Vorflux session id is optional. Linear parent id is what Sam filters on.

If `id` is missing, it is slugged from `title`. If `number` is missing, it is `max(seed + stored) + 1`. If `when` / `timestamp` are missing, they are now. Optional: `tooAggressive`, `yourCall`, `yourCallBody`, `contextLabel` (default `Background`), `choiceLabel` (default `Choice`), `notionUrl`, `archived` (`true` \| `false`), scope fields below.

**`archived` is a real field on `SteerCase`.** GET returns it. Case-level is the source of truth for the Inbox / Filed / Archived section.

When a Tracer hourly page is superseded, POST `{ "id": "<old-case-id>", "archived": true }` (or the full case plus `archived: true`). That shelves the old id. It does **not** set `filedAt` and does **not** notify Oscar's File webhook. `{ "id", "archived": true|false }` on a known case id is enough — you do not have to resend the steer body. `archived: false` puts it back on the live list.

### Scope fields (Oscar / Nick)

**One Linear parent per steer.** Each posted case is about a single project / parent ticket. Do not mix Capture + Sync + Fireflies (or any other combo) into one case body, one `parentId`, or one “mega session.” If Oscar needs Sam’s call on two projects, post **two cases**, each with its own `parentId` / `parentTitle` / `project`. Sam filters and files one parent at a time.

The durable identity of “which parent / which ticket / which project” is a **tracker parent id**, not a Vorflux session.

| Field | Required? | Example | Meaning |
| --- | --- | --- | --- |
| `parentSystem` | strongly yes | `"linear"` | Which system owns `parentId`. Default `linear`. Future-proof if another tracker appears. |
| `parentId` | **yes for new posts** | `"CH-757"` | Unique parent id in that system. For Linear: the issue key. |
| `parentTitle` | recommended | `"Answer Engine Tracer"` | Short title for filter chips. Prefer this over session ids |
| `parentUrl` | recommended | `"https://linear.app/.../CH-757/..."` | Link shown on the board |
| `project` | recommended | `"Tracer"` | Short human label (Capture / Sync / Tracer / Calendar / Fireflies) |
| `spec` | optional | `"AF-CAL-01"` | Spec id or slug when relevant |
| `sessionId` | optional | `"bdacf391"` | Vorflux (or other runner) session id. **Do not require this** — Sam will not always use Vorflux |
| `session` | optional | `"Tracer"` | Legacy display label. If omitted, defaults to `project`, then `parentId`, then `"—"` |

Aliases still accepted: `parentTicket` → `parentId`, `parentTicketUrl` → `parentUrl`. Responses mirror both so older clients keep working. Never send a Vorflux UUID as `project`, `session`, or `parentId` — Sam filters on Linear titles, not session hashes.

```bash
oscar -X POST "$HOST/api/cases" -d '{
  "title": "…",
  "stamp": "KEEP",
  "parentSystem": "linear",
  "parentId": "CH-757",
  "parentTitle": "Answer Engine Tracer",
  "parentUrl": "https://linear.app/the-missionary-company/issue/CH-757/answer-engine-tracer-bullet-approved-better-implementation-package",
  "project": "Tracer",
  "spec": "CH-757",
  "sessionId": "bdacf391",
  "context": "…",
  "problem": "…",
  "options": "…",
  "choice": "…"
}'
```

You write the body. This repo does not ship a sample POST body.

Persisted file: private Blob `steer-cases.json`.

---

## Voice dictation

### `POST /api/transcribe`

Authenticated (cookie or Bearer). Multipart form field `file` = audio (webm/mp4/ogg, max ~3 minutes / 25MB). Returns `{ "text": "…" }` from **Grok Speech-to-Text** (`XAI_API_KEY` on the Vercel project).

Used by the mic buttons next to comment / reply / label inputs. Recording keeps the screen awake (Wake Lock) and auto-stops at 3:00.
## Reviews

### `GET /api/reviews`

Returns `{ "reviews": SteerReview[] }`. Optional `?caseId=`.

```bash
oscar "$HOST/api/reviews"
oscar "$HOST/api/reviews?caseId=sync-was-becoming-a-type-religion"
```

`filedAt` on a review means Sam pressed **Done — file it** and moved the case out of the inbox. Oscar should not clear or invent `filedAt`. Leave it alone on comment/reply. A full `PUT /api/reviews` that omits `filedAt` can wipe Sam’s filing if that PUT wins on `updatedAt` — prefer comment/reply.

### `POST /api/reviews/comment`

Does **not** change Pass/Fail. `author` is `sam` | `oscar` | `oscar-clone`. Defaults `author` to `oscar` when omitted (Oscar Tech Lead’s current clients). `sam` still maps to Sam. Clone must send `author: "oscar-clone"` — do not omit it or Clone will look like Oscar. Unknown `author` is **400**, not coerced to Oscar. `lane` is `content` or `action`. `kind` is `comment` (default) or `question`.

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

# Oscar Clone — must send author (omitting it stores oscar)
oscar -X POST "$HOST/api/reviews/comment" -d '{
  "caseId": "sync-was-becoming-a-type-religion",
  "author": "oscar-clone",
  "lane": "action",
  "text": "I will cut the type chapel."
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

# Oscar Clone — must send author (omitting it stores oscar)
oscar -X POST "$HOST/api/reviews/reply" -d '{
  "caseId": "sync-was-becoming-a-type-religion",
  "noteId": "n-…",
  "author": "oscar-clone",
  "text": "Done."
}'
```

`author` is the same union as comment. Omitted `author` defaults to `oscar`. Clone must send `author: "oscar-clone"`. Unknown `author` is **400**. `noteId` comes from GET. **404** if the note is missing.

### `PUT /api/reviews`

Accepts `{ "review": … }`, `{ "reviews": […] }`, or a reviews array. Merges by `caseId`, keeping the newer `updatedAt`.

**Do not PUT a full review to leave a comment.** That can overwrite Sam’s scores, labels, and highlights. Sam’s board uses PUT when it syncs a review it already edited locally.

### On file

When Sam presses **Done — file it**, the board PUTs that review with a new `filedAt`. After the write succeeds, the server POSTs `{ "caseId": "<id>" }` to Oscar's Grok Bot webhook (`OSCAR_EVAL_WEBHOOK_URL`) with `Authorization: Bearer $OSCAR_EVAL_WEBHOOK_KEY`.

One POST per newly filed `caseId` that the write actually kept. Newly filed means the persisted review has a `filedAt` and the previous stored copy had none, or a different `filedAt` (re-file). A PUT that loses the `updatedAt` merge does not notify.

Not on `POST /api/reviews/comment`. Not on `POST /api/reviews/reply`. Not on keystroke PUTs that leave `filedAt` unchanged. Not on unfile. **Not on archive / unarchive** (`archived` lives on the case via `POST /api/cases`; that path never calls this webhook).

If either env var is missing or blank, the PUT still returns 200 and no webhook fires. A webhook timeout (~3s) or fetch error is swallowed; the PUT still 200s.

---

## Shapes

`SteerCase` required strings: `id`, `title`, `stamp`, `when`, `context`, `problem`, `options`, `choice`. `session` is always present after parse but **optional on POST** (defaults to `project` → `parentId` → `"—"`).

Scope / identity (send these):

- `parentSystem` — default `linear`
- `parentId` — durable parent id (Linear issue key)
- `parentUrl` — optional link
- `project` — optional human label
- `spec` — optional
- `sessionId` — optional Vorflux (or other runner) session id
- Aliases: `parentTicket` / `parentTicketUrl`

Also optional: `number`, `timestamp`, `yourCall`, `tooAggressive`, `yourCallBody`, `contextLabel`, `choiceLabel`, `notionUrl`, `archived` (`true` when the case is on the Archived shelf).

`SteerReview`: `caseId`, `content` / `action` (`passFail` `pass` | `fail` | `null`, `comment`, `labels[]`), `highlights[]`, `notes[]`, `revisions[]`, `chips[]`, `filedAt?` (ISO when Sam filed it out of the inbox), `updatedAt`.

`lane`: `content` | `action`.  
`kind`: `comment` | `question`.  
`author`: `sam` | `oscar` | `oscar-clone`.

---

## Board inbox (Sam)

- Default list is **Inbox** (live cases without `filedAt`). Archived cases are hidden here.
- **Done — file it** sets `filedAt` on that review and jumps to the next inbox case (honoring the parent filter).
- **Filed** is a separate tab so Sam can still find finished live cases. Archived cases are hidden here too.
- **Archived** is a third shelf, closed by default. Open it to see the trail. Unarchive (`archived: false`) returns the case to Inbox or Filed. Not a delete.
- Archive is not File. Do not set `filedAt` when archiving. The File webhook does not fire.
- Filter chips are **Linear parent titles** (`parentSystem:parentId`), e.g. `CH-757 · Answer Engine Tracer`. Inbox / Filed / parent chips hide archived cases.
- **One parent per case.** Mixed-project steers break the filter; Oscar/Nick should split them.

Oscar posts `parentSystem` + `parentId` (Linear), one project at a time. Filing is Sam’s workflow, not an Oscar API action. Archiving a superseded hourly page is Oscar’s `POST /api/cases` with `archived: true` on the old id.

## Errors

| Status | When |
| --- | --- |
| 401 | Missing/wrong Bearer or cookie on `/api/cases` or `/api/reviews*` |
| 400 | Missing required case fields, bad JSON, invalid comment (`caseId` / `text` / `lane` / `author`) |
| 404 | Unknown case, highlight, or note |
| 405 | Wrong method |
| 503 | `BLOB_READ_WRITE_TOKEN` not set |

---

## What this API does not do

- No Process / Run / Evaluate, no LLM judge, no Phoenix, no Braintrust.
- No clustering and no eval-skill run.
- Hub + A1 stays in the browser.
- Applying a strike-through revision from a question is UI-only until an endpoint is added here. To change the stored case text, `POST /api/cases` with the same `id` and the new fields (that is an explicit rewrite, not the overlay).

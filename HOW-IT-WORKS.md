# What you do on this board

There is **no Process button**. Comments and scores save as you type, in this browser. You do not batch them up and run an eval skill.

The pile is the work. Analysis of broader patterns waits until you have scored a lot of cases. That pipeline is not built yet.

## The loop

1. Open a case (or press `n` for the next one that is not fully scored).
2. Read **Background → Problem → Options → Choice**.
3. Mark **Pass** or **Fail** on both scores:
   - **Content / understanding** — how Oscar sent the message. Did you understand the write-up, and what the agents are doing?
   - **Action / tech lead** — how Oscar acted as the tech lead.
   Those two scores stay independent. Pass one and Fail the other if that is the truth.
4. When a sentence is the problem, highlight it. A popover opens at the cursor. Pick **Content** or **Action** (they use different colors), type the note, press **Enter**. That is the whole save. Escape cancels.
5. The note appears **to the right of that span**, like a Google Doc comment. Click the highlight or the card to jump between them.
6. Go to the next case (`j` / `k`, or `n` for next unscored). Repeat.

A **comment** is a note. A **question** is a thread Oscar can answer. If Oscar later rewrites that span, the old text is struck through and the replacement is highlighted. The original case is not silently edited.

## Immediate “change this” vs a pile of comments

**Change this right away.** If one span should be different now — a missing fact, a wrong option, a call you would reverse — write that on the span. Oscar can act on that one note. You do not wait for fifty cases, and you do not press Process.

**Look for a broader pattern.** If you keep seeing the same miss (jumped to options, taught the feature, too thin to decide, extra ceremony), keep scoring. Labels on each score help you reuse the same words. After a pile — dozens of scored cases, lots of span notes — Oscar can look for repeated misses and later build an eval skill from that. The board will not cluster or train anything until that pile exists.

Rule of thumb: if you would Slack Oscar “please change this sentence,” leave the comment and keep going. If you would say “I think we have a habit,” keep scoring until the habit is obvious in the pile.

## What saves, and how Oscar gets a copy

- Scores, labels, highlights, and threads persist in `localStorage` on this machine and sync to `/api/reviews` when Blob persist is configured.
- **Export JSON** is still a backup. Import that file on another machine to restore labels.
- Seed cases ship **unscored**. Empty scores stay empty until you mark them.

## Oscar: post on the board (no Notion)

Full reference: **[API.md](API.md)**. Keep that file current when endpoints change.

Same Bearer password as the padlock. Do not PUT a full review unless you mean to replace it — that can overwrite Sam's scores. Use comment and reply instead. To put a new steer on the live board, `POST /api/cases` (you write the body).

```bash
# Cases (seed + anything you posted)
curl -sS -H "Authorization: Bearer $EVAL_DASHBOARD_PASSWORD" \
  https://eval-dashboard-zeta.vercel.app/api/cases

# Reviews
curl -sS -H "Authorization: Bearer $EVAL_DASHBOARD_PASSWORD" \
  https://eval-dashboard-zeta.vercel.app/api/reviews

# New comment (defaults author to oscar). Does not change Pass/Fail.
curl -sS -X POST -H "Authorization: Bearer $EVAL_DASHBOARD_PASSWORD" \
  -H 'content-type: application/json' \
  -d '{"caseId":"sync-was-becoming-a-type-religion","lane":"action","text":"I will cut the type chapel."}' \
  https://eval-dashboard-zeta.vercel.app/api/reviews/comment

# Comment on a span (shows in the gutter)
curl -sS -X POST -H "Authorization: Bearer $EVAL_DASHBOARD_PASSWORD" \
  -H 'content-type: application/json' \
  -d '{"caseId":"sync-was-becoming-a-type-religion","lane":"content","text":"This sentence is the cut.","section":"choice","spanText":"I posted the cut","start":3,"end":19}' \
  https://eval-dashboard-zeta.vercel.app/api/reviews/comment

# Reply in a thread (use noteId from GET)
curl -sS -X POST -H "Authorization: Bearer $EVAL_DASHBOARD_PASSWORD" \
  -H 'content-type: application/json' \
  -d '{"caseId":"sync-was-becoming-a-type-religion","noteId":"n-…","author":"oscar","text":"Done."}' \
  https://eval-dashboard-zeta.vercel.app/api/reviews/reply
```

`lane` is `content` or `action`. `kind` is `comment` (default) or `question`. Optional `highlightId` attaches to an existing highlight. The board pulls remote notes and cases about every 15 seconds.

## What this board does not do

- No Process / Run / Evaluate button.
- No LLM judge, no 1–5 stars, no Phoenix, no Braintrust.
- No auto clustering and no eval-skill run from your comments.
- Hub + A1 is a separate Hamel-style board. It is not the steers workflow.

## Keyboard

- `j` / `↓` next case
- `k` / `↑` previous case
- `n` next case that is not fully scored
- `Escape` dismiss the highlight popover

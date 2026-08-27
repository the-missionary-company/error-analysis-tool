import { useState } from 'react';
import { CHIP_DEFS, LANE_DEFS, addLaneLabel, removeLaneLabel } from '../lib/steers';
import { cn, formatDate } from '../lib/utils';
import type { LaneScore, PassFail, ScoreLane, SteerHighlight, SteerReview } from '../types/steers';

const LANES: ScoreLane[] = ['content', 'action'];

export function SteerScorePanel({
  review,
  reuseByLane,
  onLaneChange,
  onRemoveHighlight,
  onFocusHighlight,
}: {
  review: SteerReview;
  reuseByLane: Record<ScoreLane, string[]>;
  onLaneChange: (lane: ScoreLane, next: LaneScore) => void;
  onRemoveHighlight: (id: string) => void;
  onFocusHighlight: (highlight: SteerHighlight) => void;
}) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-[4.5rem]">
      {LANES.map((lane) => (
        <LaneCard
          key={lane}
          lane={lane}
          score={review[lane]}
          reuse={reuseByLane[lane]}
          onChange={(next) => onLaneChange(lane, next)}
        />
      ))}

      {review.highlights.length > 0 && (
        <section className="card p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
            Highlights ({review.highlights.length})
          </div>
          <ul className="space-y-3">
            {review.highlights.map((h) => (
              <li key={h.id} className="rounded-lg bg-ink-50/80 px-3 py-2.5">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => onFocusHighlight(h)}
                >
                  <p className="text-[11px] font-medium text-ink-400">
                    {LANE_DEFS[h.lane].title} · {h.section}
                    {h.passFail ? ` · ${h.passFail}` : ''}
                  </p>
                  <p className="mt-1 text-sm italic text-ink-800">“{h.text}”</p>
                  {h.comment && <p className="mt-1 text-sm text-ink-600">{h.comment}</p>}
                </button>
                <button
                  type="button"
                  className="mt-2 text-xs text-ink-400 hover:text-fail"
                  onClick={() => onRemoveHighlight(h.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {review.updatedAt && (
        <p className="px-1 text-xs text-ink-400">
          Saved locally {formatDate(review.updatedAt)}
        </p>
      )}
    </aside>
  );
}

function LaneCard({
  lane,
  score,
  reuse,
  onChange,
}: {
  lane: ScoreLane;
  score: LaneScore;
  reuse: string[];
  onChange: (next: LaneScore) => void;
}) {
  const def = LANE_DEFS[lane];
  return (
    <section className="card p-4">
      <div className="text-sm font-semibold text-ink-950">{def.title}</div>
      <p className="mt-1 text-sm font-medium leading-snug text-ink-800">{def.question}</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-500">{def.hint}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <PassFailButton
          value="pass"
          active={score.passFail === 'pass'}
          onClick={() =>
            onChange({
              ...score,
              passFail: score.passFail === 'pass' ? null : 'pass',
            })
          }
        />
        <PassFailButton
          value="fail"
          active={score.passFail === 'fail'}
          onClick={() =>
            onChange({
              ...score,
              passFail: score.passFail === 'fail' ? null : 'fail',
            })
          }
        />
      </div>
      <LaneLabelEditor
        lane={lane}
        labels={score.labels}
        reuse={reuse}
        onChange={(labels) => onChange({ ...score, labels })}
      />
      <label className="mt-3 block text-xs font-medium text-ink-500" htmlFor={`${lane}-comment`}>
        {def.title} comment
      </label>
      <textarea
        id={`${lane}-comment`}
        value={score.comment}
        onChange={(e) => onChange({ ...score, comment: e.target.value })}
        placeholder={def.placeholder}
        className="mt-1 min-h-[110px] w-full resize-y rounded-lg border border-ink-200 bg-ink-50/50 px-3 py-2.5 text-sm leading-relaxed text-ink-900 placeholder:text-ink-400 focus:border-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
    </section>
  );
}

function LaneLabelEditor({
  lane,
  labels,
  reuse,
  onChange,
}: {
  lane: ScoreLane;
  labels: string[];
  reuse: string[];
  onChange: (labels: string[]) => void;
}) {
  const [draft, setDraft] = useState('');
  const applied = new Set(labels.map((l) => l.toLowerCase()));
  const reuseOptions = reuse.filter((l) => !applied.has(l.toLowerCase()));
  const starters = CHIP_DEFS.map((c) => c.label).filter((l) => !applied.has(l.toLowerCase()));

  const add = (raw: string) => {
    onChange(addLaneLabel(labels, raw));
    setDraft('');
  };

  return (
    <div className="mt-3">
      <div className="text-xs font-medium text-ink-500">{LANE_DEFS[lane].title} labels</div>
      <p className="mt-0.5 text-[11px] leading-relaxed text-ink-400">
        This score only. Type a new one or reuse one already used on {LANE_DEFS[lane].title}.
      </p>
      {labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {labels.map((label) => (
            <button
              key={label}
              type="button"
              className="inline-flex items-center gap-1 rounded-full bg-ink-900 px-2.5 py-1 text-left text-xs text-white"
              onClick={() => onChange(removeLaneLabel(labels, label))}
              title="Remove from this score"
            >
              {label}
              <span aria-hidden="true" className="text-white/70">
                ×
              </span>
            </button>
          ))}
        </div>
      )}
      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add(draft);
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a label for this score"
          className="min-w-0 flex-1 rounded-lg border border-ink-200 px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <button type="submit" className="btn-secondary h-9 px-3 text-xs">
          Add
        </button>
      </form>
      {reuseOptions.length > 0 && (
        <div className="mt-2">
          <p className="text-[11px] font-medium text-ink-400">Reuse on this score</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {reuseOptions.map((label) => (
              <button
                key={label}
                type="button"
                className="rounded-full bg-white px-2.5 py-1 text-left text-xs text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50"
                onClick={() => add(label)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
      {starters.length > 0 && (
        <div className="mt-2">
          <p className="text-[11px] font-medium text-ink-400">Named misses (optional)</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {starters.map((label) => (
              <button
                key={label}
                type="button"
                className="rounded-full bg-white px-2.5 py-1 text-left text-xs text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50"
                onClick={() => add(label)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PassFailButton({
  value,
  active,
  onClick,
}: {
  value: Exclude<PassFail, null>;
  active: boolean;
  onClick: () => void;
}) {
  const pass = value === 'pass';
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        pass ? 'btn-pass' : 'btn-fail',
        'h-11 text-base',
        active && (pass ? 'ring-2 ring-pass ring-offset-1' : 'ring-2 ring-fail ring-offset-1'),
      )}
    >
      {pass ? 'Pass' : 'Fail'}
    </button>
  );
}

import { CHIP_DEFS, LANE_DEFS } from '../lib/steers';
import { cn, formatDate } from '../lib/utils';
import type { LaneScore, PassFail, ScoreLane, SteerChipId, SteerHighlight, SteerReview } from '../types/steers';

const LANES: ScoreLane[] = ['content', 'action'];

export function SteerScorePanel({
  review,
  onLaneChange,
  onToggleChip,
  onRemoveHighlight,
  onFocusHighlight,
}: {
  review: SteerReview;
  onLaneChange: (lane: ScoreLane, next: LaneScore) => void;
  onToggleChip: (chip: SteerChipId) => void;
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
          onChange={(next) => onLaneChange(lane, next)}
        />
      ))}

      <section className="card p-4">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">
          Optional chips
        </div>
        <p className="mb-3 text-xs leading-relaxed text-ink-500">
          Named misses, not the score. Content / understanding and Action / tech lead stay independent.
        </p>
        <div className="flex flex-wrap gap-2">
          {CHIP_DEFS.map((chip) => {
            const on = review.chips.includes(chip.id);
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => onToggleChip(chip.id)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-left text-xs ring-1 transition',
                  on
                    ? 'bg-ink-900 text-white ring-ink-900'
                    : 'bg-white text-ink-600 ring-ink-200 hover:bg-ink-50',
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </section>

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
  onChange,
}: {
  lane: ScoreLane;
  score: LaneScore;
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

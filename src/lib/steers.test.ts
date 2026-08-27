import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SEED_STEER_IDS } from '../data/seedCaseIds';
import { SEED_STEERS } from '../data/steerSeed';
import {
  CHIP_DEFS,
  LANE_DEFS,
  applyHighlightSegments,
  addLaneLabel,
  addThreadReply,
  applyBodySegments,
  createRevisionFromQuestion,
  emptyReview,
  exportSteerBoardJSON,
  findSpanOffsets,
  mergeCases,
  usedLabelsForLane,
  parseSteerCases,
  parseSteerPayload,
  parseSteerReviews,
  reviewIsEmpty,
  attachSpanNotes,
  caseProgress,
  sortCases,
} from './steers';

function expectEmptyScores(caseId: string) {
  const review = emptyReview(caseId);
  expect(review.caseId).toBe(caseId);
  expect(review.content).toEqual({ passFail: null, comment: '', labels: [] });
  expect(review.action).toEqual({ passFail: null, comment: '', labels: [] });
  expect(review.highlights).toEqual([]);
  expect(review.chips).toEqual([]);
  expect(review.notes).toEqual([]);
  expect(review.revisions).toEqual([]);
  expect(reviewIsEmpty(review)).toBe(true);
}

describe('seed cases', () => {
  it('rewrites every steer as Background / Problem / Options / Choice with empty scores', () => {
    expect(SEED_STEERS).toHaveLength(32);
    expect(SEED_STEERS.map((item) => item.id)).toEqual([...SEED_STEER_IDS]);
    for (const seed of SEED_STEERS) {
      expect(seed.contextLabel).toBe('Background');
      expect(seed.choiceLabel).toBe('Choice');
      expect(seed.context.length).toBeGreaterThan(40);
      expect(seed.problem.length).toBeGreaterThan(20);
      expect(seed.options.length).toBeGreaterThan(20);
      expect(seed.choice.length).toBeGreaterThan(10);
      expectEmptyScores(seed.id);
    }
  });

  it('includes the production-migration HOLD steer with no invented scores', () => {
    const seed = SEED_STEERS.find((item) => item.id === 'will-not-green-production-migration');
    expect(seed).toBeDefined();
    expect(seed!.id).toBe('will-not-green-production-migration');
    expect(seed.title).toBe('3. Will not green a production migration to make a check pretty');
    expect(seed!.session).toBe('Capture');
    expect(seed!.stamp).toBe('HOLD');
    expect(seed!.yourCall).toBe('Softer');
    expect(seed!.when).toBe('2026-08-27');
    expect(seed.notionUrl).toBe(
      'https://app.notion.com/p/3c9efde7642b81ea8bcee31574c844f3',
    );
    expect(seed!.number).toBe(3);
    expect(seed!.timestamp).toBe('2026-08-27T02:47:44Z');
    expect(seed!.tooAggressive).toBe('No');
    expect(seed!.context).toContain('Linear Done on CH-807/808/809 is not that unlock');
    expect(seed!.context).toContain('58 missing objects');
    expect(seed!.problem).toContain('Agents treat a red check like a test');
    expect(seed!.options).toContain('HOLD (what I did first)');
    expect(seed!.choice).toContain('I do not type secrets');
    expect(seed!.choice).toContain('nonce-ledger SQL');
    expectEmptyScores(seed!.id);
  });

  it('includes steer 1 Sync type-religion body verbatim with empty scores', () => {
    const seed = SEED_STEERS.find((item) => item.id === 'sync-was-becoming-a-type-religion');
    expect(seed?.number).toBe(1);
    expect(seed?.timestamp).toBe('2026-08-27T02:47:44Z');
    expect(seed?.context).toContain('It cannot see that Sync is a plaque, not a hose');
    expect(seed?.context).toContain('sharepoint_folder');
    expect(seed?.problem).toContain('type religion plus a new Outlook scheduler harness');
    expect(seed?.options).toContain('Cut the suite');
    expect(seed?.choice).toContain('PR #1027 was two files, 170/170');
    expectEmptyScores(seed!.id);
  });

  it('includes steer 2 pigeon-count body verbatim with empty scores', () => {
    const seed = SEED_STEERS.find((item) => item.id === 'capture-counted-pigeons-on-vercel');
    expect(seed?.number).toBe(2);
    expect(seed?.timestamp).toBe('2026-08-27T02:47:44Z');
    expect(seed?.context).toContain('2,111-attempt ignored-build scan on Vercel');
    expect(seed?.problem).toContain('counting pigeons');
    expect(seed?.choice).toContain('I cannot show the cut POST');
    expectEmptyScores(seed!.id);
  });

  it('fills steers 4-9 with Background / Problem / Options / Choice', () => {
    expect(SEED_STEERS.find((item) => item.id === 'calendar-stays-planning')?.context).toContain(
      'AF-CAL-01',
    );
    expect(SEED_STEERS.find((item) => item.id === 'calendar-stays-planning')?.choice).toContain(
      'I did not click Approve',
    );
    expect(SEED_STEERS.find((item) => item.id === 'capture-ran-the-whole-test-house')?.choice).toContain(
      '16-failure archaeology',
    );
    expect(SEED_STEERS.find((item) => item.id === 'i-over-kicked-hold-children-at-11-11')?.choice).toContain(
      'This page is the 11:11 kick',
    );
    expect(
      SEED_STEERS.find((item) => item.id === 'overnight-calendar-kick-may-have-invited-a-draft')?.context,
    ).toContain('do not wait for Approve');
  });

  it('includes steer 10 parked-Capture body verbatim with empty scores', () => {
    const seed = SEED_STEERS.find((item) => item.id === 'parked-capture-after-child-finished');
    expect(seed).toBeDefined();
    expect(seed?.title).toBe('10. I parked Capture after the child finished');
    expect(seed?.session).toBe('Capture');
    expect(seed?.stamp).toBe('Kick');
    expect(seed?.tooAggressive).toBe('Yes');
    expect(seed?.yourCall).toBe('Open');
    expect(seed?.when).toBe('2026-08-27');
    expect(seed?.number).toBe(10);
    expect(seed?.timestamp).toBe('2026-08-27T04:37:42Z');
    expect(seed?.notionUrl).toBe(
      'https://app.notion.com/p/3c9efde7642b8130a934e01f8669bac3',
    );
    expect(seed?.context).toContain('Child `12fbfa57` had one job');
    expect(seed?.problem).toContain('A finished child is not a stop');
    expect(seed?.options).toContain('Ask remaining, then stamp');
    expect(seed?.choice).toContain('I should have done C the moment the child archived');
    expect(seed?.yourCallBody).toBe(
      'Open. Score Content on whether this closes the gap. Score Action on the park and the blank check.',
    );
    expectEmptyScores(seed!.id);
  });

  it('includes steer 11 Tracer keep-moving body verbatim with empty scores', () => {
    const seed = SEED_STEERS.find((item) => item.id === 'tracer-keep-moving-as-apply-auth');
    expect(seed).toBeDefined();
    expect(seed?.title).toBe('11. Tracer treated keep-moving as apply auth');
    expect(seed?.session).toBe('Tracer');
    expect(seed?.stamp).toBe('HOLD');
    expect(seed?.tooAggressive).toBe('Yes');
    expect(seed?.yourCall).toBe('Open');
    expect(seed?.when).toBe('2026-08-27');
    expect(seed?.number).toBe(11);
    expect(seed?.timestamp).toBe('2026-08-27T04:37:52Z');
    expect(seed?.notionUrl).toBe(
      'https://app.notion.com/p/3c9efde7642b8168bcc4e513f0c0a805',
    );
    expect(seed?.context).toContain('They applied the CH-822 read RPC to production');
    expect(seed?.problem).toContain('downside of steer 10 option B');
    expect(seed?.options).toContain('I never send keep moving as the plan');
    expect(seed?.choice).toContain('I should have done C before the kick');
    expect(seed?.yourCallBody).toBe('Open.');
    expectEmptyScores(seed!.id);
  });

  it('includes steer 12 task-done vs project-done body verbatim with empty scores', () => {
    const seed = SEED_STEERS.find((item) => item.id === 'task-done-is-not-project-done');
    expect(seed).toBeDefined();
    expect(seed?.title).toBe('12. Task-done is not project-done');
    expect(seed?.session).toBe('Mixed');
    expect(seed?.stamp).toBe('CUT');
    expect(seed?.tooAggressive).toBe('Yes');
    expect(seed?.yourCall).toBe('Open');
    expect(seed?.when).toBe('2026-08-27');
    expect(seed?.number).toBe(12);
    expect(seed?.timestamp).toBe('2026-08-27T05:12:14Z');
    expect(seed?.notionUrl).toBe(
      'https://app.notion.com/p/3c9efde7642b8105ac55ded3d1c095a0',
    );
    expect(seed?.context).toContain("take a look at Capture, it's done, so is Sync");
    expect(seed?.problem).toContain('"Done" has two meanings');
    expect(seed?.options).toContain('Treat every "done" as project-done and archive');
    expect(seed?.choice).toContain('C is the job. I did A');
    expect(seed?.yourCallBody).toBe(
      'Open. Score Content on whether this closes the gap. Score Action on the archive.',
    );
    expectEmptyScores(seed!.id);
  });

  it('includes steer 13 dress-rehearsal body verbatim with empty scores', () => {
    const seed = SEED_STEERS.find((item) => item.id === 'held-the-undoable-dress-rehearsal');
    expect(seed).toBeDefined();
    expect(seed?.title).toBe('13 Held the undoable dress rehearsal');
    expect(seed?.session).toBe('Capture');
    expect(seed?.stamp).toBe('HOLD');
    expect(seed?.tooAggressive).toBe('Open');
    expect(seed?.yourCall).toBe('Open');
    expect(seed?.when).toBe('2026-08-27');
    expect(seed?.number).toBe(13);
    expect(seed?.timestamp).toBe('2026-08-27T05:57:00Z');
    expect(seed?.notionUrl).toBe(
      'https://app.notion.com/p/3c9efde7642b81b9a3c8f6385dd48589',
    );
    expect(seed?.contextLabel).toBe('Background');
    expect(seed?.choiceLabel).toBe('Choice');
    expect(seed?.context).toContain('I was over-correcting so I would not be the accountant');
    expect(seed?.problem).toContain('"of course go."');
    expect(seed?.options).toContain('KEEP undoable production after a reverse-check');
    expect(seed?.choice).toContain('You locked this 27 Aug 14:53–14:56 Seoul');
    expectEmptyScores(seed!.id);
  });

  it('includes steer 14 HMAC and cheap smoke body verbatim with empty scores', () => {
    const seed = SEED_STEERS.find((item) => item.id === 'do-the-hmac-and-the-cheap-smoke-yourself');
    expect(seed).toBeDefined();
    expect(seed?.title).toBe('14 Do the HMAC and the cheap smoke yourself');
    expect(seed?.session).toBe('Mixed');
    expect(seed?.stamp).toBe('HOLD');
    expect(seed?.tooAggressive).toBe('Open');
    expect(seed?.yourCall).toBe('Open');
    expect(seed?.when).toBe('2026-08-27');
    expect(seed?.number).toBe(14);
    expect(seed?.timestamp).toBe('2026-08-27T06:08:41Z');
    expect(seed?.notionUrl).toBe(
      'https://app.notion.com/p/3c9efde7642b815b911ee833e2d4a501',
    );
    expect(seed?.contextLabel).toBe('Background');
    expect(seed?.choiceLabel).toBe('Choice');
    expect(seed?.context).toContain('I was making you the operator');
    expect(seed?.problem).toContain('Handing you Slack babysitting for a fake HMAC is not authority');
    expect(seed?.options).toContain('I mint, Slack myself the copy');
    expect(seed?.choice).toContain('You locked this 27 Aug 15:08 Seoul');
    expectEmptyScores(seed!.id);
  });

  it('includes steer 15 Vitest-sweep body verbatim with empty scores', () => {
    const seed = SEED_STEERS.find(
      (item) => item.id === 'the-vitest-sweep-is-the-agent-making-itself-feel-safe',
    );
    expect(seed).toBeDefined();
    expect(seed?.title).toBe('15 The Vitest sweep is the agent making itself feel safe');
    expect(seed?.session).toBe('Capture');
    expect(seed?.stamp).toBe('CUT');
    expect(seed?.tooAggressive).toBe('Open');
    expect(seed?.yourCall).toBe('Open');
    expect(seed?.when).toBe('2026-08-27');
    expect(seed?.number).toBe(15);
    expect(seed?.timestamp).toBe('2026-08-27T06:27:50Z');
    expect(seed?.notionUrl).toBe(
      'https://app.notion.com/p/3c9efde7642b81ba8422f3abf2db116d',
    );
    expect(seed?.contextLabel).toBe('Background');
    expect(seed?.choiceLabel).toBe('Choice');
    expect(seed?.context).toBe(
      `Capture is still \`closed/6\`. Ken cannot review tonight until the fake canary walks and we turn the tray back on. HMAC is already on the attended host. The one dirty preflight was not a surprise: the nonce ledger and one alias receipt already exist at \`closed/6\`, because that SQL was already applied. Oscar told the session to name that one fact, treat it as applied, and run the fake Meeting walk.
The session did classify the ledger correctly. Then it ran six Vitest files, 54 tests, all for the #1017 canary package. Then it said the next step was the exact #1017 merge-and-deploy path, and only after that the single walk.
That is the agent's head. It does not think the job is "one fake Meeting." It thinks the job is "do not be the agent that ships a dirty canary." It just hit \`ch810_preflight_not_clean\`. The proof it knows how to generate is every test that belongs to this PR. Merge, then deploy, feels like the honest path after steer 11, when keep-moving got treated as apply auth. From inside the session, 54 tests is diligence. It cannot see Ken tonight. It can see a test file.`,
    );
    expect(seed?.problem).toBe(
      `Diligence that does not move the fence is over-engineering. The remaining work that completes this project is the walk, the rollback, and reopen. The suite does not reopen anything. After the one dirty fact is classified, more unit tests are the agent making itself feel safe. Sam is waiting. He already said there will be bugs and those are later.`,
    );
    expect(seed?.options).toBe(
      `A. Let it finish the suite, merge #1017 to green, deploy, then walk. Pro: its checklist is complete. Con: this is how the afternoon dies, and Ken sits in front of "Capture is offline." LOE: another pile of ceremony on a two-way door.
B. CUT the sweep. Deploy only if the walk actually needs that PR on production. Walk. Rollback. Reopen. Pro: matches the remaining work. Con: a real failure might have lived in a file it never ran. LOE: the canary we already have.
C. Ask Sam whether tests are required this time. Pro: he decides the diligence. Con: he already said get through this so Capture can come back on. LOE: his time.`,
    );
    expect(seed?.choice).toBe(
      `B. The useful thought was "nonce ledger already applied." The 54 tests after that were not a canary. I cut them. Search-icon and the other UI bugs stay later.`,
    );
    expectEmptyScores(seed!.id);
  });

  it('includes steer 16 parked-Tracer body verbatim with empty scores', () => {
    const seed = SEED_STEERS.find((item) => item.id === 'i-parked-tracer-after-cutting-the-chapel');
    expect(seed?.number).toBe(16);
    expect(seed?.title).toBe('16 I parked Tracer after cutting the chapel');
    expect(seed?.session).toBe('Tracer');
    expect(seed?.stamp).toBe('CUT');
    expect(seed?.timestamp).toBe('2026-08-27T09:58:03Z');
    expect(seed?.notionUrl).toBe('https://app.notion.com/p/3c9efde7642b81aab1c2c67442c5c2ab');
    expect(seed?.context).toContain('CH-824 generation-to-member projection adapter');
    expect(seed?.problem).toContain('A CUT is a chapel, not the parent');
    expect(seed?.options).toContain('Unpark the parent');
    expect(seed?.choice).toContain('I unparked Tracer at 16:54');
    expectEmptyScores(seed!.id);
  });

  it('includes steer 17 Calendar verification-plan body verbatim with empty scores', () => {
    const seed = SEED_STEERS.find(
      (item) => item.id === 'calendar-wrote-a-verification-plan-instead-of-code',
    );
    expect(seed?.number).toBe(17);
    expect(seed?.title).toBe('17 Calendar wrote a verification plan instead of code');
    expect(seed?.session).toBe('Calendar');
    expect(seed?.stamp).toBe('CUT');
    expect(seed?.timestamp).toBe('2026-08-27T09:58:03Z');
    expect(seed?.notionUrl).toBe('https://app.notion.com/p/3c9efde7642b81cdaaf8c175d4855722');
    expect(seed?.context).toContain('Sam approved AF-CAL-01 at 18:38');
    expect(seed?.problem).toContain('verification-plan chapel');
    expect(seed?.options).toContain('CUT the verification-plan lane');
    expect(seed?.choice).toContain('Night watch cut the verification-plan cathedral at 18:44');
    expectEmptyScores(seed!.id);
  });

  it('includes steers 18-22 before-guide bodies verbatim with markdown links and empty scores', () => {
    const tracer = SEED_STEERS.find(
      (item) => item.id === 'before-guide-tracer-defer-polish-vs-remaining-ch-757',
    );
    expect(tracer?.number).toBe(18);
    expect(tracer?.stamp).toBe('CUT');
    expect(tracer?.timestamp).toBe('2026-08-27T11:52:26Z');
    expect(tracer?.context).toContain(
      '[CH-757](https://linear.app/the-missionary-company/issue/CH-757/answer-engine-tracer-bullet-approved-better-implementation-package)',
    );
    expect(tracer?.context).toContain(
      '[#1042](https://github.com/the-missionary-company/central-hub/pull/1042)',
    );
    expect(tracer?.choice).toContain(
      '[#1029](https://github.com/the-missionary-company/central-hub/pull/1029)',
    );
    expect(tracer?.choice).toContain('A, then stop');
    expectEmptyScores(tracer!.id);

    const capture = SEED_STEERS.find(
      (item) => item.id === 'before-guide-capture-ken-bugs-vs-stolen-adapters',
    );
    expect(capture?.number).toBe(19);
    expect(capture?.context).toContain(
      '[CH-807](https://linear.app/the-missionary-company/issue/CH-807/generic-capture-review-core)',
    );
    expect(capture?.choice).toContain('KEEP Ken behavioral bugs and finish Narrow');
    expectEmptyScores(capture!.id);

    const sync = SEED_STEERS.find(
      (item) => item.id === 'before-guide-sync-1018-reverse-check-vs-invented-w3',
    );
    expect(sync?.number).toBe(20);
    expect(sync?.stamp).toBe('KEEP');
    expect(sync?.context).toContain(
      '[#1018](https://github.com/the-missionary-company/central-hub/pull/1018)',
    );
    expect(sync?.choice).toContain('KEEP the reverse-check they already started');
    expectEmptyScores(sync!.id);

    const fireflies = SEED_STEERS.find(
      (item) => item.id === 'before-guide-fireflies-one-resolver-vs-the-rest-of-ch-802',
    );
    expect(fireflies?.number).toBe(21);
    expect(fireflies?.context).toContain('resolveRegistryValidatedTarget');
    expect(fireflies?.choice).toContain('FIREFLIES_CAPTURE_REVIEW_ENABLED');
    expectEmptyScores(fireflies!.id);

    const calendar = SEED_STEERS.find(
      (item) => item.id === 'before-guide-calendar-ch-827-pr-a-vs-shared-registry',
    );
    expect(calendar?.number).toBe(22);
    expect(calendar?.context).toContain(
      '[CH-827](https://linear.app/the-missionary-company/issue/CH-827/foundation-cal-01-exact-providersource-kind-registry-handoff)',
    );
    expect(calendar?.choice).toContain('KEEP CH-827 PR A as written');
    expectEmptyScores(calendar!.id);
  });

  it('includes steers 23-27 finish-path bodies verbatim with How we finish on problem and empty scores', () => {
    const first22 = SEED_STEERS.slice(0, 22).map((item) => item.id);
    expect(first22).toEqual([
      'sync-was-becoming-a-type-religion',
      'capture-counted-pigeons-on-vercel',
      'will-not-green-production-migration',
      'calendar-stays-planning',
      'capture-ran-the-whole-test-house',
      'i-over-kicked-hold-children-at-11-11',
      'idle-keep-moving-vs-sitting-still',
      'morning-remaining-work-ask-on-all-five',
      'overnight-calendar-kick-may-have-invited-a-draft',
      'parked-capture-after-child-finished',
      'tracer-keep-moving-as-apply-auth',
      'task-done-is-not-project-done',
      'held-the-undoable-dress-rehearsal',
      'do-the-hmac-and-the-cheap-smoke-yourself',
      'the-vitest-sweep-is-the-agent-making-itself-feel-safe',
      'i-parked-tracer-after-cutting-the-chapel',
      'calendar-wrote-a-verification-plan-instead-of-code',
      'before-guide-tracer-defer-polish-vs-remaining-ch-757',
      'before-guide-capture-ken-bugs-vs-stolen-adapters',
      'before-guide-sync-1018-reverse-check-vs-invented-w3',
      'before-guide-fireflies-one-resolver-vs-the-rest-of-ch-802',
      'before-guide-calendar-ch-827-pr-a-vs-shared-registry',
    ]);

    const tracer = SEED_STEERS.find(
      (item) => item.id === 'finish-path-tracer-smoke-after-annotations-trial-later',
    );
    expect(tracer?.number).toBe(23);
    expect(tracer?.title).toBe('23 Finish path Tracer — smoke after annotations, trial later');
    expect(tracer?.session).toBe('Tracer');
    expect(tracer?.stamp).toBe('KEEP');
    expect(tracer?.tooAggressive).toBe('Open');
    expect(tracer?.yourCall).toBe('Open');
    expect(tracer?.when).toBe('2026-08-27');
    expect(tracer?.timestamp).toBe('2026-08-27T12:09:14Z');
    expect(tracer?.notionUrl).toBe('https://app.notion.com/p/3c9efde7642b8130a1efc9dcac327785');
    expect(tracer?.contextLabel).toBe('Background');
    expect(tracer?.choiceLabel).toBe('Choice');
    expect(tracer).not.toHaveProperty('howWeFinish');
    expect(tracer?.context).toContain(
      '[CH-757](https://linear.app/the-missionary-company/issue/CH-757/answer-engine-tracer-bullet-approved-better-implementation-package)',
    );
    expect(tracer?.context).toContain(
      '[#1042](https://github.com/the-missionary-company/central-hub/pull/1042)',
    );
    expect(tracer?.context).toContain(
      '[CH-782](https://linear.app/the-missionary-company/issue/CH-782/ae-an-01b-secure-annotation-persistence-and-routes)',
    );
    expect(tracer?.context).toContain('From inside the session, (4) is a locked door, so it keeps polishing buttons.');
    expect(tracer?.problem).toContain(
      'We do not finish Tracer by inventing Defer dialogs. We also do not finish it by starting the trial.',
    );
    expect(tracer?.problem).toContain('\nHow we finish\n1. Stop isolated UI. #1044 is the last nit, not remaining work.');
    expect(tracer?.problem).toContain(
      '[#1029](https://github.com/the-missionary-company/central-hub/pull/1029) if it is more production SQL stays HOLD.',
    );
    expect(tracer?.options).toContain('Guide them onto that finish path.');
    expect(tracer?.choice).toContain(
      'A. I tell Tracer: remaining to finish this project is annotations, then your smoke.',
    );
    expectEmptyScores(tracer!.id);

    const capture = SEED_STEERS.find(
      (item) => item.id === 'finish-path-capture-ken-bugs-then-close-adapters-elsewhere',
    );
    expect(capture?.number).toBe(24);
    expect(capture?.title).toBe('24 Finish path Capture — Ken bugs then close, adapters elsewhere');
    expect(capture?.session).toBe('Capture');
    expect(capture?.notionUrl).toBe('https://app.notion.com/p/3c9efde7642b810887ccdfde3fe739fd');
    expect(capture?.context).toContain(
      '[CH-807](https://linear.app/the-missionary-company/issue/CH-807/generic-capture-review-core)',
    );
    expect(capture?.context).toContain(
      '[CH-704](https://linear.app/the-missionary-company/issue/CH-704/wave-1-implement-general-capture-correction-lifecycle-across-project)',
    );
    expect(capture?.problem).toContain(
      'If we let this tray become those connectors, generalization never closes.',
    );
    expect(capture?.problem).toContain('\nHow we finish\n1. KEEP Ken-found behavior and the Narrow handoff.');
    expect(capture?.choice).toContain('remaining to finish this project is Ken bugs and Narrow');
    expectEmptyScores(capture!.id);

    const sync = SEED_STEERS.find((item) => item.id === 'finish-path-sync-dark-1018-then-close-w2');
    expect(sync?.number).toBe(25);
    expect(sync?.title).toBe('25 Finish path Sync — dark #1018 then close W2');
    expect(sync?.session).toBe('Sync');
    expect(sync?.notionUrl).toBe('https://app.notion.com/p/3c9efde7642b81e59200ccf3cfbddd04');
    expect(sync?.context).toContain(
      '[#1018](https://github.com/the-missionary-company/central-hub/pull/1018)',
    );
    expect(sync?.context).toContain('`cac140dc`');
    expect(sync?.problem).toContain(
      'Finishing this project is: get the isolated acceptance stack onto main if it is dark, then stop.',
    );
    expect(sync?.problem).toContain('\nHow we finish\n1. Finish the #1018 reverse-check (already started).');
    expect(sync?.choice).toContain('remaining to finish this project is the #1018 reverse-check');
    expectEmptyScores(sync!.id);

    const fireflies = SEED_STEERS.find(
      (item) => item.id === 'finish-path-fireflies-default-off-copy-path-flag-later',
    );
    expect(fireflies?.number).toBe(26);
    expect(fireflies?.title).toBe('26 Finish path Fireflies — default-off copy path, flag later');
    expect(fireflies?.session).toBe('Fireflies');
    expect(fireflies?.notionUrl).toBe('https://app.notion.com/p/3c9efde7642b8188b30ce5f8428a45f8');
    expect(fireflies?.context).toContain(
      '[CH-799](https://linear.app/the-missionary-company/issue/CH-799/dormant-forecast-only-meetings-fireflies-implementation-increment)',
    );
    expect(fireflies?.context).toContain('`FIREFLIES_CAPTURE_REVIEW_ENABLED`');
    expect(fireflies?.problem).toContain('That is CH-802, and it is real remaining.');
    expect(fireflies?.problem).toContain(
      '\nHow we finish\n1. KEEP default-off publication composition that reuses existing functions',
    );
    expect(fireflies?.choice).toContain(
      'remaining to finish this project is the default-off copy-to-inbox composition',
    );
    expectEmptyScores(fireflies!.id);

    const calendar = SEED_STEERS.find(
      (item) => item.id === 'finish-path-calendar-isolated-registry-af-cal-02-later',
    );
    expect(calendar?.number).toBe(27);
    expect(calendar?.title).toBe('27 Finish path Calendar — isolated registry, AF-CAL-02 later');
    expect(calendar?.session).toBe('Calendar');
    expect(calendar?.notionUrl).toBe('https://app.notion.com/p/3c9efde7642b81648114cace8047602d');
    expect(calendar?.context).toContain(
      '[#1043](https://github.com/the-missionary-company/central-hub/pull/1043)',
    );
    expect(calendar?.context).toContain(
      '[CH-827](https://linear.app/the-missionary-company/issue/CH-827/foundation-cal-01-exact-providersource-kind-registry-handoff)',
    );
    expect(calendar?.problem).toContain('PR B (consumers) is the collision with Capture.');
    expect(calendar?.problem).toContain(
      '\nHow we finish\n1. KEEP CH-827 PR A only if current SharePoint / Smartsheet callers stay safe without a migration.',
    );
    expect(calendar?.choice).toContain(
      'remaining to finish this isolated project is CH-827 PR A, then park.',
    );
    expectEmptyScores(calendar!.id);
  });

  it('includes steers 28-32 plan-verdict bodies verbatim with empty scores', () => {
    expect(SEED_STEERS.slice(0, 27).map((item) => item.id)).toEqual([...SEED_STEER_IDS].slice(0, 27));

    const tracer = SEED_STEERS.find(
      (item) => item.id === 'plan-verdict-tracer-cut-defer-park-on-annotations',
    );
    expect(tracer?.number).toBe(28);
    expect(tracer?.title).toBe('28. Plan verdict Tracer — cut Defer, park on annotations');
    expect(tracer?.session).toBe('Tracer');
    expect(tracer?.stamp).toBe('CUT');
    expect(tracer?.timestamp).toBe('2026-08-27T12:39:28Z');
    expect(tracer?.notionUrl).toBe('https://app.notion.com/p/3c9efde7642b81a89f1ec9dc6cbbefdf');
    expect(tracer?.contextLabel).toBe('Background');
    expect(tracer?.choiceLabel).toBe('Choice');
    expect(tracer?.context).toContain('`bdacf391`');
    expect(tracer?.context).toContain('It invented #1044 anyway (Defer confirmation, 81 tests to 84).');
    expect(tracer?.problem).toContain('another dialog is not Fort Mill, not annotations, not Sam smoke.');
    expect(tracer?.options).toContain('Cut #1044, take CH-782 annotations if isolated.');
    expect(tracer?.choice).toContain('That is C after B failed the isolation test.');
    expectEmptyScores(tracer!.id);

    const capture = SEED_STEERS.find(
      (item) => item.id === 'plan-verdict-capture-ken-bugs-only-no-adapters',
    );
    expect(capture?.number).toBe(29);
    expect(capture?.title).toBe('29. Plan verdict Capture — Ken bugs only, no adapters');
    expect(capture?.stamp).toBe('KEEP');
    expect(capture?.notionUrl).toBe('https://app.notion.com/p/3c9efde7642b81a8a09bc0150652e7b2');
    expect(capture?.context).toContain('`68d881b2`');
    expect(capture?.problem).toContain('CH-838 is Sam’s later 10–15 minute walk, not a stop.');
    expect(capture?.choice).toContain('KEEP the 24h slice, CUT Fireflies/Calendar adapters');
    expectEmptyScores(capture!.id);

    const sync = SEED_STEERS.find(
      (item) => item.id === 'plan-verdict-sync-reverse-check-1018-then-close-w2',
    );
    expect(sync?.number).toBe(30);
    expect(sync?.title).toBe('30. Plan verdict Sync — reverse-check #1018, then close W2');
    expect(sync?.notionUrl).toBe('https://app.notion.com/p/3c9efde7642b8153b0a5dbf91556a6d4');
    expect(sync?.context).toContain('`3c7c1498`');
    expect(sync?.context).toContain('`cac140dc`');
    expect(sync?.choice).toContain('waiting exact-head CI, then merge that SHA');
    expectEmptyScores(sync!.id);

    const fireflies = SEED_STEERS.find(
      (item) => item.id === 'plan-verdict-fireflies-cut-leftover-seam-cathedral',
    );
    expect(fireflies?.number).toBe(31);
    expect(fireflies?.title).toBe('31. Plan verdict Fireflies — cut leftover-seam cathedral');
    expect(fireflies?.stamp).toBe('CUT');
    expect(fireflies?.notionUrl).toBe('https://app.notion.com/p/3c9efde7642b81109ec7de563854ab17');
    expect(fireflies?.context).toContain('`6e4b9dab`');
    expect(fireflies?.context).toContain('`resolveRegistryValidatedTarget`');
    expect(fireflies?.context).toContain('`projectCategoryId`');
    expect(fireflies?.choice).toContain('`b7e55159`');
    expect(fireflies?.choice).toContain('B, then C when B was empty.');
    expectEmptyScores(fireflies!.id);

    const calendar = SEED_STEERS.find(
      (item) => item.id === 'plan-verdict-calendar-cut-shared-registry-idle-after-w3',
    );
    expect(calendar?.number).toBe(32);
    expect(calendar?.title).toBe('32. Plan verdict Calendar — cut shared registry, idle after W3');
    expect(calendar?.notionUrl).toBe('https://app.notion.com/p/3c9efde7642b815a853add97a46fc9e6');
    expect(calendar?.context).toContain('`0392438d`');
    expect(calendar?.context).toContain('`334fd31a`');
    expect(calendar?.context).toContain('`(provider, sourceKind)`');
    expect(calendar?.choice).toContain('They closed #1046, removed the worktree');
    expectEmptyScores(calendar!.id);
  });

  it('queues steers 1–32 in Notion order', () => {
    expect(SEED_STEERS.map((item) => item.id)).toEqual([...SEED_STEER_IDS]);
  });

  it('keeps the sample JSON file aligned with the seed cases', () => {
    const sample = JSON.parse(
      readFileSync(new URL('../../public/sample-steer-cases.json', import.meta.url), 'utf8'),
    );
    expect(sample).toEqual(SEED_STEERS);
  });
});

describe('parseSteerCases', () => {
  const valid = {
    id: 'case-2',
    title: 'Another steer',
    session: 'Capture',
    stamp: 'HOLD',
    when: '2026-08-28',
    context: 'Context text',
    problem: 'Problem text',
    options: '1. A\n2. B',
    choice: '2',
    notionUrl: 'https://example.com/n',
  };

  it('accepts a bare array of cases', () => {
    const cases = parseSteerCases(JSON.stringify([valid]));
    expect(cases).toHaveLength(1);
    expect(cases[0].id).toBe('case-2');
    expect(cases[0].options).toContain('1. A');
  });

  it('accepts { cases: [...] } and optional yourCall', () => {
    const cases = parseSteerCases({ cases: [{ ...valid, yourCall: 'Softer' }] });
    expect(cases[0].yourCall).toBe('Softer');
  });

  it('keeps tooAggressive and yourCallBody so header sections are not dropped', () => {
    const cases = parseSteerCases({
      cases: [
        {
          ...valid,
          yourCall: 'Open',
          tooAggressive: 'Yes',
          yourCallBody:
            'Open. Score Content on whether this closes the gap. Score Action on the park and the blank check.',
          contextLabel: 'Background',
          choiceLabel: 'Choice',
        },
      ],
    });
    expect(cases[0].tooAggressive).toBe('Yes');
    expect(cases[0].yourCallBody).toBe(
      'Open. Score Content on whether this closes the gap. Score Action on the park and the blank check.',
    );
    expect(cases[0].contextLabel).toBe('Background');
    expect(cases[0].choiceLabel).toBe('Choice');
    const withMeta = parseSteerCases({
      cases: [{ ...valid, number: 1, timestamp: '2026-08-27T02:47:44Z' }],
    });
    expect(withMeta[0].number).toBe(1);
    expect(withMeta[0].timestamp).toBe('2026-08-27T02:47:44Z');
  });

  it('rejects traces-shaped JSON so Hub/A1 imports stay separate', () => {
    expect(() =>
      parseSteerCases({ traces: [{ id: 'hub-001', product: 'central-hub' }] }),
    ).toThrow(/steer/i);
  });

  it('rejects objects missing required steer fields', () => {
    expect(() => parseSteerCases([{ id: 'x', title: 'Nope' }])).toThrow(/missing/i);
  });
});

describe('parseSteerReviews', () => {
  it('keeps Content and Action as independent scores', () => {
    const reviews = parseSteerReviews({
      reviews: [
        {
          caseId: 'will-not-green-production-migration',
          content: { passFail: 'pass', comment: 'Gap closed.' },
          action: { passFail: 'fail', comment: 'Should have written the living instruction.' },
          highlights: [
            {
              section: 'choice',
              start: 0,
              end: 8,
              text: '2. Does ',
              lane: 'action',
              passFail: 'fail',
              comment: 'HOLD is right; write the rule down.',
            },
          ],
        },
      ],
    });
    expect(reviews).toHaveLength(1);
    expect(reviews[0].content.passFail).toBe('pass');
    expect(reviews[0].action.passFail).toBe('fail');
    expect(reviews[0].content.comment).not.toBe(reviews[0].action.comment);
    expect(reviews[0].highlights[0].lane).toBe('action');
    expect(reviews[0].highlights[0].section).toBe('choice');
    expect(reviews[0].content.labels).toEqual([]);
    expect(reviews[0].action.labels).toEqual([]);
  });

  it('keeps typed labels on the score they belong to', () => {
    const [review] = parseSteerReviews([
      {
        caseId: 'c1',
        content: { passFail: 'fail', comment: 'Unclear agents.', labels: ['too thin to decide', 'agents mixed the reds'] },
        action: { passFail: 'pass', comment: 'HOLD stands.', labels: ['one-way door'] },
      },
    ]);
    expect(review.content.labels).toEqual(['too thin to decide', 'agents mixed the reds']);
    expect(review.action.labels).toEqual(['one-way door']);
    expect(review.content.labels).not.toEqual(review.action.labels);
  });

  it('does not collapse missing scores into pass or fail', () => {
    const [review] = parseSteerReviews([
      { caseId: 'c1', content: {}, action: { comment: 'only a note' } },
    ]);
    expect(review.content.passFail).toBeNull();
    expect(review.action.passFail).toBeNull();
    expect(review.action.comment).toBe('only a note');
    expect(reviewIsEmpty(review)).toBe(false);
  });

  it('accepts a downloaded board file and a bare reviews array', () => {
    const fromBoard = parseSteerReviews({
      kind: 'oscar-steer-board',
      reviews: [{ caseId: 'c1' }],
    });
    const fromBare = parseSteerReviews([{ caseId: 'c2' }]);
    expect(fromBoard[0].caseId).toBe('c1');
    expect(fromBare[0].caseId).toBe('c2');
  });
});

describe('exportSteerBoardJSON', () => {
  it('writes an obvious schema Sam can hand to Oscar', () => {
    const review = {
      ...emptyReview('will-not-green-production-migration'),
      content: { passFail: 'pass' as const, comment: 'Closed the gap.', labels: ['closed the gap'] },
      action: { passFail: 'fail' as const, comment: 'Need a living instruction.', labels: ['write the instruction'] },
      highlights: [
        {
          id: 'h1',
          section: 'problem' as const,
          start: 0,
          end: 6,
          text: 'Agents',
          lane: 'content' as const,
          passFail: 'pass' as const,
          comment: 'Names the mix-up.',
        },
      ],
      chips: ['too-thin-to-decide' as const],
      updatedAt: '2026-08-27T12:00:00.000Z',
    };
    const parsed = JSON.parse(exportSteerBoardJSON(SEED_STEERS, [review]));
    expect(parsed.kind).toBe('oscar-steer-board');
    expect(parsed.cases[0].id).toBe('sync-was-becoming-a-type-religion');
    expect(parsed.reviews[0].caseId).toBe(review.caseId);
    expect(parsed.reviews[0].content.passFail).toBe('pass');
    expect(parsed.reviews[0].action.passFail).toBe('fail');
    expect(parsed.reviews[0].content.labels).toEqual(['closed the gap']);
    expect(parsed.reviews[0].action.labels).toEqual(['write the instruction']);
    expect(parsed.reviews[0].highlights[0].text).toBe('Agents');
    expect(parsed.exportedAt).toMatch(/^\d{4}-/);
  });

  it('round-trips through parse', () => {
    const json = exportSteerBoardJSON(SEED_STEERS, [
      { ...emptyReview('will-not-green-production-migration') },
    ]);
    expect(parseSteerCases(json)).toHaveLength(32);
    expect(parseSteerReviews(json)).toHaveLength(1);
  });

  it('Load-cases path restores labels from a board export, not only cases', () => {
    const json = exportSteerBoardJSON(SEED_STEERS, [
      {
        ...emptyReview('will-not-green-production-migration'),
        content: { passFail: 'pass', comment: 'Closed the gap.' },
        action: { passFail: 'fail', comment: 'Need a living instruction.' },
        highlights: [
          {
            id: 'h1',
            section: 'choice',
            start: 0,
            end: 7,
            text: '2. Does',
            lane: 'action',
            passFail: 'pass',
            comment: 'Did not type secrets.',
          },
        ],
        chips: ['cathedral-ceremony'],
      },
    ]);
    const loaded = parseSteerPayload(json);
    expect(loaded.cases).toHaveLength(32);
    expect(loaded.reviews).toHaveLength(1);
    expect(loaded.reviews[0].content.passFail).toBe('pass');
    expect(loaded.reviews[0].action.passFail).toBe('fail');
    expect(loaded.reviews[0].highlights[0].text).toBe('2. Does');
    expect(loaded.reviews[0].chips).toEqual(['cathedral-ceremony']);
  });
});

describe('mergeCases', () => {
  it('keeps seed cases and replaces imported ids', () => {
    const imported = {
      ...SEED_STEERS[0],
      title: 'Updated title from Oscar',
    };
    const extra = {
      id: 'new-case',
      title: 'New',
      session: 'Capture',
      stamp: 'GO',
      when: '2026-08-28',
      context: 'c',
      problem: 'p',
      options: 'o',
      choice: 'ch',
    };
    const merged = mergeCases(SEED_STEERS, [imported, extra]);
    expect(merged).toHaveLength(33);
    expect(merged[0].title).toBe('Updated title from Oscar');
    expect(merged[32].id).toBe('new-case');
  });
});

describe('highlight spans', () => {
  it('attaches a highlight to the selected span via offsets', () => {
    const text = 'Leave check red, PR unmerged, child parked.';
    const offsets = findSpanOffsets(text, 'PR unmerged');
    expect(offsets).toEqual({ start: 17, end: 28, text: 'PR unmerged' });
    const segments = applyHighlightSegments(text, [
      {
        id: 'h1',
        section: 'options',
        ...offsets!,
        lane: 'action',
        passFail: 'pass',
        comment: 'Two-way door.',
      },
    ]);
    expect(segments.map((s) => s.text).join('')).toBe(text);
    const marked = segments.filter((s) => s.highlight);
    expect(marked).toHaveLength(1);
    expect(marked[0].text).toBe('PR unmerged');
    expect(marked[0].highlight?.lane).toBe('action');
  });

  it('reattaches by span text when stored offsets are stale', () => {
    const text = 'Prefix. Leave check red. Suffix.';
    const offsets = findSpanOffsets(text, 'Leave check red', { start: 99, end: 104, text: 'Leave check red' });
    expect(offsets?.start).toBe(8);
    expect(text.slice(offsets!.start, offsets!.end)).toBe('Leave check red');
  });
});

describe('lane labels', () => {
  it('names the two scores the way Sam stated them, and keeps them independent', () => {
    expect(LANE_DEFS.content.title).toBe('Content / understanding');
    expect(LANE_DEFS.content.question).toContain('How Oscar sent the message');
    expect(LANE_DEFS.content.question).toContain('Did Sam understand the write-up');
    expect(LANE_DEFS.content.question).toContain('what the agents are doing');
    expect(LANE_DEFS.content.hint).toContain('missing information');

    expect(LANE_DEFS.action.title).toBe('Action / tech lead');
    expect(LANE_DEFS.action.question).toBe('How Oscar acted as the tech lead.');
    expect(LANE_DEFS.content.title).not.toBe(LANE_DEFS.action.title);
    expect(Object.keys(LANE_DEFS)).toEqual(['content', 'action']);
  });
});

describe('per-score labels', () => {
  it('adds a typed label to one score without leaking it to the other', () => {
    const content = addLaneLabel([], '  agents mixed the reds  ');
    const action = addLaneLabel([], 'one-way door');
    expect(content).toEqual(['agents mixed the reds']);
    expect(action).toEqual(['one-way door']);
    expect(content).not.toContain('one-way door');
    expect(action).not.toContain('agents mixed the reds');
  });

  it('reuses a label already used on that score and ignores blanks and duplicates', () => {
    const once = addLaneLabel(['too thin to decide'], 'Too thin to decide');
    expect(once).toEqual(['too thin to decide']);
    expect(addLaneLabel(once, '   ')).toEqual(['too thin to decide']);
  });

  it('lists reuse options from prior cases on that score only', () => {
    const reviews = [
      {
        ...emptyReview('a'),
        content: { passFail: 'fail' as const, comment: '', labels: ['too thin to decide'] },
        action: { passFail: 'pass' as const, comment: '', labels: ['HOLD stands'] },
      },
      {
        ...emptyReview('b'),
        content: { passFail: 'pass' as const, comment: '', labels: ['closed the gap'] },
        action: { passFail: 'fail' as const, comment: '', labels: [] },
      },
    ];
    expect(usedLabelsForLane(reviews, 'content')).toEqual(['closed the gap', 'too thin to decide']);
    expect(usedLabelsForLane(reviews, 'action')).toEqual(['HOLD stands']);
    expect(usedLabelsForLane(reviews, 'action')).not.toContain('too thin to decide');
  });
});

describe('optional chips', () => {
  it('exposes named misses without making them the score', () => {
    const ids = CHIP_DEFS.map((c) => c.id);
    expect(ids).toEqual([
      'jumped-to-options',
      'taught-the-feature',
      'too-thin-to-decide',
      'cathedral-ceremony',
    ]);
    expect(CHIP_DEFS.every((c) => c.label.length > 0)).toBe(true);
  });
});

describe('comments vs question threads', () => {
  it('treats a comment as a note that does not require a reply', () => {
    const [review] = parseSteerReviews([
      {
        caseId: 'c1',
        notes: [
          {
            id: 'n1',
            kind: 'comment',
            lane: 'content',
            author: 'sam',
            text: 'This sentence is clear.',
          },
        ],
      },
    ]);
    expect(review.notes[0].kind).toBe('comment');
    expect(review.notes[0].replies).toEqual([]);
    expect(review.notes[0].author).toBe('sam');
  });

  it('persists a question thread with Oscar replies and keeps the highlight span', () => {
    const [review] = parseSteerReviews([
      {
        caseId: 'c1',
        notes: [
          {
            id: 'q1',
            kind: 'question',
            lane: 'content',
            author: 'sam',
            text: 'What does two-way mean here?',
            highlightId: 'h1',
            section: 'options',
            start: 17,
            end: 28,
            spanText: 'PR unmerged',
            replies: [{ author: 'oscar', text: 'Two-way means Capture work can still finish.' }],
          },
        ],
      },
    ]);
    const question = review.notes[0];
    expect(question.kind).toBe('question');
    expect(question.highlightId).toBe('h1');
    expect(question.spanText).toBe('PR unmerged');
    expect(question.start).toBe(17);
    expect(question.end).toBe(28);
    expect(question.replies[0].author).toBe('oscar');
    expect(question.replies[0].text).toContain('Two-way');

    const withReply = addThreadReply(question, 'sam', 'Got it.');
    expect(withReply.replies).toHaveLength(2);
    expect(withReply.replies[1].author).toBe('sam');
    expect(question.replies).toHaveLength(1);
  });
});

describe('enrich revisions', () => {
  it('records a visible revision without rewriting the original case text', () => {
    const original = 'Leave check red, PR unmerged, child parked.';
    const question = {
      id: 'q1',
      kind: 'question' as const,
      lane: 'content' as const,
      author: 'sam' as const,
      text: 'What does two-way mean here?',
      createdAt: '',
      replies: [],
      section: 'options' as const,
      start: 17,
      end: 28,
      spanText: 'PR unmerged',
    };
    const revision = createRevisionFromQuestion(question, 'PR stays unmerged on purpose', original);
    expect(revision.questionId).toBe('q1');
    expect(revision.oldText).toBe('PR unmerged');
    expect(revision.newText).toBe('PR stays unmerged on purpose');
    expect(revision.start).toBe(17);
    expect(revision.end).toBe(28);
    expect(original).toBe('Leave check red, PR unmerged, child parked.');

    const segments = applyBodySegments(original, [], [revision]);
    const roles = segments.map((s) => s.role);
    expect(roles).toContain('struck');
    expect(roles).toContain('replacement');
    expect(segments.find((s) => s.role === 'struck')?.text).toBe('PR unmerged');
    expect(segments.find((s) => s.role === 'replacement')?.text).toBe('PR stays unmerged on purpose');
    const originalReconstructed = segments
      .filter((s) => s.role !== 'replacement')
      .map((s) => s.text)
      .join('');
    expect(originalReconstructed).toBe(original);
  });

  it('round-trips notes and revisions through the board JSON', () => {
    const review = {
      ...emptyReview('c1'),
      notes: [
        {
          id: 'q1',
          kind: 'question' as const,
          lane: 'content' as const,
          author: 'sam' as const,
          text: 'Clarify the one-way door.',
          createdAt: '2026-08-27T12:00:00.000Z',
          replies: [
            {
              id: 'r1',
              author: 'oscar' as const,
              text: 'Applying the migration is one-way.',
              createdAt: '2026-08-27T12:05:00.000Z',
            },
          ],
          highlightId: 'h1',
          section: 'problem' as const,
          start: 0,
          end: 6,
          spanText: 'Agents',
        },
      ],
      revisions: [
        {
          id: 'rev1',
          questionId: 'q1',
          section: 'problem' as const,
          oldText: 'Agents',
          newText: 'Some agents',
          start: 0,
          end: 6,
          createdAt: '2026-08-27T12:06:00.000Z',
        },
      ],
    };
    const parsed = JSON.parse(exportSteerBoardJSON(SEED_STEERS, [review]));
    expect(parsed.reviews[0].notes[0].kind).toBe('question');
    expect(parsed.reviews[0].notes[0].replies[0].author).toBe('oscar');
    expect(parsed.reviews[0].revisions[0]).toMatchObject({
      oldText: 'Agents',
      newText: 'Some agents',
      questionId: 'q1',
    });
    const restored = parseSteerReviews(parsed)[0];
    expect(restored.notes[0].spanText).toBe('Agents');
    expect(restored.revisions[0].newText).toBe('Some agents');
  });
});

describe('span notes and case progress', () => {
  it('attaches Content and Action notes to one span without a span Pass/Fail', () => {
    const next = attachSpanNotes({
      review: emptyReview('c1'),
      span: { section: 'context', start: 0, end: 7, text: 'Capture' },
      author: 'sam',
      content: { kind: 'comment', text: 'Clear enough.' },
      action: { kind: 'question', text: 'Why park here?' },
    });
    expect(next.highlights).toHaveLength(1);
    expect(next.highlights[0].passFail).toBeNull();
    expect(next.highlights[0].text).toBe('Capture');
    expect(next.notes).toHaveLength(2);
    expect(next.notes.map((n) => n.lane)).toEqual(['content', 'action']);
    expect(next.notes[0].kind).toBe('comment');
    expect(next.notes[1].kind).toBe('question');
    expect(next.notes[0].highlightId).toBe(next.highlights[0].id);
    expect(next.notes[1].highlightId).toBe(next.highlights[0].id);
  });

  it('treats both scores marked as scored, and a started case as open', () => {
    expect(caseProgress(undefined)).toBe('unscored');
    expect(caseProgress(emptyReview('c1'))).toBe('unscored');
    expect(
      caseProgress({
        ...emptyReview('c1'),
        content: { passFail: 'pass', comment: '', labels: [] },
      }),
    ).toBe('open');
    expect(
      caseProgress({
        ...emptyReview('c1'),
        content: { passFail: 'pass', comment: '', labels: [] },
        action: { passFail: 'fail', comment: '', labels: [] },
      }),
    ).toBe('scored');
  });
});

describe('sortCases', () => {
  const cases = [
    { ...SEED_STEERS[1], number: 2, timestamp: '2026-08-27T02:47:44Z', stamp: 'CUT', session: 'Capture' },
    { ...SEED_STEERS[0], number: 1, timestamp: '2026-08-27T03:00:00Z', stamp: 'HOLD', session: 'Sync' },
  ];

  it('defaults to number ascending', () => {
    const sorted = sortCases(cases, { field: 'number', direction: 'asc' });
    expect(sorted.map((c) => c.number)).toEqual([1, 2]);
  });

  it('sorts timestamp then number', () => {
    const sorted = sortCases(cases, { field: 'timestamp', direction: 'asc' });
    expect(sorted.map((c) => c.id)).toEqual([
      'capture-counted-pigeons-on-vercel',
      'sync-was-becoming-a-type-religion',
    ]);
  });

  it('sorts session descending', () => {
    const sorted = sortCases(cases, { field: 'session', direction: 'desc' });
    expect(sorted.map((c) => c.session)).toEqual(['Sync', 'Capture']);
  });
});

import { describe, expect, it } from 'vitest';
import { AUTH_COOKIE_NAME } from './evalAuth';
import { gateEvalDashboardRequest } from './evalGate';
import { SEED_STEERS } from '../data/steerSeed';
import { appendCommentToReviews, handleReviewsCommentRequest } from './reviewsApi';
import {
  assignCaseDefaults,
  handleCasesRequest,
  nextCaseNumber,
  parseCasesWritePayload,
  slugFromTitle,
  type CasesPersist,
} from './casesApi';
import type { SteerCase } from '../types/steers';
import { emptyReview } from './steers';

const REQUIRED = {
  title: 'Night steer',
  session: 'Tracer',
  stamp: 'KEEP',
  context: 'context field',
  problem: 'problem field',
  options: 'A. one',
  choice: 'A',
};

function posted(partial: Partial<SteerCase> & Pick<SteerCase, 'title' | 'session' | 'stamp' | 'context' | 'problem' | 'options' | 'choice'>): SteerCase {
  return {
    id: partial.id ?? 'posted-case',
    when: partial.when ?? '2026-08-28',
    ...partial,
  };
}

function memoryCases(seed: SteerCase[] = []): CasesPersist {
  let data = [...seed];
  return {
    async read() {
      return data;
    },
    async write(next) {
      data = [...next];
    },
  };
}

describe('slugFromTitle and nextCaseNumber', () => {
  it('slugs a title and assigns max(seed + stored)+1', () => {
    expect(slugFromTitle('38. After-guide Tracer — Fort Mill')).toBe(
      '38-after-guide-tracer-fort-mill',
    );
    expect(nextCaseNumber(SEED_STEERS, [])).toBe(38);
    expect(
      nextCaseNumber(SEED_STEERS, [{ ...posted(REQUIRED), id: 'extra', number: 40 }]),
    ).toBe(41);
  });
});

describe('assignCaseDefaults', () => {
  it('fills id, number, when, timestamp, and section labels', () => {
    const now = new Date('2026-08-28T12:00:00.000Z');
    const assigned = assignCaseDefaults(REQUIRED, SEED_STEERS, [], now);
    expect(assigned.id).toBe('night-steer');
    expect(assigned.number).toBe(38);
    expect(assigned.when).toBe('2026-08-28');
    expect(assigned.timestamp).toBe('2026-08-28T12:00:00.000Z');
    expect(assigned.contextLabel).toBe('Background');
    expect(assigned.choiceLabel).toBe('Choice');
  });

  it('keeps an explicit id and number', () => {
    const assigned = assignCaseDefaults(
      { ...REQUIRED, id: 'keep-this-id', number: 99 },
      SEED_STEERS,
      [],
      new Date('2026-08-28T12:00:00.000Z'),
    );
    expect(assigned.id).toBe('keep-this-id');
    expect(assigned.number).toBe(99);
  });
});

describe('parseCasesWritePayload', () => {
  it('accepts one case, { case }, or { cases }', () => {
    const one = { ...REQUIRED, id: 'one', when: '2026-08-28' };
    expect(parseCasesWritePayload(one).map((item) => item.id)).toEqual(['one']);
    expect(parseCasesWritePayload({ case: one }).map((item) => item.id)).toEqual(['one']);
    expect(parseCasesWritePayload({ cases: [one] }).map((item) => item.id)).toEqual(['one']);
  });

  it('throws when a required field is missing', () => {
    expect(() => parseCasesWritePayload({ title: 'Only title' })).toThrow(/required steer fields/i);
  });
});

describe('handleCasesRequest', () => {
  const env = { EVAL_DASHBOARD_PASSWORD: 'board-secret', BLOB_READ_WRITE_TOKEN: 'token' };

  it('returns 401 JSON without auth and accepts Bearer or cookie', async () => {
    const persist = memoryCases();
    const denied = await handleCasesRequest(
      new Request('https://x/api/cases'),
      env,
      persist,
    );
    expect(denied.status).toBe(401);
    expect(denied.headers.get('content-type')).toContain('application/json');
    expect(await denied.json()).toEqual({ error: 'unauthorized' });
    expect(denied.headers.get('location')).toBeNull();

    const bearer = await handleCasesRequest(
      new Request('https://x/api/cases', { headers: { Authorization: 'Bearer board-secret' } }),
      env,
      persist,
    );
    expect(bearer.status).toBe(200);

    const cookie = await handleCasesRequest(
      new Request('https://x/api/cases', { headers: { cookie: `${AUTH_COOKIE_NAME}=1` } }),
      env,
      persist,
    );
    expect(cookie.status).toBe(200);
  });

  it('400s a POST that is missing required fields', async () => {
    const res = await handleCasesRequest(
      new Request('https://x/api/cases', {
        method: 'POST',
        headers: { Authorization: 'Bearer board-secret', 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'No body fields', session: 'Tracer', stamp: 'KEEP' }),
      }),
      env,
      memoryCases(),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/required steer fields/i);
  });

  it('POSTs one case, assigns id and number, and GETs seed plus the extra', async () => {
    const persist = memoryCases();
    const created = await handleCasesRequest(
      new Request('https://x/api/cases', {
        method: 'POST',
        headers: { Authorization: 'Bearer board-secret', 'content-type': 'application/json' },
        body: JSON.stringify(REQUIRED),
      }),
      env,
      persist,
    );
    expect(created.status).toBe(200);
    const createdBody = (await created.json()) as { case: SteerCase; cases?: SteerCase[] };
    expect(createdBody.cases).toBeUndefined();
    expect(createdBody.case.id).toBe('night-steer');
    expect(createdBody.case.number).toBe(38);
    expect(createdBody.case.context).toBe('context field');
    expect(createdBody.case.contextLabel).toBe('Background');
    expect(createdBody.case.choiceLabel).toBe('Choice');

    const listed = await handleCasesRequest(
      new Request('https://x/api/cases', { headers: { Authorization: 'Bearer board-secret' } }),
      env,
      persist,
    );
    const listBody = (await listed.json()) as { cases: SteerCase[] };
    expect(listBody.cases).toHaveLength(SEED_STEERS.length + 1);
    expect(listBody.cases.slice(0, SEED_STEERS.length).map((item) => item.id)).toEqual(
      SEED_STEERS.map((item) => item.id),
    );
    expect(listBody.cases.at(-1)?.id).toBe('night-steer');
    expect(listBody.cases[0].context).toBe(SEED_STEERS[0].context);
  });

  it('merges a later POST of the same id and filters GET by id or number', async () => {
    const persist = memoryCases();
    await handleCasesRequest(
      new Request('https://x/api/cases', {
        method: 'POST',
        headers: { Authorization: 'Bearer board-secret', 'content-type': 'application/json' },
        body: JSON.stringify({ ...REQUIRED, id: 'posted-row', number: 50 }),
      }),
      env,
      persist,
    );
    const updated = await handleCasesRequest(
      new Request('https://x/api/cases', {
        method: 'POST',
        headers: { Authorization: 'Bearer board-secret', 'content-type': 'application/json' },
        body: JSON.stringify({
          ...REQUIRED,
          id: 'posted-row',
          number: 50,
          problem: 'updated problem',
        }),
      }),
      env,
      persist,
    );
    expect(((await updated.json()) as { case: SteerCase }).case.problem).toBe('updated problem');
    expect(await persist.read()).toHaveLength(1);

    const byId = await handleCasesRequest(
      new Request('https://x/api/cases?id=posted-row', {
        headers: { Authorization: 'Bearer board-secret' },
      }),
      env,
      persist,
    );
    expect(((await byId.json()) as { cases: SteerCase[] }).cases).toEqual([
      expect.objectContaining({ id: 'posted-row', problem: 'updated problem' }),
    ]);

    const byNumber = await handleCasesRequest(
      new Request('https://x/api/cases?number=50', {
        headers: { Authorization: 'Bearer board-secret' },
      }),
      env,
      persist,
    );
    expect(((await byNumber.json()) as { cases: SteerCase[] }).cases[0].id).toBe('posted-row');
  });

  it('returns { cases } when the POST body is a list', async () => {
    const persist = memoryCases();
    const res = await handleCasesRequest(
      new Request('https://x/api/cases', {
        method: 'POST',
        headers: { Authorization: 'Bearer board-secret', 'content-type': 'application/json' },
        body: JSON.stringify({
          cases: [
            { ...REQUIRED, title: 'First extra', id: 'first-extra' },
            { ...REQUIRED, title: 'Second extra', id: 'second-extra' },
          ],
        }),
      }),
      env,
      persist,
    );
    const body = (await res.json()) as { cases: SteerCase[]; case?: SteerCase };
    expect(body.case).toBeUndefined();
    expect(body.cases.map((item) => item.id)).toEqual(['first-extra', 'second-extra']);
    expect(body.cases.map((item) => item.number)).toEqual([38, 39]);
  });
});

describe('gateEvalDashboardRequest for /api/cases', () => {
  const env = { EVAL_DASHBOARD_PASSWORD: 'board-secret' };

  it('401s JSON without auth and does not redirect to login', async () => {
    const denied = await gateEvalDashboardRequest(
      new Request('https://eval-dashboard-zeta.vercel.app/api/cases'),
      env,
    );
    expect(denied?.status).toBe(401);
    expect(denied?.headers.get('content-type')).toContain('application/json');
    expect(await denied!.json()).toEqual({ error: 'unauthorized' });
    expect(denied?.headers.get('location')).toBeNull();
  });
});

describe('knownCase includes persisted ids', () => {
  it('lets a comment land on a posted case id', () => {
    const result = appendCommentToReviews(
      [],
      {
        caseId: 'night-steer',
        author: 'oscar',
        text: 'On the board.',
        lane: 'content',
      },
      ['night-steer'],
    );
    expect(result?.review.caseId).toBe('night-steer');
    expect(result?.review.content.passFail).toBeNull();
    expect(
      appendCommentToReviews([], {
        caseId: 'night-steer',
        author: 'oscar',
        text: 'On the board.',
        lane: 'content',
      }),
    ).toBeNull();
  });

  it('handleReviewsCommentRequest accepts extraCaseIds', async () => {
    const persist = {
      async read() {
        return [] as ReturnType<typeof emptyReview>[];
      },
      async write() {},
    };
    const env = { EVAL_DASHBOARD_PASSWORD: 'board-secret' };
    const missing = await handleReviewsCommentRequest(
      new Request('https://x/api/reviews/comment', {
        method: 'POST',
        headers: { Authorization: 'Bearer board-secret', 'content-type': 'application/json' },
        body: JSON.stringify({ caseId: 'night-steer', text: 'Hi', lane: 'action' }),
      }),
      env,
      persist,
    );
    expect(missing.status).toBe(404);

    const ok = await handleReviewsCommentRequest(
      new Request('https://x/api/reviews/comment', {
        method: 'POST',
        headers: { Authorization: 'Bearer board-secret', 'content-type': 'application/json' },
        body: JSON.stringify({ caseId: 'night-steer', text: 'Hi', lane: 'action' }),
      }),
      env,
      persist,
      ['night-steer'],
    );
    expect(ok.status).toBe(200);
  });
});

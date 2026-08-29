import { SEED_STEERS } from '../data/steerSeed.js';
import type { SteerCase } from '../types/steers.js';
import { authorizeReviewsRequest, jsonResponse } from './evalGate.js';
import { PersistNotConfigured } from './reviewsApi.js';
import { filterCasesByScope, mergeCases, parseSteerCases } from './steers.js';

export const CASES_BLOB_PATH = 'steer-cases.json';

export interface CasesPersist {
  read(): Promise<SteerCase[]>;
  write(cases: SteerCase[]): Promise<void>;
}

const REQUIRED_POST_FIELDS = [
  'title',
  'session',
  'stamp',
  'context',
  'problem',
  'options',
  'choice',
] as const;

export function slugFromTitle(title: string): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || 'steer';
}

export function nextCaseNumber(seed: SteerCase[], stored: SteerCase[]): number {
  const nums = [...seed, ...stored]
    .map((item) => item.number)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  return (nums.length ? Math.max(...nums) : 0) + 1;
}

function uniqueId(base: string, used: Set<string>): string {
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function requiredMissing(value: unknown): string[] {
  const obj = asRecord(value) ?? {};
  return REQUIRED_POST_FIELDS.filter((field) => {
    const raw = obj[field];
    return typeof raw !== 'string' || !raw.trim();
  });
}

export function assignCaseDefaults(
  input: Record<string, unknown> | Pick<SteerCase, (typeof REQUIRED_POST_FIELDS)[number]> & Partial<SteerCase>,
  seed: SteerCase[],
  stored: SteerCase[],
  now = new Date(),
): Record<string, unknown> {
  const obj = { ...(asRecord(input) ?? (input as Record<string, unknown>)) };
  const usedIds = new Set([...seed, ...stored].map((item) => item.id));
  if (typeof obj.id === 'string' && obj.id.trim()) {
    obj.id = obj.id.trim();
  } else {
    obj.id = uniqueId(slugFromTitle(String(obj.title ?? '')), usedIds);
  }
  if (typeof obj.number !== 'number' || !Number.isFinite(obj.number)) {
    obj.number = nextCaseNumber(seed, stored);
  }
  const iso = now.toISOString();
  if (typeof obj.when !== 'string' || !obj.when.trim()) {
    obj.when = iso.slice(0, 10);
  }
  if (typeof obj.timestamp !== 'string' || !obj.timestamp.trim()) {
    obj.timestamp = iso;
  }
  if (typeof obj.contextLabel !== 'string' || !obj.contextLabel.trim()) {
    obj.contextLabel = 'Background';
  }
  if (typeof obj.choiceLabel !== 'string' || !obj.choiceLabel.trim()) {
    obj.choiceLabel = 'Choice';
  }
  return obj;
}

function extractPostedCases(input: unknown): { raw: unknown[]; singular: boolean } {
  if (Array.isArray(input)) return { raw: input, singular: false };
  const obj = asRecord(input);
  if (obj && Array.isArray(obj.cases)) return { raw: obj.cases, singular: false };
  if (obj && 'case' in obj) return { raw: [obj.case], singular: true };
  if (obj) return { raw: [obj], singular: true };
  throw new Error('Case 1 is missing required steer fields');
}

export function parseCasesWritePayload(
  input: unknown,
  stored: SteerCase[] = [],
  now = new Date(),
): SteerCase[] {
  const { raw } = extractPostedCases(input);
  if (raw.length === 0) {
    throw new Error('No steer cases in file');
  }
  const seen = [...stored];
  return raw.map((item, index) => {
    const missing = requiredMissing(item);
    if (missing.length) {
      throw new Error(`Case ${index + 1} is missing required steer fields: ${missing.join(', ')}`);
    }
    const filled = assignCaseDefaults(asRecord(item) ?? {}, SEED_STEERS, seen, now);
    const parsed = parseSteerCases({ cases: [filled] })[0];
    seen.push(parsed);
    return parsed;
  });
}

export function boardCases(stored: SteerCase[]): SteerCase[] {
  return mergeCases(SEED_STEERS, stored);
}

function persistError(error: unknown): Response | null {
  if (error instanceof PersistNotConfigured) {
    return jsonResponse(503, { error: 'cases persist is not configured' });
  }
  return null;
}

function isSingularWrite(input: unknown): boolean {
  if (Array.isArray(input)) return false;
  const obj = asRecord(input);
  if (obj && Array.isArray(obj.cases)) return false;
  return true;
}

export async function handleCasesRequest(
  request: Request,
  env: Record<string, string | undefined>,
  persist: CasesPersist,
): Promise<Response> {
  if (!(await authorizeReviewsRequest(request, env))) {
    return jsonResponse(401, { error: 'unauthorized' });
  }
  if (request.method === 'GET') {
    try {
      const stored = await persist.read();
      let cases = boardCases(stored);
      const params = new URL(request.url).searchParams;
      const id = params.get('id');
      const number = params.get('number');
      if (id) cases = cases.filter((item) => item.id === id);
      if (number != null && number !== '') {
        cases = cases.filter((item) => String(item.number) === number);
      }
      cases = filterCasesByScope(cases, {
        project: params.get('project'),
        parentTicket: params.get('parentTicket'),
        spec: params.get('spec'),
      });
      return jsonResponse(200, { cases });
    } catch (error) {
      return persistError(error) ?? jsonResponse(500, { error: 'failed to read cases' });
    }
  }
  if (request.method === 'POST') {
    try {
      const payload = await request.json();
      const existing = await persist.read();
      const incoming = parseCasesWritePayload(payload, existing);
      const stored = mergeCases(existing, incoming);
      await persist.write(stored);
      if (isSingularWrite(payload)) {
        return jsonResponse(200, { case: incoming[0] });
      }
      return jsonResponse(200, { cases: incoming });
    } catch (error) {
      if (error instanceof PersistNotConfigured) {
        return jsonResponse(503, { error: 'cases persist is not configured' });
      }
      return jsonResponse(400, {
        error: error instanceof Error ? error.message : 'invalid cases payload',
      });
    }
  }
  return jsonResponse(405, { error: 'method not allowed' });
}

export async function readPersistedCaseIds(persist: CasesPersist): Promise<string[]> {
  try {
    return (await persist.read()).map((item) => item.id);
  } catch {
    return [];
  }
}

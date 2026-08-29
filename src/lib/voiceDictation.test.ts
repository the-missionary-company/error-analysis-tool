import { describe, expect, it, vi } from 'vitest';
import { handleTranscribeRequest, MAX_AUDIO_BYTES } from './transcribeApi';
import { appendTranscript, MAX_DICTATION_MS } from './voiceDictation';
import {
  caseParentTitle,
  caseProject,
  listParentScopes,
  looksLikeOpaqueId,
  parseSteerCases,
} from './steers';

describe('looksLikeOpaqueId', () => {
  it('flags UUIDs and hex session hashes', () => {
    expect(looksLikeOpaqueId('0392438d-fbd1-45dc-a6c6-69f7d73e46c4')).toBe(true);
    expect(looksLikeOpaqueId('bdacf391')).toBe(true);
    expect(looksLikeOpaqueId('1b72d297a1b2c3d4')).toBe(true);
    expect(looksLikeOpaqueId('Tracer')).toBe(false);
    expect(looksLikeOpaqueId('CH-757')).toBe(false);
  });
});

describe('parent short titles', () => {
  it('never uses session UUIDs as project or filter chips', () => {
    const cases = parseSteerCases([
      {
        id: 'uuid-session',
        title: 'T',
        session: '0392438d-fbd1-45dc-a6c6-69f7d73e46c4',
        stamp: 'KEEP',
        when: '2026-08-29',
        parentId: 'CH-757',
        parentSystem: 'linear',
        context: 'c',
        problem: 'p',
        options: 'o',
        choice: 'x',
      },
    ]);
    expect(caseProject(cases[0])).toBe('Tracer');
    expect(cases[0].session).toBe('Tracer');
    expect(caseParentTitle(cases[0])).toBe('Answer Engine Tracer');
    const scopes = listParentScopes(cases);
    expect(scopes).toHaveLength(1);
    expect(scopes[0].label).toBe('CH-757 · Answer Engine Tracer');
    expect(scopes[0].label).not.toMatch(/0392438d/);
  });

  it('keeps Oscar parentTitle when provided', () => {
    const cases = parseSteerCases([
      {
        id: 'custom',
        title: 'T',
        stamp: 'KEEP',
        when: '2026-08-29',
        parentId: 'CH-999',
        parentTitle: 'Custom parent name',
        project: 'Watch',
        context: 'c',
        problem: 'p',
        options: 'o',
        choice: 'x',
      },
    ]);
    expect(caseParentTitle(cases[0])).toBe('Custom parent name');
    expect(listParentScopes(cases)[0].label).toBe('CH-999 · Custom parent name');
  });

  it('skips opaque parentId values in filter chips', () => {
    const cases = parseSteerCases([
      {
        id: 'bad-parent',
        title: 'T',
        stamp: 'KEEP',
        when: '2026-08-29',
        parentId: '0392438d-fbd1-45dc-a6c6-69f7d73e46c4',
        context: 'c',
        problem: 'p',
        options: 'o',
        choice: 'x',
      },
    ]);
    expect(listParentScopes(cases)).toHaveLength(0);
  });
});

describe('appendTranscript', () => {
  it('joins with a space when needed', () => {
    expect(appendTranscript('Hello', 'world')).toBe('Hello world');
    expect(appendTranscript('Hello ', 'world')).toBe('Hello world');
    expect(appendTranscript('Hello', ', world')).toBe('Hello, world');
    expect(appendTranscript('', 'hi')).toBe('hi');
  });
});

describe('dictation constants', () => {
  it('caps recording at three minutes', () => {
    expect(MAX_DICTATION_MS).toBe(180_000);
  });
});

describe('POST /api/transcribe', () => {
  it('401s without auth', async () => {
    const response = await handleTranscribeRequest(
      new Request('https://x/api/transcribe', { method: 'POST' }),
      { EVAL_DASHBOARD_PASSWORD: 'board-secret' },
    );
    expect(response.status).toBe(401);
  });

  it('503s when XAI_API_KEY is missing', async () => {
    const response = await handleTranscribeRequest(
      new Request('https://x/api/transcribe', {
        method: 'POST',
        headers: { Authorization: 'Bearer board-secret' },
        body: new FormData(),
      }),
      { EVAL_DASHBOARD_PASSWORD: 'board-secret' },
    );
    expect(response.status).toBe(503);
  });

  it('forwards audio to Grok STT', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ text: 'hello from grok', duration: 1.2 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const form = new FormData();
    form.append('file', new Blob(['audio-bytes'], { type: 'audio/webm' }), 'dictation.webm');
    const response = await handleTranscribeRequest(
      new Request('https://x/api/transcribe', {
        method: 'POST',
        headers: { Authorization: 'Bearer board-secret' },
        body: form,
      }),
      { EVAL_DASHBOARD_PASSWORD: 'board-secret', XAI_API_KEY: 'xai-test' },
      { fetchImpl: fetchImpl as unknown as typeof fetch },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ text: 'hello from grok', duration: 1.2 });
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.x.ai/v1/stt');
    expect((init as RequestInit).headers).toMatchObject({ Authorization: 'Bearer xai-test' });
  });

  it('rejects oversized audio', async () => {
    const form = new FormData();
    const big = new Blob([new Uint8Array(MAX_AUDIO_BYTES + 1)], { type: 'audio/webm' });
    form.append('file', big, 'huge.webm');
    const response = await handleTranscribeRequest(
      new Request('https://x/api/transcribe', {
        method: 'POST',
        headers: { Authorization: 'Bearer board-secret' },
        body: form,
      }),
      { EVAL_DASHBOARD_PASSWORD: 'board-secret', XAI_API_KEY: 'xai-test' },
    );
    expect(response.status).toBe(413);
  });
});

import { authorizeReviewsRequest, jsonResponse } from './evalGate.js';

export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export type TranscribeDeps = {
  fetchImpl?: typeof fetch;
  now?: () => number;
};

export async function transcribeWithXai(
  audio: Blob,
  filename: string,
  env: Record<string, string | undefined>,
  deps: TranscribeDeps = {},
): Promise<{ text: string; duration?: number }> {
  const key = env.XAI_API_KEY?.trim();
  if (!key) {
    throw new Error('XAI_API_KEY is not configured on the server');
  }
  const fetchImpl = deps.fetchImpl ?? fetch;
  const form = new FormData();
  form.append('format', 'true');
  form.append('language', 'en');
  form.append('file', audio, filename || 'dictation.webm');

  const response = await fetchImpl('https://api.x.ai/v1/stt', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      detail.trim()
        ? `Grok STT ${response.status}: ${detail.trim().slice(0, 200)}`
        : `Grok STT failed (${response.status})`,
    );
  }
  const body = (await response.json()) as { text?: unknown; duration?: unknown };
  const text = typeof body.text === 'string' ? body.text : '';
  const duration = typeof body.duration === 'number' ? body.duration : undefined;
  return { text, duration };
}

export async function handleTranscribeRequest(
  request: Request,
  env: Record<string, string | undefined>,
  deps: TranscribeDeps = {},
): Promise<Response> {
  if (!(await authorizeReviewsRequest(request, env))) {
    return jsonResponse(401, { error: 'unauthorized' });
  }
  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'method not allowed' });
  }
  if (!env.XAI_API_KEY?.trim()) {
    return jsonResponse(503, {
      error: 'transcription unavailable — set XAI_API_KEY on the Vercel project',
    });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonResponse(400, { error: 'expected multipart form with file' });
  }

  const file = form.get('file');
  if (!(file instanceof Blob) || file.size === 0) {
    return jsonResponse(400, { error: 'missing audio file' });
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return jsonResponse(413, { error: 'audio too large (max 25MB / ~3 minutes)' });
  }

  const filename =
    file instanceof File && file.name.trim() ? file.name.trim() : 'dictation.webm';

  try {
    const result = await transcribeWithXai(file, filename, env, deps);
    return jsonResponse(200, { text: result.text, duration: result.duration ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'transcription failed';
    const status = /not configured/i.test(message) ? 503 : 502;
    return jsonResponse(status, { error: message });
  }
}

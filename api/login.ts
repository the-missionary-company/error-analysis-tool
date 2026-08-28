import { loginOutcome, parsePasswordFromBody } from '../src/lib/evalAuth';

export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const raw = await request.text();
  const password = parsePasswordFromBody(request.headers.get('content-type'), raw);
  const secure = new URL(request.url).protocol === 'https:';
  const result = await loginOutcome(password, {
    EVAL_DASHBOARD_PASSWORD: process.env.EVAL_DASHBOARD_PASSWORD,
  }, { secure });

  const headers = new Headers({ Location: result.location });
  if (result.cookie) headers.set('Set-Cookie', result.cookie);
  return new Response(null, { status: result.status, headers });
}

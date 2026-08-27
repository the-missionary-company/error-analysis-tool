import { passwordMatches, sessionCookieHeader } from '../src/lib/evalAuth';

export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let password: unknown;
  try {
    const body = (await request.json()) as { password?: unknown };
    password = body.password;
  } catch {
    return Response.redirect(new URL('/login?error=1', request.url), 302);
  }

  const ok = await passwordMatches(password, {
    EVAL_DASHBOARD_PASSWORD: process.env.EVAL_DASHBOARD_PASSWORD,
  });
  if (!ok) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const secure = new URL(request.url).protocol === 'https:';
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': sessionCookieHeader({ secure }),
    },
  });
}

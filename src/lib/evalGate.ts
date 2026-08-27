import { hasAuthCookie, isPublicPath, passwordMatches } from './evalAuth';

export function isReviewsApiPath(pathname: string): boolean {
  const path = (pathname.split('?')[0] ?? pathname).replace(/\/$/, '') || '/';
  return path === '/api/reviews' || path.startsWith('/api/reviews/');
}

export function parseBearerPassword(header: string | null | undefined): string | undefined {
  if (!header) return undefined;
  const match = header.trim().match(/^Bearer\s+(\S+)/i);
  return match?.[1];
}

export async function authorizeReviewsRequest(
  request: Request,
  env: Record<string, string | undefined>,
): Promise<boolean> {
  if (hasAuthCookie(request.headers.get('cookie'))) return true;
  const password = parseBearerPassword(request.headers.get('authorization'));
  return passwordMatches(password, env);
}

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export async function gateEvalDashboardRequest(
  request: Request,
  env: Record<string, string | undefined> = {},
): Promise<Response | undefined> {
  const { pathname } = new URL(request.url);
  if (isPublicPath(pathname)) return undefined;
  if (isReviewsApiPath(pathname)) {
    if (await authorizeReviewsRequest(request, env)) return undefined;
    return jsonResponse(401, { error: 'unauthorized' });
  }
  if (hasAuthCookie(request.headers.get('cookie'))) return undefined;
  return Response.redirect(new URL('/login', request.url), 302);
}

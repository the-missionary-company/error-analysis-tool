import { hasAuthCookie, isPublicPath } from './src/lib/evalAuth';

export const config = {
  matcher: ['/((?!_vercel).*)'],
};

export default function middleware(request: Request): Response | undefined {
  const { pathname } = new URL(request.url);
  if (isPublicPath(pathname)) return undefined;
  if (hasAuthCookie(request.headers.get('cookie'))) return undefined;
  return Response.redirect(new URL('/login', request.url), 302);
}

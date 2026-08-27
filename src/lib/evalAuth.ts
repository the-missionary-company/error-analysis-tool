export const AUTH_COOKIE_NAME = 'eval_dashboard';
export const AUTH_COOKIE_VALUE = '1';
export const EXPECTED_PASSWORD_SHA256 =
  'f4b858ca2087b917a015effff8c49235f4973b2b94ac43617aa71cf79f34b379';

export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function passwordMatches(
  password: unknown,
  env: Record<string, string | undefined> = {},
  expectedHash = EXPECTED_PASSWORD_SHA256,
): Promise<boolean> {
  if (typeof password !== 'string' || password.length === 0) return false;
  const override = env.EVAL_DASHBOARD_PASSWORD;
  if (typeof override === 'string' && override.length > 0 && password === override) {
    return true;
  }
  return (await sha256Hex(password)) === expectedHash;
}

export function isPublicPath(pathname: string): boolean {
  const path = pathname.split('?')[0] ?? pathname;
  return path === '/login' || path === '/api/login' || path === '/robots.txt';
}

export function hasAuthCookie(cookieHeader: string | null | undefined): boolean {
  if (!cookieHeader) return false;
  return cookieHeader.split(';').some((part) => {
    const [name, value] = part.trim().split('=');
    return name === AUTH_COOKIE_NAME && value === AUTH_COOKIE_VALUE;
  });
}

export function parsePasswordFromBody(contentType: string | null | undefined, raw: string): unknown {
  const type = contentType ?? '';
  if (type.includes('application/json')) {
    try {
      return (JSON.parse(raw) as { password?: unknown }).password;
    } catch {
      return undefined;
    }
  }
  return new URLSearchParams(raw).get('password');
}

export async function loginOutcome(
  password: unknown,
  env: Record<string, string | undefined>,
  options: { secure: boolean },
): Promise<{ status: 302; location: string; cookie?: string }> {
  if (await passwordMatches(password, env)) {
    return {
      status: 302,
      location: '/',
      cookie: sessionCookieHeader(options),
    };
  }
  return { status: 302, location: '/login?error=1' };
}

export function sessionCookieHeader(options: { secure: boolean }): string {
  const parts = [
    `${AUTH_COOKIE_NAME}=${AUTH_COOKIE_VALUE}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (options.secure) parts.push('Secure');
  return parts.join('; ');
}

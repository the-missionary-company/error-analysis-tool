import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  AUTH_COOKIE_NAME,
  EXPECTED_PASSWORD_SHA256,
  hasAuthCookie,
  isPublicPath,
  loginOutcome,
  parsePasswordFromBody,
  passwordMatches,
  sessionCookieHeader,
} from './evalAuth';

describe('evalAuth', () => {
  it('uses the committed SHA-256 hex and never ships it in the login page', () => {
    expect(EXPECTED_PASSWORD_SHA256).toBe(
      'f4b858ca2087b917a015effff8c49235f4973b2b94ac43617aa71cf79f34b379',
    );
    const login = readFileSync(new URL('../../public/login.html', import.meta.url), 'utf8');
    expect(login).toContain('Eval dashboard');
    expect(login).toContain('noindex');
    expect(login).not.toContain(EXPECTED_PASSWORD_SHA256);
    expect(login).not.toContain('EVAL_DASHBOARD_PASSWORD');
  });

  it('accepts the hash match and the server-only plaintext override', async () => {
    await expect(passwordMatches('wrong-password')).resolves.toBe(false);
    await expect(passwordMatches('')).resolves.toBe(false);
    await expect(
      passwordMatches('hello', {}, '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'),
    ).resolves.toBe(true);
    await expect(
      passwordMatches('any-override', { EVAL_DASHBOARD_PASSWORD: 'any-override' }),
    ).resolves.toBe(true);
    await expect(
      passwordMatches('wrong', { EVAL_DASHBOARD_PASSWORD: 'any-override' }),
    ).resolves.toBe(false);
  });

  it('leaves login, the login API, and robots public and gates the board plus assets', () => {
    expect(isPublicPath('/login')).toBe(true);
    expect(isPublicPath('/login?error=1')).toBe(true);
    expect(isPublicPath('/api/login')).toBe(true);
    expect(isPublicPath('/robots.txt')).toBe(true);
    expect(isPublicPath('/')).toBe(false);
    expect(isPublicPath('/assets/index.js')).toBe(false);
    expect(isPublicPath('/datasets')).toBe(false);
    expect(isPublicPath('/api/reviews')).toBe(false);
  });

  it('sets an httpOnly SameSite=Lax session cookie', () => {
    expect(AUTH_COOKIE_NAME).toBe('eval_dashboard');
    const header = sessionCookieHeader({ secure: true });
    expect(header).toContain(`${AUTH_COOKIE_NAME}=`);
    expect(header).toContain('HttpOnly');
    expect(header).toContain('SameSite=Lax');
    expect(header).toContain('Secure');
    expect(header).toContain('Path=/');
    expect(sessionCookieHeader({ secure: false })).not.toContain('Secure');
    expect(hasAuthCookie('eval_dashboard=1')).toBe(true);
    expect(hasAuthCookie('other=1')).toBe(false);
  });

  it('redirects a good login to / with a cookie and a bad login back to /login', async () => {
    const denied = await loginOutcome('nope', {}, { secure: true });
    expect(denied).toEqual({ status: 302, location: '/login?error=1' });

    const allowed = await loginOutcome('gate', { EVAL_DASHBOARD_PASSWORD: 'gate' }, { secure: true });
    expect(allowed.status).toBe(302);
    expect(allowed.location).toBe('/');
    expect(allowed.cookie).toContain('eval_dashboard=1');
    expect(allowed.cookie).toContain('Secure');

    expect(parsePasswordFromBody('application/json', '{"password":"x"}')).toBe('x');
    expect(
      parsePasswordFromBody('application/x-www-form-urlencoded', 'password=x'),
    ).toBe('x');
  });
});

import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, type PreviewServer, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import {
  hasAuthCookie,
  isPublicPath,
  passwordMatches,
  sessionCookieHeader,
} from './src/lib/evalAuth';

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function applyEvalDashboardGate(server: ViteDevServer | PreviewServer) {
  server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url ?? '/';
    const path = url.split('?')[0] ?? '/';

    if (req.method === 'GET' && path === '/login') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      res.end(readFileSync(new URL('./public/login.html', import.meta.url)));
      return;
    }

    if (req.method === 'POST' && path === '/api/login') {
      const raw = await readBody(req);
      let password: unknown;
      try {
        password = (JSON.parse(raw) as { password?: unknown }).password;
      } catch {
        password = undefined;
      }
      const ok = await passwordMatches(password, process.env);
      if (!ok) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false }));
        return;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Set-Cookie', sessionCookieHeader({ secure: false }));
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (isPublicPath(path) || hasAuthCookie(req.headers.cookie)) {
      next();
      return;
    }

    res.statusCode = 302;
    res.setHeader('Location', '/login');
    res.end();
  });
}

export default defineConfig({
  // Vercel serves this at the domain root. Pages stays blocked.
  base: '/',
  plugins: [
    react(),
    {
      name: 'eval-dashboard-gate',
      configureServer: applyEvalDashboardGate,
      configurePreviewServer: applyEvalDashboardGate,
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
  },
});

import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, type PreviewServer, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import { loginOutcome, parsePasswordFromBody } from './src/lib/evalAuth';
import {
  gateEvalDashboardRequest,
  handleReviewsCommentRequest,
  handleReviewsReplyRequest,
  handleReviewsRequest,
  isReviewsApiPath,
} from './src/lib/reviewsApi';
import { createBlobReviewsPersist } from './src/lib/reviewsBlob';

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function incomingToRequest(req: IncomingMessage, url: string, raw?: string): Request {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(', '));
  }
  const method = req.method ?? 'GET';
  return new Request(new URL(url, 'http://localhost'), {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? undefined : raw,
  });
}

async function writeWebResponse(res: ServerResponse, response: Response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'content-encoding') return;
    res.setHeader(key, value);
  });
  res.end(Buffer.from(await response.arrayBuffer()));
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
      const password = parsePasswordFromBody(req.headers['content-type'], raw);
      const result = await loginOutcome(password, process.env, { secure: false });
      res.statusCode = result.status;
      res.setHeader('Location', result.location);
      if (result.cookie) res.setHeader('Set-Cookie', result.cookie);
      res.end();
      return;
    }

    if (isReviewsApiPath(path)) {
      const raw = req.method === 'GET' || req.method === 'HEAD' ? undefined : await readBody(req);
      const request = incomingToRequest(req, url, raw);
      const persist = createBlobReviewsPersist(process.env);
      const response = path.startsWith('/api/reviews/reply')
        ? await handleReviewsReplyRequest(request, process.env, persist)
        : path.startsWith('/api/reviews/comment')
          ? await handleReviewsCommentRequest(request, process.env, persist)
          : await handleReviewsRequest(request, process.env, persist);
      await writeWebResponse(res, response);
      return;
    }

    const gate = await gateEvalDashboardRequest(incomingToRequest(req, url), process.env);
    if (gate) {
      await writeWebResponse(res, gate);
      return;
    }

    next();
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

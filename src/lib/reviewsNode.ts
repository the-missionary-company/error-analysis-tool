import { jsonResponse } from './evalGate.js';

export async function asWebRequest(input: unknown): Promise<Request> {
  try {
    if (typeof Request !== 'undefined' && input instanceof Request) return input;
  } catch {
    // ignore
  }
  const candidate = input as {
    headers?: { get?: (name: string) => string | null } | Record<string, string | string[] | undefined>;
    url?: string;
    method?: string;
  };
  try {
    if (
      candidate &&
      typeof candidate.url === 'string' &&
      candidate.headers &&
      typeof (candidate.headers as { get?: unknown }).get === 'function'
    ) {
      return input as Request;
    }
  } catch {
    // fall through and rebuild
  }
  return fromNodeLike(input);
}

export function isNodeServerResponse(
  value: unknown,
): value is { statusCode: number; setHeader: (name: string, value: string) => void; end: (body?: string) => void } {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as { end?: unknown }).end === 'function' &&
    typeof (value as { setHeader?: unknown }).setHeader === 'function'
  );
}

export async function pipeWebResponse(
  res: { statusCode: number; setHeader: (name: string, value: string) => void; end: (body?: string) => void },
  response: Response,
): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'content-encoding') return;
    res.setHeader(key, value);
  });
  res.end(await response.text());
}

export async function runReviewsFunction(
  first: unknown,
  second: unknown,
  handle: (request: Request) => Promise<Response>,
): Promise<Response | void> {
  try {
    const request = await asWebRequest(first);
    const response = await handle(request);
    if (isNodeServerResponse(second)) {
      await pipeWebResponse(second, response);
      return;
    }
    return response;
  } catch (error) {
    const response = jsonResponse(500, {
      error: error instanceof Error && error.message ? error.message : 'internal error',
    });
    if (isNodeServerResponse(second)) {
      await pipeWebResponse(second, response);
      return;
    }
    return response;
  }
}

async function fromNodeLike(input: unknown): Promise<Request> {
  const req = (input ?? {}) as {
    method?: string;
    url?: string;
    headers?: Record<string, string | string[] | undefined> | { get?: (name: string) => string | null };
    body?: unknown;
    on?: (event: string, cb: (chunk?: unknown) => void) => void;
  };
  const headers = new Headers();
  try {
    const raw = req.headers;
    if (raw && typeof (raw as { get?: unknown }).get === 'function') {
      const getter = (raw as { get: (name: string) => string | null }).get.bind(raw);
      for (const name of ['authorization', 'cookie', 'content-type', 'host', 'x-forwarded-host', 'x-forwarded-proto']) {
        const value = getter(name);
        if (value) headers.set(name, value);
      }
    } else if (raw && typeof raw === 'object') {
      for (const [key, value] of Object.entries(raw as Record<string, string | string[] | undefined>)) {
        if (typeof value === 'string') headers.set(key, value);
        else if (Array.isArray(value)) headers.set(key, value.join(', '));
      }
    }
  } catch {
    // Never throw on headers.
  }
  const host = headers.get('x-forwarded-host') || headers.get('host') || 'localhost';
  const proto = headers.get('x-forwarded-proto') || 'https';
  const path = typeof req.url === 'string' ? req.url : '/api/reviews';
  const url = path.startsWith('http') ? path : `${proto}://${host}${path}`;
  const method = (req.method ?? 'GET').toUpperCase();
  let body: string | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    if (req.body !== undefined && req.body !== null) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    } else if (typeof req.on === 'function') {
      body = await readNodeBody(req);
    }
  }
  return new Request(url, { method, headers, body });
}

function readNodeBody(req: { on?: (event: string, cb: (chunk?: unknown) => void) => void }): Promise<string> {
  return new Promise((resolve) => {
    const chunks: string[] = [];
    try {
      req.on?.('data', (chunk) => {
        chunks.push(typeof chunk === 'string' ? chunk : String(chunk ?? ''));
      });
      req.on?.('end', () => resolve(chunks.join('')));
      req.on?.('error', () => resolve(chunks.join('')));
    } catch {
      resolve('');
    }
  });
}

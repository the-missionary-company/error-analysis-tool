import { get, put } from '@vercel/blob';
import type { SteerCase } from '../types/steers.js';
import { CASES_BLOB_PATH, type CasesPersist } from './casesApi.js';
import { isBlobNotFound, type BlobIo } from './reviewsBlob.js';
import { PersistNotConfigured } from './reviewsApi.js';
import { parseSteerCases } from './steers.js';

export function createBlobCasesPersist(
  env: Record<string, string | undefined> = process.env,
  io: BlobIo = { get, put },
): CasesPersist {
  const token = env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return {
      async read() {
        throw new PersistNotConfigured();
      },
      async write() {
        throw new PersistNotConfigured();
      },
    };
  }

  return {
    async read() {
      try {
        const result = await io.get(CASES_BLOB_PATH, {
          access: 'private',
          token,
          useCache: false,
        });
        if (!result) return [];
        const stream = 'stream' in result ? result.stream : null;
        if (!stream) return [];
        const text = await new Response(stream).text();
        if (!text.trim()) return [];
        const data = JSON.parse(text) as unknown;
        try {
          return parseSteerCases(data);
        } catch {
          return [];
        }
      } catch (error) {
        if (isBlobNotFound(error)) return [];
        throw error;
      }
    },
    async write(cases: SteerCase[]) {
      await io.put(CASES_BLOB_PATH, JSON.stringify({ cases }), {
        access: 'private',
        token,
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
      });
    },
  };
}

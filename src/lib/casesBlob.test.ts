import { describe, expect, it } from 'vitest';
import { BlobNotFoundError } from '@vercel/blob';
import { createBlobCasesPersist } from './casesBlob.js';

describe('createBlobCasesPersist', () => {
  it('returns [] when the cases blob is missing', async () => {
    const persist = createBlobCasesPersist(
      { BLOB_READ_WRITE_TOKEN: 'tok' },
      {
        async get() {
          throw new BlobNotFoundError();
        },
        async put() {
          throw new Error('should not put');
        },
      },
    );
    await expect(persist.read()).resolves.toEqual([]);
  });
});

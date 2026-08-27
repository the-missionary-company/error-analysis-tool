import { describe, expect, it } from 'vitest';
import { BlobNotFoundError } from '@vercel/blob';
import { createBlobReviewsPersist, isBlobNotFound } from './reviewsBlob.js';

describe('isBlobNotFound', () => {
  it('treats BlobNotFoundError, 404, and missing-file messages as empty', () => {
    expect(isBlobNotFound(new BlobNotFoundError())).toBe(true);
    expect(isBlobNotFound({ name: 'BlobNotFoundError' })).toBe(true);
    expect(isBlobNotFound({ status: 404 })).toBe(true);
    expect(isBlobNotFound({ statusCode: 404 })).toBe(true);
    expect(isBlobNotFound(new Error('The requested blob does not exist'))).toBe(true);
    expect(isBlobNotFound(new Error('boom'))).toBe(false);
  });
});

describe('createBlobReviewsPersist', () => {
  it('returns [] when get throws not-found', async () => {
    const persist = createBlobReviewsPersist(
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

  it('returns [] when get returns null', async () => {
    const persist = createBlobReviewsPersist(
      { BLOB_READ_WRITE_TOKEN: 'tok' },
      {
        async get() {
          return null;
        },
        async put() {
          throw new Error('should not put');
        },
      },
    );
    await expect(persist.read()).resolves.toEqual([]);
  });
});

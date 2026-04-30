/**
 * Tests for {@link MidnightTestnetIndexer}.
 *
 * The Midnight indexer is intentionally limited at M1: balances and UTXOs
 * require a viewing key from the Snap (M2+). What we DO support live:
 *   - getLatestBlock via GraphQL `{ block { height hash timestamp } }`
 *   - getNetworkInfo (composes getLatestBlock + healthcheck)
 *   - healthcheck — minimal POST that treats 4xx schema errors as "alive"
 *
 * The remaining methods must throw IndexerError(code='NotAvailableYet').
 */

import { describe, expect, it, vi } from 'vitest';

import { IndexerError } from './interface';
import { MidnightTestnetIndexer } from './midnight-testnet';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('MidnightTestnetIndexer — getBalance (M1 stub)', () => {
  it('returns the encrypted-sentinel placeholder', async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const idx = new MidnightTestnetIndexer({ fetchImpl });
    const bal = await idx.getBalance('mn_test_02_stub_abc');
    expect(bal.chain).toBe('midnight');
    expect(bal.native.amount).toBe('encrypted');
    expect(bal.native.shielded).toBe(true);
  });
});

describe('MidnightTestnetIndexer — getUtxos', () => {
  it('throws IndexerError(NotAvailableYet)', async () => {
    const idx = new MidnightTestnetIndexer({
      fetchImpl: vi.fn() as unknown as typeof fetch,
    });
    try {
      await idx.getUtxos('mn_test_02_stub_abc');
      throw new Error('expected to throw');
    } catch (e) {
      expect(e).toBeInstanceOf(IndexerError);
      expect((e as IndexerError).code).toBe('NotAvailableYet');
    }
  });
});

describe('MidnightTestnetIndexer — getLatestBlock', () => {
  it('parses a numeric-timestamp GraphQL response', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        data: { block: { height: 42, hash: 'cafe', timestamp: 1700000000 } },
      }),
    ) as unknown as typeof fetch;
    const idx = new MidnightTestnetIndexer({ fetchImpl });
    const blk = await idx.getLatestBlock();
    expect(blk.chain).toBe('midnight');
    expect(blk.height).toBe(42);
    expect(blk.hash).toBe('cafe');
    expect(blk.time).toBe(1700000000);
  });

  it('parses an ISO-string timestamp into unix-seconds', async () => {
    const iso = '2024-11-15T00:00:00Z';
    const expected = Math.floor(Date.parse(iso) / 1000);
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ data: { block: { height: 1, hash: 'a', timestamp: iso } } }),
    ) as unknown as typeof fetch;
    const idx = new MidnightTestnetIndexer({ fetchImpl });
    const blk = await idx.getLatestBlock();
    expect(blk.time).toBe(expected);
  });

  it('throws IndexerError on HTTP failure', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response('down', { status: 502, statusText: 'Bad Gateway' }),
    ) as unknown as typeof fetch;
    const idx = new MidnightTestnetIndexer({ fetchImpl });
    await expect(idx.getLatestBlock()).rejects.toBeInstanceOf(IndexerError);
  });

  it('throws IndexerError(ParseError) on GraphQL errors[]', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ errors: [{ message: 'unknown field block' }] }),
    ) as unknown as typeof fetch;
    const idx = new MidnightTestnetIndexer({ fetchImpl });
    try {
      await idx.getLatestBlock();
      throw new Error('expected to throw');
    } catch (e) {
      expect(e).toBeInstanceOf(IndexerError);
      expect((e as IndexerError).code).toBe('ParseError');
    }
  });

  it('throws IndexerError(ParseError) on shape mismatch', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ data: { block: null } }),
    ) as unknown as typeof fetch;
    const idx = new MidnightTestnetIndexer({ fetchImpl });
    try {
      await idx.getLatestBlock();
      throw new Error('expected to throw');
    } catch (e) {
      expect(e).toBeInstanceOf(IndexerError);
      expect((e as IndexerError).code).toBe('ParseError');
    }
  });
});

describe('MidnightTestnetIndexer — getNetworkInfo', () => {
  it('returns a healthy snapshot when latest block is fresh', async () => {
    const freshTime = Math.floor(Date.now() / 1000);
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        data: { block: { height: 1, hash: 'h', timestamp: freshTime } },
      }),
    ) as unknown as typeof fetch;
    const idx = new MidnightTestnetIndexer({ fetchImpl });
    const info = await idx.getNetworkInfo();
    expect(info.healthy).toBe(true);
    expect(info.latestBlock?.height).toBe(1);
  });

  it('falls back to healthcheck when getLatestBlock throws', async () => {
    // First call (getLatestBlock) → 502.
    // Second call (healthcheck fallback) → 400 (which counts as "alive").
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response('down', { status: 502 }))
      .mockResolvedValueOnce(new Response('schema error', { status: 400 })) as unknown as typeof fetch;

    const idx = new MidnightTestnetIndexer({ fetchImpl });
    const info = await idx.getNetworkInfo();
    expect(info.latestBlock).toBeUndefined();
    expect(info.healthy).toBe(true); // 400 means GraphQL is alive
  });
});

describe('MidnightTestnetIndexer — healthcheck', () => {
  it('returns true on any sub-500 status (4xx schema errors are alive signals)', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response('bad query', { status: 400 }),
    ) as unknown as typeof fetch;
    const idx = new MidnightTestnetIndexer({ fetchImpl });
    expect(await idx.healthcheck()).toBe(true);
  });

  it('returns false on >=500', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response('outage', { status: 503 }),
    ) as unknown as typeof fetch;
    const idx = new MidnightTestnetIndexer({ fetchImpl });
    expect(await idx.healthcheck()).toBe(false);
  });

  it('returns false on network failure', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('econnrefused');
    }) as unknown as typeof fetch;
    const idx = new MidnightTestnetIndexer({ fetchImpl });
    expect(await idx.healthcheck()).toBe(false);
  });
});

/**
 * Tests for {@link BlockfrostCardanoIndexer}.
 *
 * We DON'T hit Blockfrost's real API. We pass a hand-rolled `fetchImpl`
 * that returns canned `Response` objects shaped like Blockfrost's actual
 * docs (https://docs.blockfrost.io). This lets us test:
 *   - happy-path parsing for getBalance / getUtxos / getLatestBlock
 *   - 404 fallthroughs (empty wallet, no UTXOs)
 *   - HTTP error surfacing (IndexerError with `code: 'HttpError'`)
 *   - pagination loop on getUtxos
 *   - getNetworkInfo's stall detection
 */

import { describe, expect, it, vi } from 'vitest';

import { BlockfrostCardanoIndexer } from './blockfrost-cardano';
import { IndexerError } from './interface';

/* ------------------------------------------------------------------ */
/* fetch helpers                                                       */
/* ------------------------------------------------------------------ */

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
    ...init,
  });
}

function mockFetch(handlers: Array<(url: string) => Response | undefined>) {
  return vi.fn(async (input: URL | RequestInfo) => {
    const url = typeof input === 'string' ? input : (input as URL).toString();
    for (const h of handlers) {
      const r = h(url);
      if (r) return r;
    }
    return new Response('unhandled', { status: 999 });
  }) as unknown as typeof fetch;
}

/* ------------------------------------------------------------------ */

describe('BlockfrostCardanoIndexer — construction', () => {
  it('throws ConfigError without a projectId', () => {
    expect(() => new BlockfrostCardanoIndexer({ projectId: '' })).toThrow(
      IndexerError,
    );
  });

  it('exposes name namespaced by network', () => {
    const idx = new BlockfrostCardanoIndexer({
      projectId: 'preprodTEST',
      network: 'preprod',
      fetchImpl: vi.fn() as unknown as typeof fetch,
    });
    expect(idx.name).toBe('blockfrost-cardano-preprod');
    expect(idx.chain).toBe('cardano');
  });
});

describe('BlockfrostCardanoIndexer — getBalance', () => {
  it('parses lovelace + a native asset into Balance shape', async () => {
    const fetchImpl = mockFetch([
      (url) =>
        url.endsWith('/addresses/addr_test1qp123')
          ? jsonResponse({
              address: 'addr_test1qp123',
              amount: [
                { unit: 'lovelace', quantity: '5000000' },
                {
                  unit:
                    '279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f534e454b',
                  quantity: '99',
                },
              ],
              stake_address: null,
              type: 'shelley',
              script: false,
            })
          : undefined,
    ]);
    const idx = new BlockfrostCardanoIndexer({
      projectId: 'preprodTEST',
      network: 'preprod',
      fetchImpl,
    });
    const bal = await idx.getBalance('addr_test1qp123');
    expect(bal.chain).toBe('cardano');
    expect(bal.network).toBe('preprod');
    expect(bal.native.amount).toBe('5000000');
    expect(bal.assets).toHaveLength(1);
    expect(bal.assets[0]?.symbol).toBe('SNEK');
  });

  it('returns zero-amount Balance on 404 (address with no on-chain history)', async () => {
    const fetchImpl = mockFetch([
      () => new Response('not found', { status: 404 }),
    ]);
    const idx = new BlockfrostCardanoIndexer({
      projectId: 'preprodTEST',
      network: 'preprod',
      fetchImpl,
    });
    const bal = await idx.getBalance('addr_test1never_used');
    expect(bal.native.amount).toBe('0');
    expect(bal.assets).toEqual([]);
  });

  it('throws IndexerError on non-2xx, non-404 statuses', async () => {
    const fetchImpl = mockFetch([
      () => new Response('rate limit', { status: 429, statusText: 'Too Many Requests' }),
    ]);
    const idx = new BlockfrostCardanoIndexer({
      projectId: 'preprodTEST',
      network: 'preprod',
      fetchImpl,
    });
    await expect(idx.getBalance('addr_test1qp123')).rejects.toBeInstanceOf(
      IndexerError,
    );
  });
});

describe('BlockfrostCardanoIndexer — getUtxos', () => {
  it('returns parsed UTXOs with assets when present', async () => {
    const fetchImpl = mockFetch([
      (url) =>
        url.includes('/utxos?count=100&page=1')
          ? jsonResponse([
              {
                tx_hash: 'aaa',
                tx_index: 0,
                output_index: 0,
                amount: [{ unit: 'lovelace', quantity: '1000000' }],
                block: 'block1',
                data_hash: null,
                inline_datum: null,
                reference_script_hash: null,
              },
              {
                tx_hash: 'bbb',
                tx_index: 0,
                output_index: 1,
                amount: [
                  { unit: 'lovelace', quantity: '2000000' },
                  {
                    unit:
                      '279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f534e454b',
                    quantity: '7',
                  },
                ],
                block: 'block1',
                data_hash: null,
                inline_datum: '0xabcd',
                reference_script_hash: null,
              },
            ])
          : undefined,
    ]);
    const idx = new BlockfrostCardanoIndexer({
      projectId: 'preprodTEST',
      network: 'preprod',
      fetchImpl,
    });
    const utxos = await idx.getUtxos('addr_test1qp123');
    expect(utxos).toHaveLength(2);
    expect(utxos[0]?.amount).toBe('1000000');
    expect(utxos[0]?.assets).toBeUndefined();
    expect(utxos[1]?.assets?.[0]?.symbol).toBe('SNEK');
    expect(utxos[1]?.datum).toBe('0xabcd');
  });

  it('returns [] on 404 (no UTXOs)', async () => {
    const fetchImpl = mockFetch([() => new Response('', { status: 404 })]);
    const idx = new BlockfrostCardanoIndexer({
      projectId: 'preprodTEST',
      network: 'preprod',
      fetchImpl,
    });
    expect(await idx.getUtxos('addr_test1qp123')).toEqual([]);
  });

  it('paginates: stops fetching once a page returns < PAGE_SIZE entries', async () => {
    const calls: string[] = [];
    // Page 1 returns exactly 100 entries → loop continues. Page 2 returns 5 → stop.
    const fullPage = Array.from({ length: 100 }, (_, i) => ({
      tx_hash: `tx${i}`,
      tx_index: 0,
      output_index: 0,
      amount: [{ unit: 'lovelace', quantity: '1' }],
      block: 'b',
      data_hash: null,
      inline_datum: null,
      reference_script_hash: null,
    }));
    const partialPage = fullPage.slice(0, 5);
    const fetchImpl = vi.fn(async (input: URL | RequestInfo) => {
      const url = typeof input === 'string' ? input : (input as URL).toString();
      calls.push(url);
      if (url.includes('page=1')) return jsonResponse(fullPage);
      if (url.includes('page=2')) return jsonResponse(partialPage);
      return new Response('unhandled', { status: 999 });
    }) as unknown as typeof fetch;

    const idx = new BlockfrostCardanoIndexer({
      projectId: 'preprodTEST',
      network: 'preprod',
      fetchImpl,
    });
    const utxos = await idx.getUtxos('addr_test1qp123');
    expect(utxos).toHaveLength(105);
    expect(calls).toHaveLength(2); // did not call page=3
  });

  it('throws IndexerError with code=HttpError on non-2xx, non-404', async () => {
    const fetchImpl = mockFetch([
      () => new Response('boom', { status: 500, statusText: 'Server Error' }),
    ]);
    const idx = new BlockfrostCardanoIndexer({
      projectId: 'preprodTEST',
      network: 'preprod',
      fetchImpl,
    });
    try {
      await idx.getUtxos('addr_test1qp123');
      throw new Error('expected to throw');
    } catch (e) {
      expect(e).toBeInstanceOf(IndexerError);
      expect((e as IndexerError).code).toBe('HttpError');
    }
  });
});

describe('BlockfrostCardanoIndexer — getLatestBlock + getNetworkInfo', () => {
  it('parses /blocks/latest into BlockInfo', async () => {
    const fetchImpl = mockFetch([
      (url) =>
        url.endsWith('/blocks/latest')
          ? jsonResponse({
              time: 1700000000,
              height: 12345678,
              hash: 'beef',
              slot: 99,
              epoch: 500,
              epoch_slot: 0,
              size: 0,
              tx_count: 0,
            })
          : undefined,
    ]);
    const idx = new BlockfrostCardanoIndexer({
      projectId: 'preprodTEST',
      network: 'preprod',
      fetchImpl,
    });
    const blk = await idx.getLatestBlock();
    expect(blk.height).toBe(12345678);
    expect(blk.hash).toBe('beef');
    expect(blk.epoch).toBe(500);
    expect(blk.chain).toBe('cardano');
  });

  it('getNetworkInfo flags healthy:false when latest block is older than 2 minutes', async () => {
    const oldTime = Math.floor(Date.now() / 1000) - 60 * 60; // 1 hour ago
    const fetchImpl = mockFetch([
      (url) =>
        url.endsWith('/blocks/latest')
          ? jsonResponse({
              time: oldTime,
              height: 1,
              hash: 'stale',
              slot: 0,
              epoch: 0,
              epoch_slot: 0,
              size: 0,
              tx_count: 0,
            })
          : undefined,
    ]);
    const idx = new BlockfrostCardanoIndexer({
      projectId: 'preprodTEST',
      network: 'preprod',
      fetchImpl,
    });
    const info = await idx.getNetworkInfo();
    expect(info.healthy).toBe(false);
    expect(info.msSinceLastBlock).toBeGreaterThan(2 * 60 * 1000);
  });

  it('getNetworkInfo flags healthy:true with a fresh block', async () => {
    const freshTime = Math.floor(Date.now() / 1000) - 5;
    const fetchImpl = mockFetch([
      (url) =>
        url.endsWith('/blocks/latest')
          ? jsonResponse({
              time: freshTime,
              height: 1,
              hash: 'fresh',
              slot: 0,
              epoch: 0,
              epoch_slot: 0,
              size: 0,
              tx_count: 0,
            })
          : undefined,
    ]);
    const idx = new BlockfrostCardanoIndexer({
      projectId: 'preprodTEST',
      network: 'preprod',
      fetchImpl,
    });
    const info = await idx.getNetworkInfo();
    expect(info.healthy).toBe(true);
    expect(info.network).toBe('preprod');
  });
});

describe('BlockfrostCardanoIndexer — healthcheck', () => {
  it('returns true on 2xx /health', async () => {
    const fetchImpl = mockFetch([
      (url) => (url.endsWith('/health') ? jsonResponse({ is_healthy: true }) : undefined),
    ]);
    const idx = new BlockfrostCardanoIndexer({
      projectId: 'preprodTEST',
      network: 'preprod',
      fetchImpl,
    });
    expect(await idx.healthcheck()).toBe(true);
  });

  it('returns false on network failure', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('econnrefused');
    }) as unknown as typeof fetch;
    const idx = new BlockfrostCardanoIndexer({
      projectId: 'preprodTEST',
      network: 'preprod',
      fetchImpl,
    });
    expect(await idx.healthcheck()).toBe(false);
  });
});

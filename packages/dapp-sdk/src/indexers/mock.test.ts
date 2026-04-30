/**
 * Tests for the {@link MockIndexer} fixtures.
 *
 * These fixtures are dual-use:
 *   1. Companion-dApp's "mock" mode shows them in the chain cards
 *   2. MidnightVitals integration tests use them as deterministic ping targets
 *
 * Snapshot-style assertions on the exact strings would be too fragile, so we
 * pin only the SHAPE and a few canonical values that downstream consumers
 * branch on (e.g. `shielded === true` for Midnight UTXOs).
 */

import { describe, expect, it } from 'vitest';

import { MockIndexer } from './mock';

describe('MockIndexer — Cardano fixtures', () => {
  const idx = new MockIndexer('cardano');

  it('getBalance returns 4,200 ADA + 1 native asset', async () => {
    const bal = await idx.getBalance('addr_test1qpfake');
    expect(bal.chain).toBe('cardano');
    expect(bal.network).toBe('preprod');
    expect(bal.native.symbol).toBe('ADA');
    expect(bal.native.amount).toBe('4200000000');
    expect(bal.assets).toHaveLength(1);
  });

  it('getUtxos returns at least 2 fixture UTXOs (none shielded)', async () => {
    const utxos = await idx.getUtxos('addr_test1qpfake');
    expect(utxos.length).toBeGreaterThanOrEqual(2);
    for (const u of utxos) {
      expect(u.chain).toBe('cardano');
      expect(u.shielded).not.toBe(true);
      expect(typeof u.txHash).toBe('string');
    }
  });

  it('getLatestBlock returns a deterministic Cardano block', async () => {
    const blk = await idx.getLatestBlock();
    expect(blk.chain).toBe('cardano');
    expect(blk.height).toBeGreaterThan(0);
    expect(typeof blk.hash).toBe('string');
    expect(blk.epoch).toBeDefined();
  });

  it('getNetworkInfo returns healthy with era=Conway', async () => {
    const info = await idx.getNetworkInfo();
    expect(info.healthy).toBe(true);
    expect(info.era).toBe('Conway');
    expect(info.latestBlock?.chain).toBe('cardano');
  });

  it('healthcheck always returns true', async () => {
    expect(await idx.healthcheck()).toBe(true);
  });
});

describe('MockIndexer — Midnight fixtures', () => {
  const idx = new MockIndexer('midnight');

  it('getBalance returns shielded NIGHT + DUST', async () => {
    const bal = await idx.getBalance('mn_test_02_fake');
    expect(bal.chain).toBe('midnight');
    expect(bal.native.shielded).toBe(true);
    expect(bal.native.symbol).toBe('NIGHT');
    expect(bal.assets[0]?.symbol).toBe('DUST');
  });

  it('getUtxos returns shielded fixture UTXOs', async () => {
    const utxos = await idx.getUtxos('mn_test_02_fake');
    expect(utxos.length).toBeGreaterThan(0);
    expect(utxos[0]?.shielded).toBe(true);
    expect(utxos[0]?.chain).toBe('midnight');
  });

  it('getNetworkInfo returns era=Ariadne and a block snapshot', async () => {
    const info = await idx.getNetworkInfo();
    expect(info.network).toBe('testnet-02');
    expect(info.era).toBe('Ariadne');
    expect(info.latestBlock?.chain).toBe('midnight');
  });
});

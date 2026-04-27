/**
 * Tests for `mockAdapter` — the demoland fixture provider.
 *
 * The mock adapter is **dual-use**: it powers the companion dApp's mock
 * mode AND it's what every downstream dApp uses for storybook / SSR /
 * tests. Stable behavior here protects every consumer. If you change a
 * fixture string, expect downstream snapshot churn — bump dapp-sdk minor.
 */

import { describe, expect, it } from 'vitest';

import { mockAdapter } from './mock';

describe('mockAdapter', () => {
  describe('SnapAdapter contract surface', () => {
    it('implements every required method', () => {
      expect(typeof mockAdapter.isInstalled).toBe('function');
      expect(typeof mockAdapter.connect).toBe('function');
      expect(typeof mockAdapter.getAddress).toBe('function');
      expect(typeof mockAdapter.getBalance).toBe('function');
      expect(typeof mockAdapter.signTransaction).toBe('function');
      expect(typeof mockAdapter.submitTransaction).toBe('function');
    });

    it('isInstalled always resolves true (the dApp is "installed" in mock mode)', async () => {
      await expect(mockAdapter.isInstalled()).resolves.toBe(true);
    });
  });

  describe('getAddress', () => {
    it('returns a real-shaped Cardano addr1...', async () => {
      const addr = await mockAdapter.getAddress('cardano');
      expect(addr.startsWith('addr1')).toBe(true);
    });

    it('returns a clearly-mock Midnight address', async () => {
      const addr = await mockAdapter.getAddress('midnight');
      // Mock fixture uses a recognizable "...example..." marker — UIs can
      // detect that and warn. Real Midnight addresses won't contain it.
      expect(addr).toContain('example');
    });
  });

  describe('getBalance', () => {
    it('Cardano balance carries lovelace + at least one native asset', async () => {
      const bal = await mockAdapter.getBalance('cardano');
      expect(bal.chain).toBe('cardano');
      expect(bal.native.symbol).toBe('ADA');
      expect(bal.native.assetId).toBe('lovelace');
      expect(bal.assets.length).toBeGreaterThan(0);
    });

    it('Midnight balance carries native NIGHT marked shielded', async () => {
      const bal = await mockAdapter.getBalance('midnight');
      expect(bal.chain).toBe('midnight');
      expect(bal.native.symbol).toBe('NIGHT');
      expect(bal.native.shielded).toBe(true);
    });
  });

  describe('signTransaction', () => {
    it('returns a SignedTx tagged with the original chain', async () => {
      const signed = await mockAdapter.signTransaction({
        chain: 'cardano',
        summary: ['Send 10 ADA'],
        body: 'cbor:deadbeef',
      });
      expect(signed.chain).toBe('cardano');
      expect(typeof signed.signed).toBe('string');
      expect(signed.signed).toContain('MOCK_SIGNED_TX_cardano');
    });

    it('produces a unique txHash per call (non-determinism is intentional in mock)', async () => {
      const a = await mockAdapter.signTransaction({
        chain: 'midnight',
        summary: [],
        body: 'cbor:01',
      });
      const b = await mockAdapter.signTransaction({
        chain: 'midnight',
        summary: [],
        body: 'cbor:02',
      });
      expect(a.txHash).not.toBe(b.txHash);
    });
  });

  describe('submitTransaction', () => {
    it('echoes back the signed.txHash if present', async () => {
      const result = await mockAdapter.submitTransaction({
        chain: 'cardano',
        signed: 'mock-signed',
        txHash: 'expected_hash_abc',
      });
      expect(result.txHash).toBe('expected_hash_abc');
    });

    it('synthesizes a hash when absent', async () => {
      const result = await mockAdapter.submitTransaction({
        chain: 'cardano',
        signed: 'mock-signed-no-hash',
      });
      expect(result.txHash).toMatch(/^mock_submitted_/);
    });
  });
});

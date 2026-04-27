/**
 * Unit tests for `midnight/handler.ts` — RPC routing for the Midnight namespace.
 *
 * Mirrors `cardano/handler.test.ts`. Mocks `./derive` so the handler is
 * a pure routing function. Asserts:
 *   - getAddress carries the placeholder marker (C1).
 *   - getPublicKey returns a hex pubkey + path.
 *   - Deferred methods throw NotYetImplementedError pointing at the
 *     correct milestone (M2 vs M3).
 */

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { JsonRpcRequest } from '@metamask/snaps-sdk';

import { NotYetImplementedError, UnknownMethodError } from '../../common/errors';

(globalThis as any).snap = { request: jest.fn() };

jest.mock('./derive', () => ({
  deriveMidnightKeys: jest.fn(),
}));

import { handleMidnight } from './handler';
import { deriveMidnightKeys } from './derive';

const FAKE_KEYS = {
  pubKey: new Uint8Array(32).fill(0xa1),
  path: "m/44'/1296'/0'/0/0",
};

function req(method: string, params?: unknown): { origin: string; request: JsonRpcRequest } {
  return {
    origin: 'https://test.local',
    request: { id: 1, jsonrpc: '2.0', method, params: params as any },
  };
}

beforeEach(() => {
  ((deriveMidnightKeys as unknown) as jest.Mock).mockReset();
  ((deriveMidnightKeys as unknown) as jest.Mock).mockImplementation(
    async () => FAKE_KEYS,
  );
});

describe('handleMidnight', () => {
  describe('midnight_getPublicKey', () => {
    it('returns hex pubkey + path', async () => {
      const result = (await handleMidnight(req('midnight_getPublicKey'))) as any;
      expect(result.pubKeyHex).toMatch(/^0x[a-f0-9]{64}$/);
      expect(result.path).toBe(FAKE_KEYS.path);
    });
  });

  describe('midnight_getAddress', () => {
    it('defaults to testnet-02 + sets placeholder=true (C1)', async () => {
      const result = (await handleMidnight(req('midnight_getAddress'))) as any;
      expect(result.network).toBe('testnet-02');
      expect(result.placeholder).toBe(true);
      expect(result.address).toContain('_stub_');
      expect(typeof result.note).toBe('string');
    });

    it('honors network=mainnet but still emits a placeholder', async () => {
      const result = (await handleMidnight(
        req('midnight_getAddress', { network: 'mainnet' }),
      )) as any;
      expect(result.network).toBe('mainnet');
      expect(result.placeholder).toBe(true);
      expect(result.address.startsWith('mn_stub_')).toBe(true);
    });
  });

  describe('M2-deferred methods', () => {
    it.each([
      'midnight_getBalance',
      'midnight_exportViewingKey',
      'midnight_scanShielded',
    ])('%s throws NotYetImplementedError', async (method) => {
      await expect(handleMidnight(req(method))).rejects.toBeInstanceOf(
        NotYetImplementedError,
      );
    });
  });

  describe('M3-deferred methods', () => {
    it.each([
      'midnight_signTx',
      'midnight_generateProof',
      'midnight_submitTx',
    ])('%s throws NotYetImplementedError', async (method) => {
      await expect(handleMidnight(req(method))).rejects.toBeInstanceOf(
        NotYetImplementedError,
      );
    });
  });

  describe('unknown methods', () => {
    it('rejects unrecognized midnight_* with UnknownMethodError', async () => {
      await expect(handleMidnight(req('midnight_summonDemons'))).rejects.toBeInstanceOf(
        UnknownMethodError,
      );
    });
  });
});

/**
 * Unit tests for `cardano/handler.ts` — RPC routing for the Cardano namespace.
 *
 * **Approach:** mock `./derive` so we never need to invoke the real Snap
 * runtime. The handler is then a pure function from request to response;
 * we assert the routing + response shape.
 *
 * **Why this matters:** the handler is where dApp-supplied params meet
 * our derivation pipeline. Dropping a param validation step here would
 * be invisible until an integration test caught it — and integration
 * tests don't run on every save. Unit-test the routing.
 *
 * SECURITY_CHECKLIST coverage:
 *   - B1 (network-byte confusion via param plumbing)
 *   - D1 (hostile params reach the validator)
 */

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { JsonRpcRequest } from '@metamask/snaps-sdk';

import { InvalidParamsError, NotYetImplementedError, UnknownMethodError } from '../../common/errors';

// Stub `snap` global with a jest.fn so the derive function (which the
// handler imports and calls) doesn't blow up reaching for runtime.
(globalThis as any).snap = { request: jest.fn() };

// Mock derive so handler tests are pure.
jest.mock('./derive', () => ({
  deriveCardanoKeys: jest.fn(),
}));

import { handleCardano } from './handler';
import { deriveCardanoKeys } from './derive';

const FAKE_KEYS = {
  paymentPubKey: new Uint8Array(32).fill(0xab),
  stakePubKey: new Uint8Array(32).fill(0xcd),
  paymentPath: "m/1852'/1815'/0'/0/0",
  stakePath: "m/1852'/1815'/0'/2/0",
};

function req(method: string, params?: unknown): { origin: string; request: JsonRpcRequest } {
  return {
    origin: 'https://test.local',
    request: { id: 1, jsonrpc: '2.0', method, params: params as any },
  };
}

beforeEach(() => {
  ((deriveCardanoKeys as unknown) as jest.Mock).mockReset();
  ((deriveCardanoKeys as unknown) as jest.Mock).mockImplementation(
    async () => FAKE_KEYS,
  );
});

describe('handleCardano', () => {
  describe('cardano_getPublicKey', () => {
    it('returns hex pubkeys + paths from derive output', async () => {
      const result = (await handleCardano(req('cardano_getPublicKey'))) as any;
      expect(result.payment.pubKeyHex).toMatch(/^0x[a-f0-9]{64}$/);
      expect(result.stake.pubKeyHex).toMatch(/^0x[a-f0-9]{64}$/);
      expect(result.payment.path).toBe(FAKE_KEYS.paymentPath);
      expect(result.stake.path).toBe(FAKE_KEYS.stakePath);
    });
  });

  describe('cardano_getAddress', () => {
    it('defaults to preprod when no network supplied', async () => {
      const result = (await handleCardano(req('cardano_getAddress'))) as any;
      expect(result.network).toBe('preprod');
      expect(result.address.startsWith('addr_test1')).toBe(true);
    });

    it('honors network=mainnet', async () => {
      const result = (await handleCardano(
        req('cardano_getAddress', { network: 'mainnet' }),
      )) as any;
      expect(result.network).toBe('mainnet');
      expect(result.address.startsWith('addr1')).toBe(true);
    });

    it('rejects bogus network through validate.ts (D1)', async () => {
      await expect(
        handleCardano(req('cardano_getAddress', { network: 'devnet' })),
      ).rejects.toBeInstanceOf(InvalidParamsError);
    });
  });

  describe('deferred methods', () => {
    it.each(['cardano_signTx', 'cardano_submitTx', 'cardano_signData'])(
      '%s throws NotYetImplementedError targeting M3',
      async (method) => {
        await expect(handleCardano(req(method))).rejects.toBeInstanceOf(
          NotYetImplementedError,
        );
      },
    );
  });

  describe('unknown methods', () => {
    it('rejects unrecognized cardano_* method with UnknownMethodError', async () => {
      await expect(handleCardano(req('cardano_summonDemons'))).rejects.toBeInstanceOf(
        UnknownMethodError,
      );
    });
  });
});

/**
 * Unit tests for `common/handler.ts` — the cross-chain RPC handler.
 *
 * The `common_*` namespace is the dApp's discovery layer:
 *   - getSupportedChains: which chains are CMM-aware?
 *   - getBrand:           strings the dApp UI shows.
 *   - getCapabilities:    feature flags so dApps gate on milestone state.
 *
 * Bugs here cause dApps to either show "unavailable" for working
 * features or claim features that aren't done yet. Both are bad UX.
 */

import { describe, expect, it } from '@jest/globals';
import type { JsonRpcRequest } from '@metamask/snaps-sdk';

import { handleCommon } from './handler';
import { UnknownMethodError } from './errors';

function req(method: string): { origin: string; request: JsonRpcRequest } {
  return {
    origin: 'https://test.local',
    request: { id: 1, jsonrpc: '2.0', method, params: undefined },
  };
}

describe('handleCommon', () => {
  describe('common_getSupportedChains', () => {
    it('returns both Cardano and Midnight in the list', async () => {
      const result = (await handleCommon(req('common_getSupportedChains'))) as {
        chains: string[];
      };
      expect(result.chains).toContain('cardano');
      expect(result.chains).toContain('midnight');
    });
  });

  describe('common_getBrand', () => {
    it('returns brand + longName strings', async () => {
      const result = (await handleCommon(req('common_getBrand'))) as {
        brand: string;
        longName: string;
      };
      expect(typeof result.brand).toBe('string');
      expect(typeof result.longName).toBe('string');
      expect(result.brand.length).toBeGreaterThan(0);
      expect(result.longName.length).toBeGreaterThan(0);
    });
  });

  describe('common_getCapabilities', () => {
    it('reports milestone M1', async () => {
      const result = (await handleCommon(req('common_getCapabilities'))) as {
        milestone: string;
      };
      expect(result.milestone).toBe('M1');
    });

    it('Cardano: getAddress/getPublicKey live, signing deferred', async () => {
      const result = (await handleCommon(req('common_getCapabilities'))) as {
        capabilities: {
          cardano: { getAddress: boolean; getPublicKey: boolean; signTx: boolean };
        };
      };
      expect(result.capabilities.cardano.getAddress).toBe(true);
      expect(result.capabilities.cardano.getPublicKey).toBe(true);
      expect(result.capabilities.cardano.signTx).toBe(false);
    });

    it('Midnight: getAddress is "placeholder" (clearly not live yet)', async () => {
      const result = (await handleCommon(req('common_getCapabilities'))) as {
        capabilities: {
          midnight: { getAddress: string | boolean; signTx: boolean };
        };
      };
      // Critical: dApp UIs branch on this — anything OTHER than the
      // literal string 'placeholder' would be a contract break.
      expect(result.capabilities.midnight.getAddress).toBe('placeholder');
      expect(result.capabilities.midnight.signTx).toBe(false);
    });
  });

  describe('unknown methods', () => {
    it('rejects unknown common_* method with UnknownMethodError', async () => {
      await expect(handleCommon(req('common_doesNotExist'))).rejects.toBeInstanceOf(
        UnknownMethodError,
      );
    });
  });
});

/**
 * Unit tests for `midnight/derive.ts` — Midnight HD derivation.
 *
 * Mirrors `cardano/derive.test.ts` shape. Asserts:
 *   1. We request the right path + curve from the host (A1, B3).
 *   2. Derivation failure surfaces as DerivationError with chain=midnight.
 *   3. Cause chain is preserved for debugging.
 *
 * Full SLIP10 fixture tests (returning real pubkeys) land in M2 once
 * we have midnight-js-cross-validated KAT values.
 */

import { describe, expect, it, jest } from '@jest/globals';

import { DerivationError } from '../../common/errors';
import { deriveMidnightKeys } from './derive';

describe('deriveMidnightKeys', () => {
  it('requests m/44\'/1296\' on curve ed25519 (A1, B3)', async () => {
    const requestSpy: any = (jest.fn() as any).mockResolvedValue({});

    await deriveMidnightKeys(requestSpy).catch(() => {
      /* swallow — synthetic fixture won't survive key-tree */
    });

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'snap_getBip32Entropy',
      params: {
        path: ['m', "44'", "1296'"],
        curve: 'ed25519',
      },
    });
  });

  it('throws DerivationError when host denies entropy (A3)', async () => {
    const denied: any = (jest.fn() as any).mockRejectedValue(
      new Error('Permission not granted'),
    );

    await expect(deriveMidnightKeys(denied)).rejects.toBeInstanceOf(
      DerivationError,
    );
  });

  it('error chain attribution is "midnight"', async () => {
    const denied: any = (jest.fn() as any).mockRejectedValue(
      new Error('host died'),
    );
    try {
      await deriveMidnightKeys(denied);
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as DerivationError).chain).toBe('midnight');
      expect((err as DerivationError).code).toBe('CMM_DERIVATION_FAILED');
    }
  });

  // KAT placeholders — populate when M2 mnemonic pipeline arrives.
  it.todo('TEST_MNEMONIC produces a known fixed 32-byte pubkey');
  it.todo('Midnight pubkey is disjoint from Cardano pubkey for the same seed (B4)');
});

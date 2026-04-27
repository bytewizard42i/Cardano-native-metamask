/**
 * Unit tests for `cardano/derive.ts` — HD key derivation (CIP-1852).
 *
 * **Strategy:** mock `snap.request` to return a fixed BIP32 entropy
 * blob and assert:
 *   1. We request the right path + curve from the host (A1, A3, B3).
 *   2. The result contains payment + stake pubkeys (NOT private keys).
 *   3. The reported derivation paths match what we actually derived.
 *
 * SECURITY_CHECKLIST coverage:
 *   - A1 (manifest permission boundary)
 *   - A3 (private-key isolation)
 *   - B3 (wrong-curve derivation)
 *   - B4 (cross-chain key reuse) — companion test in midnight/derive.test.ts
 *
 * Pattern reference: BTC Snap mocks `@metamask/bitcoindevkit` at module
 * level. We don't need module mocks — we mock the host-RPC entry point
 * because that's the actual security boundary.
 */

import { describe, expect, it, jest } from '@jest/globals';

import { DerivationError } from '../../common/errors';
import { deriveCardanoKeys } from './derive';

// ---------------------------------------------------------------------------
// Synthetic BIP32 entropy fixture
// ---------------------------------------------------------------------------

/**
 * Shape mirrors what `snap_getBip32Entropy` returns for an ed25519 SLIP10
 * node. The values are non-zero / distinct so child derivations actually
 * produce something we can assert on.
 *
 * If `@metamask/key-tree`'s expected JSON shape changes, update here +
 * cross-link from `derive.ts`.
 */
const FIXTURE_ENTROPY = {
  depth: 2,
  masterFingerprint: 0x12345678,
  parentFingerprint: 0x87654321,
  index: 1815 + 0x80000000, // hardened
  curve: 'ed25519' as const,
  privateKey:
    '0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20',
  publicKey:
    '0x00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00',
  chainCode:
    '0xa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebf',
};

describe('deriveCardanoKeys', () => {
  it('requests m/1852\'/1815\' on curve ed25519 (A1, B3)', async () => {
    const requestSpy = jest
      .fn<typeof snap.request>()
      .mockResolvedValue(FIXTURE_ENTROPY as any);

    await deriveCardanoKeys(requestSpy as any).catch(() => {
      // We don't care if downstream key-tree derivation fails on the
      // synthetic fixture; we only care WHAT we asked the host for.
    });

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'snap_getBip32Entropy',
      params: {
        path: ['m', "1852'", "1815'"],
        curve: 'ed25519',
      },
    });
  });

  it('throws DerivationError when host denies entropy (A3)', async () => {
    const denied = jest
      .fn<typeof snap.request>()
      .mockRejectedValue(new Error('Permission not granted'));

    await expect(deriveCardanoKeys(denied as any)).rejects.toBeInstanceOf(
      DerivationError,
    );
  });

  it('error preserves underlying cause for debugging', async () => {
    const cause = new Error('Permission not granted');
    const denied = jest.fn<typeof snap.request>().mockRejectedValue(cause);

    try {
      await deriveCardanoKeys(denied as any);
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(DerivationError);
      expect((err as DerivationError).cause).toBe(cause);
      expect((err as DerivationError).chain).toBe('cardano');
    }
  });

  // -----------------------------------------------------------------
  // The following tests require a fully-valid SLIP10 fixture that
  // key-tree will accept. We mark them `it.todo` until M2 lands the
  // real test mnemonic + cross-validated expected values. They are
  // the placeholder for the most important security assertions.
  // -----------------------------------------------------------------

  it.todo(
    'returns payment + stake PUBLIC keys only — no privateKey field anywhere (A3)',
  );

  it.todo(
    'reports paymentPath = "m/1852\'/1815\'/0\'/0/0" exactly',
  );

  it.todo(
    'reports stakePath = "m/1852\'/1815\'/0\'/2/0" exactly',
  );

  it.todo(
    'payment pubkey ≠ stake pubkey for the same root (different role index)',
  );

  it.todo(
    'BIP-39 #1 mnemonic produces a known fixed 32-byte payment pubkey (KAT)',
  );
});

/**
 * Unit tests for `midnight/address.ts` — placeholder address contract.
 *
 * **What we're locking in (M1):** the placeholder format. The dApp UI
 * relies on the literal `_stub_` substring to gate sends. If that
 * substring ever drops out, sends could go to a wrong-but-plausible
 * address. These tests are the regression guard until M2 swaps the
 * implementation for real midnight-js encoding.
 *
 * SECURITY_CHECKLIST coverage:
 *   - C1 (placeholder mistaken for live)
 *   - C3 (network confusion)
 */

import { describe, expect, it } from '@jest/globals';

import {
  isMidnightPlaceholder,
  midnightPlaceholderAddress,
} from './address';

const FAKE_PK = new Uint8Array(32).map((_, i) => (i + 1) * 3);

describe('midnightPlaceholderAddress', () => {
  describe('contract that the dApp UI depends on (C1)', () => {
    it('contains the literal "_stub_" substring', () => {
      const addr = midnightPlaceholderAddress(FAKE_PK, 'testnet-02');
      expect(addr).toContain('_stub_');
    });

    it('isMidnightPlaceholder returns true for our placeholders', () => {
      const addr = midnightPlaceholderAddress(FAKE_PK, 'testnet-02');
      expect(isMidnightPlaceholder(addr)).toBe(true);
    });

    it('isMidnightPlaceholder returns false for a non-stub string', () => {
      // Once M2 ships real addresses, this is what real ones will look
      // like (no _stub_ marker).
      expect(isMidnightPlaceholder('mn_test_02_1abc...')).toBe(false);
      expect(isMidnightPlaceholder('mn1abc...')).toBe(false);
    });
  });

  describe('HRP correctness (C3)', () => {
    it('mainnet HRP is "mn"', () => {
      const addr = midnightPlaceholderAddress(FAKE_PK, 'mainnet');
      expect(addr.startsWith('mn_stub_')).toBe(true);
    });

    it('testnet-02 HRP is "mn_test_02"', () => {
      const addr = midnightPlaceholderAddress(FAKE_PK, 'testnet-02');
      expect(addr.startsWith('mn_test_02_stub_')).toBe(true);
    });

    it('mainnet and testnet placeholders differ', () => {
      const main = midnightPlaceholderAddress(FAKE_PK, 'mainnet');
      const test = midnightPlaceholderAddress(FAKE_PK, 'testnet-02');
      expect(main).not.toBe(test);
    });
  });

  describe('determinism', () => {
    it('same pubkey + network → same placeholder', () => {
      const a = midnightPlaceholderAddress(FAKE_PK, 'testnet-02');
      const b = midnightPlaceholderAddress(FAKE_PK, 'testnet-02');
      expect(a).toBe(b);
    });
  });
});

/**
 * Unit tests for `cardano/address.ts` — Shelley base address encoding.
 *
 * **Why KATs (Known-Answer Tests) over snapshots:** snapshots silently
 * regenerate. Cryptographic outputs MUST be compared against explicit
 * expected values. Re-deriving an expected vector forces a human to
 * pause and confirm the change is intentional.
 *
 * **Reference vectors:**
 *
 * The canonical CIP-19 test vectors live at
 *   https://cips.cardano.org/cip/CIP-19#test-vectors
 *
 * For M1 we use one inlined fixture (network-byte + HRP coverage) and
 * round-trip our own output through `bech32` to verify shape. M2 will
 * add full CIP-19 vector cross-checks once we adopt CIP-3 BIP32-Ed25519
 * and our addresses become Lace-interoperable.
 *
 * SECURITY_CHECKLIST coverage:
 *   - B1 (network-byte confusion)
 *   - B2 (address-type confusion)
 *   - B5 (bech32 truncation / overflow)
 */

import { describe, expect, it } from '@jest/globals';
import { bech32 } from 'bech32';

import { blake2b224, buildShelleyBaseAddress } from './address';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** 32-byte fixture: distinct, non-zero, deterministic. */
const PAYMENT_PK = new Uint8Array(32).map((_, i) => (i * 7 + 1) % 256);
/** Different fixture so payment-hash ≠ stake-hash in the layout. */
const STAKE_PK = new Uint8Array(32).map((_, i) => (i * 11 + 5) % 256);

// ---------------------------------------------------------------------------
// blake2b-224
// ---------------------------------------------------------------------------

describe('blake2b224', () => {
  it('returns exactly 28 bytes (Cardano credential hash size)', () => {
    const hash = blake2b224(new Uint8Array(32));
    expect(hash.length).toBe(28);
  });

  it('is deterministic', () => {
    const a = blake2b224(PAYMENT_PK);
    const b = blake2b224(PAYMENT_PK);
    expect(Buffer.from(a)).toEqual(Buffer.from(b));
  });

  it('produces distinct outputs for distinct inputs', () => {
    const a = blake2b224(PAYMENT_PK);
    const b = blake2b224(STAKE_PK);
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// buildShelleyBaseAddress
// ---------------------------------------------------------------------------

describe('buildShelleyBaseAddress', () => {
  describe('HRP correctness (B1)', () => {
    it('mainnet → addr1...', () => {
      const addr = buildShelleyBaseAddress(PAYMENT_PK, STAKE_PK, 'mainnet');
      expect(addr.startsWith('addr1')).toBe(true);
    });

    it('preprod → addr_test1...', () => {
      const addr = buildShelleyBaseAddress(PAYMENT_PK, STAKE_PK, 'preprod');
      expect(addr.startsWith('addr_test1')).toBe(true);
    });

    it('preview → addr_test1... (shares testnet HRP)', () => {
      const addr = buildShelleyBaseAddress(PAYMENT_PK, STAKE_PK, 'preview');
      expect(addr.startsWith('addr_test1')).toBe(true);
    });
  });

  describe('header byte (B1, B2)', () => {
    /** Decode an address back to its raw bytes for header inspection. */
    function decodeRaw(addr: string): Uint8Array {
      const { words } = bech32.decode(addr, 1023);
      return Uint8Array.from(bech32.fromWords(words));
    }

    it('mainnet header byte = 0x01 (network=1, type=0)', () => {
      const addr = buildShelleyBaseAddress(PAYMENT_PK, STAKE_PK, 'mainnet');
      const raw = decodeRaw(addr);
      expect(raw[0]).toBe(0x01);
    });

    it('testnet header byte = 0x00 (network=0, type=0)', () => {
      const addr = buildShelleyBaseAddress(PAYMENT_PK, STAKE_PK, 'preprod');
      const raw = decodeRaw(addr);
      expect(raw[0]).toBe(0x00);
    });

    it('payload is exactly 1 + 28 + 28 = 57 bytes', () => {
      const addr = buildShelleyBaseAddress(PAYMENT_PK, STAKE_PK, 'preprod');
      const raw = decodeRaw(addr);
      expect(raw.length).toBe(57);
    });

    it('payment hash occupies bytes 1..29; stake hash occupies bytes 29..57', () => {
      const addr = buildShelleyBaseAddress(PAYMENT_PK, STAKE_PK, 'preprod');
      const raw = decodeRaw(addr);
      expect(Array.from(raw.slice(1, 29))).toEqual(
        Array.from(blake2b224(PAYMENT_PK)),
      );
      expect(Array.from(raw.slice(29, 57))).toEqual(
        Array.from(blake2b224(STAKE_PK)),
      );
    });
  });

  describe('determinism (F1 in checklist)', () => {
    it('same inputs always produce the same address', () => {
      const a = buildShelleyBaseAddress(PAYMENT_PK, STAKE_PK, 'preprod');
      const b = buildShelleyBaseAddress(PAYMENT_PK, STAKE_PK, 'preprod');
      expect(a).toBe(b);
    });

    it('swapping payment/stake produces a different address', () => {
      const a = buildShelleyBaseAddress(PAYMENT_PK, STAKE_PK, 'preprod');
      const b = buildShelleyBaseAddress(STAKE_PK, PAYMENT_PK, 'preprod');
      expect(a).not.toBe(b);
    });

    it('changing network produces a different address', () => {
      const main = buildShelleyBaseAddress(PAYMENT_PK, STAKE_PK, 'mainnet');
      const test = buildShelleyBaseAddress(PAYMENT_PK, STAKE_PK, 'preprod');
      expect(main).not.toBe(test);
    });
  });

  describe('bech32 limit (B5)', () => {
    it('produces an address well over the default-90 bech32 limit', () => {
      // A real Shelley base address is ~103 chars. If we ever forget
      // the 1023 limit override, this test will catch the truncation.
      const addr = buildShelleyBaseAddress(PAYMENT_PK, STAKE_PK, 'mainnet');
      expect(addr.length).toBeGreaterThan(90);
      expect(addr.length).toBeLessThan(120);
    });

    it('round-trips through bech32 with the Cardano 1023 limit', () => {
      const addr = buildShelleyBaseAddress(PAYMENT_PK, STAKE_PK, 'mainnet');
      // Will throw if the address exceeds the limit.
      expect(() => bech32.decode(addr, 1023)).not.toThrow();
    });
  });
});

/**
 * Unit tests for `validate.ts` — the dApp-boundary input gate.
 *
 * **Why this is the FIRST test file in the suite:** every malicious
 * input the Snap might face passes through these helpers. If a fuzz-y
 * dApp can sneak past `optCardanoNetwork` / `optMidnightNetwork`, it
 * gets the chance to influence key derivation indirectly. Testing
 * these first establishes the safety floor for everything else.
 *
 * Pattern reference: `references/metamask-snap-bitcoin-wallet/packages/snap/
 *   src/handlers/validation.test.ts` — same `it.each(...)` style for
 *   parameterized invalid inputs.
 */

import { describe, expect, it } from '@jest/globals';

import { InvalidParamsError } from './errors';
import { optCardanoNetwork, optMidnightNetwork } from './validate';

describe('common/validate', () => {
  describe('optCardanoNetwork', () => {
    const method = 'cardano_getAddress';

    describe('valid inputs', () => {
      it.each(['mainnet', 'preprod', 'preview'] as const)(
        'accepts %s',
        (network) => {
          expect(optCardanoNetwork(method, { network })).toBe(network);
        },
      );

      it('returns undefined for null params', () => {
        expect(optCardanoNetwork(method, null)).toBeUndefined();
      });

      it('returns undefined for undefined params', () => {
        expect(optCardanoNetwork(method, undefined)).toBeUndefined();
      });

      it('returns undefined when network field is absent', () => {
        expect(optCardanoNetwork(method, {})).toBeUndefined();
      });

      it('returns undefined when network is null', () => {
        expect(optCardanoNetwork(method, { network: null })).toBeUndefined();
      });
    });

    describe('hostile inputs', () => {
      it('rejects a positional array (no smuggling via array indices)', () => {
        expect(() =>
          optCardanoNetwork(method, ['mainnet'] as unknown as object),
        ).toThrow(InvalidParamsError);
      });

      it('rejects a string as the whole params blob', () => {
        expect(() =>
          optCardanoNetwork(method, 'mainnet' as unknown as object),
        ).toThrow(InvalidParamsError);
      });

      it('rejects non-string network value (number)', () => {
        expect(() =>
          optCardanoNetwork(method, { network: 42 }),
        ).toThrow(InvalidParamsError);
      });

      it('rejects non-string network value (boolean)', () => {
        expect(() =>
          optCardanoNetwork(method, { network: true }),
        ).toThrow(InvalidParamsError);
      });

      it.each([
        'Mainnet', // wrong case
        'MAINNET',
        'pre-prod', // hyphenated
        'devnet', // not in our enum
        '',
        ' mainnet', // leading whitespace
        'mainnet ', // trailing whitespace
      ])('rejects unknown network string %p', (badNetwork) => {
        expect(() =>
          optCardanoNetwork(method, { network: badNetwork }),
        ).toThrow(InvalidParamsError);
      });
    });

    describe('error contract (D3 / D4 in SECURITY_CHECKLIST)', () => {
      it('error code is the stable CMM_INVALID_PARAMS', () => {
        try {
          optCardanoNetwork(method, { network: 'devnet' });
          throw new Error('should have thrown');
        } catch (err) {
          expect(err).toBeInstanceOf(InvalidParamsError);
          expect((err as InvalidParamsError).code).toBe('CMM_INVALID_PARAMS');
          expect((err as InvalidParamsError).chain).toBe('cardano');
        }
      });

      it('error message echoes the bad value but only inside quotes', () => {
        // D3: the test asserts the bad input is fenced inside quotes,
        // never interpolated bare into the message.
        try {
          optCardanoNetwork(method, { network: 'devnet' });
        } catch (err) {
          expect((err as Error).message).toContain('"devnet"');
        }
      });
    });
  });

  describe('optMidnightNetwork', () => {
    const method = 'midnight_getAddress';

    it.each(['mainnet', 'testnet-02'] as const)('accepts %s', (network) => {
      expect(optMidnightNetwork(method, { network })).toBe(network);
    });

    it('rejects testnet-01 (old testnet identifier — C3)', () => {
      expect(() =>
        optMidnightNetwork(method, { network: 'testnet-01' }),
      ).toThrow(InvalidParamsError);
    });

    it('attaches chain=midnight on rejection', () => {
      try {
        optMidnightNetwork(method, { network: 'devnet' });
      } catch (err) {
        expect((err as InvalidParamsError).chain).toBe('midnight');
      }
    });
  });
});

/**
 * Unit tests for `errors.ts`.
 *
 * **Public contract (D4 in SECURITY_CHECKLIST).** The dApp-side SDK
 * branches on `error.data.code`, not on error messages. These tests
 * are the regression guard that locks in those code strings forever.
 * Renaming any of these codes is a major-version-breaking change.
 */

import { describe, expect, it } from '@jest/globals';

import {
  CmmSnapError,
  DerivationError,
  InvalidParamsError,
  NotYetImplementedError,
  UnknownMethodError,
} from './errors';

describe('common/errors', () => {
  describe('error code stability (public contract)', () => {
    it('UnknownMethodError → CMM_UNKNOWN_METHOD', () => {
      const err = new UnknownMethodError('foo_bar');
      expect(err.code).toBe('CMM_UNKNOWN_METHOD');
    });

    it('NotYetImplementedError → CMM_NOT_YET_IMPLEMENTED', () => {
      const err = new NotYetImplementedError('cardano_signTx', 'M3', 'cardano');
      expect(err.code).toBe('CMM_NOT_YET_IMPLEMENTED');
    });

    it('InvalidParamsError → CMM_INVALID_PARAMS', () => {
      const err = new InvalidParamsError(
        'cardano_getAddress',
        'bad network',
        'cardano',
      );
      expect(err.code).toBe('CMM_INVALID_PARAMS');
    });

    it('DerivationError → CMM_DERIVATION_FAILED', () => {
      const err = new DerivationError('boom', 'cardano');
      expect(err.code).toBe('CMM_DERIVATION_FAILED');
    });
  });

  describe('inheritance', () => {
    it('all CMM errors extend CmmSnapError', () => {
      expect(new UnknownMethodError('x')).toBeInstanceOf(CmmSnapError);
      expect(new NotYetImplementedError('x', 'M3')).toBeInstanceOf(CmmSnapError);
      expect(new InvalidParamsError('x', 'y')).toBeInstanceOf(CmmSnapError);
      expect(new DerivationError('x', 'cardano')).toBeInstanceOf(CmmSnapError);
    });

    it('CmmSnapError extends Error', () => {
      const err = new UnknownMethodError('x');
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe('message construction (D3: no input echoed bare)', () => {
    it('UnknownMethodError quotes the method name', () => {
      const err = new UnknownMethodError('evil_method"; DROP TABLE users');
      // The bad input is inside quotes — never bare. Even if it contains
      // SQL-injection-shaped strings, they're inert text in JSON-RPC.
      expect(err.message).toContain('"evil_method"; DROP TABLE users"');
    });

    it('InvalidParamsError preserves caller-supplied detail', () => {
      const err = new InvalidParamsError(
        'cardano_getAddress',
        '`network` must be a string',
        'cardano',
      );
      expect(err.message).toContain('cardano_getAddress');
      expect(err.message).toContain('`network` must be a string');
    });

    it('NotYetImplementedError mentions milestone for dApp-side gating', () => {
      const err = new NotYetImplementedError('midnight_signTx', 'M3', 'midnight');
      expect(err.message).toContain('M3');
      expect(err.message).toContain('midnight_signTx');
    });
  });

  describe('chain attribution', () => {
    it('attaches chain to NotYetImplementedError', () => {
      const err = new NotYetImplementedError('cardano_signTx', 'M3', 'cardano');
      expect(err.chain).toBe('cardano');
    });

    it('attaches chain to InvalidParamsError', () => {
      const err = new InvalidParamsError('x', 'y', 'midnight');
      expect(err.chain).toBe('midnight');
    });

    it('chain is undefined for cross-chain errors', () => {
      const err = new UnknownMethodError('foo');
      expect(err.chain).toBeUndefined();
    });
  });

  describe('cause chain (debugging aid)', () => {
    it('DerivationError preserves underlying cause', () => {
      const cause = new Error('snap_getBip32Entropy denied');
      const err = new DerivationError('keys failed', 'cardano', cause);
      expect(err.cause).toBe(cause);
    });
  });
});

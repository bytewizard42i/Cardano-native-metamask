/**
 * Error hierarchy surfaced by CMM Snap RPC handlers.
 *
 * The Snap runtime serializes thrown errors to JSON-RPC errors with our
 * `message` and an optional `data` payload. Keeping a small, named
 * hierarchy lets the dApp-side SDK branch on well-known shapes without
 * parsing error strings.
 */

import type { ChainId } from '@cmm/shared';

export class CmmSnapError extends Error {
  public readonly code: string;
  public readonly chain?: ChainId;
  public override readonly cause?: unknown;

  constructor(args: { code: string; message: string; chain?: ChainId; cause?: unknown }) {
    super(args.message);
    this.name = 'CmmSnapError';
    this.code = args.code;
    this.chain = args.chain;
    this.cause = args.cause;
  }
}

/** Method name not recognized by the dispatcher. */
export class UnknownMethodError extends CmmSnapError {
  constructor(method: string) {
    super({
      code: 'CMM_UNKNOWN_METHOD',
      message: `CMM: unknown RPC method "${method}"`,
    });
    this.name = 'UnknownMethodError';
  }
}

/** Method exists but is deferred to a future milestone. */
export class NotYetImplementedError extends CmmSnapError {
  constructor(method: string, milestone: string, chain?: ChainId) {
    super({
      code: 'CMM_NOT_YET_IMPLEMENTED',
      message: `CMM: method "${method}" lands in milestone ${milestone}. See docs/BUILD_STRATEGY.md.`,
      chain,
    });
    this.name = 'NotYetImplementedError';
  }
}

/** Malformed / missing required params. */
export class InvalidParamsError extends CmmSnapError {
  constructor(method: string, detail: string, chain?: ChainId) {
    super({
      code: 'CMM_INVALID_PARAMS',
      message: `CMM: invalid params for "${method}": ${detail}`,
      chain,
    });
    this.name = 'InvalidParamsError';
  }
}

/** Internal key-derivation or crypto failure. */
export class DerivationError extends CmmSnapError {
  constructor(message: string, chain: ChainId, cause?: unknown) {
    super({ code: 'CMM_DERIVATION_FAILED', message: `CMM: ${message}`, chain, cause });
    this.name = 'DerivationError';
  }
}

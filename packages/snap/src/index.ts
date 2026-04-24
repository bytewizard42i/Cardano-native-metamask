/**
 * CMM Snap — entry point.
 *
 * Milestone M1: real key derivation + address generation live for both
 * chains. Signing / tx submission deferred to M3. See BUILD_STRATEGY.md.
 */

import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';

import { handleCardano } from './chains/cardano/handler';
import { handleMidnight } from './chains/midnight/handler';
import { handleCommon } from './common/handler';
import { CmmSnapError, UnknownMethodError } from './common/errors';

/**
 * RPC dispatcher. Routes `cardano_*`, `midnight_*`, and `common_*` method
 * namespaces to the corresponding chain adapter. Unwraps `CmmSnapError`
 * into stable JSON-RPC error payloads so the dApp-side SDK can branch on
 * `error.data.code` without parsing strings.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({ origin, request }) => {
  try {
    const method = request.method;

    if (method.startsWith('cardano_')) {
      return await handleCardano({ origin, request });
    }

    if (method.startsWith('midnight_')) {
      return await handleMidnight({ origin, request });
    }

    if (method.startsWith('common_')) {
      return await handleCommon({ origin, request });
    }

    throw new UnknownMethodError(method);
  } catch (err) {
    if (err instanceof CmmSnapError) {
      const wrapped: Error & { data?: unknown } = new Error(err.message);
      wrapped.data = { code: err.code, chain: err.chain };
      throw wrapped;
    }
    throw err;
  }
};

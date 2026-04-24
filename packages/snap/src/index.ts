/**
 * CMM Snap — entry point.
 *
 * Milestone M0 (scaffold): responds to a handful of RPC methods with
 * clearly-marked placeholder results. No key derivation. No signing.
 *
 * Real behavior ships in M2 (read-only) and M3 (signing) per BUILD_STRATEGY.md.
 */

import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';

import { handleCardano } from './chains/cardano/handler.js';
import { handleMidnight } from './chains/midnight/handler.js';
import { handleCommon } from './common/handler.js';

/**
 * RPC dispatcher. Routes `cardano_*`, `midnight_*`, and `common_*` method
 * namespaces to the corresponding chain adapter.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({ origin, request }) => {
  const method = request.method;

  if (method.startsWith('cardano_')) {
    return handleCardano({ origin, request });
  }

  if (method.startsWith('midnight_')) {
    return handleMidnight({ origin, request });
  }

  if (method.startsWith('common_')) {
    return handleCommon({ origin, request });
  }

  throw new Error(`CMM: unknown RPC method "${method}"`);
};

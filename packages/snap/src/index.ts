/**
 * CMM Snap — entry point.
 *
 * Milestone M1: real key derivation + address generation live for both
 * chains. Signing / tx submission deferred to M3. See BUILD_STRATEGY.md.
 */

import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';
import {
  InternalError,
  InvalidParamsError as RpcInvalidParamsError,
  MethodNotFoundError,
} from '@metamask/snaps-sdk';

import { handleCardano } from './chains/cardano/handler';
import { handleMidnight } from './chains/midnight/handler';
import { handleCommon } from './common/handler';
import {
  CmmSnapError,
  InvalidParamsError,
  NotYetImplementedError,
  UnknownMethodError,
} from './common/errors';

/**
 * RPC dispatcher. Routes `cardano_*`, `midnight_*`, and `common_*` method
 * namespaces to the corresponding chain adapter.
 *
 * **Error mapping.** We use `@metamask/snaps-sdk`'s standard JSON-RPC
 * error wrappers so the Snap runtime serializes them correctly to the
 * dApp:
 *
 * - `UnknownMethodError`     → `MethodNotFoundError`     (code -32601)
 * - `NotYetImplementedError` → `MethodNotFoundError`     (code -32601, with milestone hint in data)
 * - `InvalidParamsError`     → `InvalidParamsError(SDK)` (code -32602)
 * - everything else          → `InternalError`           (code -32603)
 *
 * Each carries our `data: { code: 'CMM_*', chain }` payload so the
 * dApp-side SDK branches on `error.data.cause.data.code` (the nested
 * shape is the SDK's `SerializedSnapError` envelope; see SnapError docs).
 *
 * Pattern reference: BTC Snap's `HandlerMiddleware.ts` does the same
 * mapping — see `references/metamask-snap-bitcoin-wallet/packages/snap/
 * src/handlers/HandlerMiddleware.ts`.
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
      const data: Record<string, unknown> = { code: err.code };
      if (err.chain) data.chain = err.chain;

      if (err instanceof UnknownMethodError || err instanceof NotYetImplementedError) {
        throw new MethodNotFoundError(err.message, data as never);
      }
      if (err instanceof InvalidParamsError) {
        throw new RpcInvalidParamsError(err.message, data as never);
      }
      throw new InternalError(err.message, data as never);
    }
    throw err;
  }
};

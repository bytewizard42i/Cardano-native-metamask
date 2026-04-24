/**
 * Lightweight param validators for the Snap's RPC handlers.
 *
 * **Why this exists.** A malicious dApp can pass arbitrary JSON to our
 * Snap — unknown fields, wrong types, oversize strings. Without guards,
 * we'd crash (or worse, silently accept garbage and derive keys on
 * unintended paths). These helpers turn untrusted JSON into typed
 * results or throw a stable `InvalidParamsError` the dApp can handle.
 *
 * **Why not superstruct/zod.** The BTC Snap uses `superstruct`, but for
 * our M1 surface (2 optional fields across 6 methods) a 40-line hand
 * validator is clearer and keeps the Snap bundle small. We'll swap to
 * superstruct if/when the param surface grows past ~5 methods.
 */

import type { CardanoNetwork, MidnightNetwork } from '@cmm/shared';
import { InvalidParamsError } from './errors';

const CARDANO_NETWORKS: readonly CardanoNetwork[] = ['mainnet', 'preprod', 'preview'];
const MIDNIGHT_NETWORKS: readonly MidnightNetwork[] = ['mainnet', 'testnet-02'];

/** Return `params.network` if it's a valid Cardano network string, else `undefined`. */
export function optCardanoNetwork(
  method: string,
  params: unknown,
): CardanoNetwork | undefined {
  if (params === undefined || params === null) return undefined;
  if (typeof params !== 'object' || Array.isArray(params)) {
    throw new InvalidParamsError(method, 'params must be an object', 'cardano');
  }
  const raw = (params as { network?: unknown }).network;
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== 'string') {
    throw new InvalidParamsError(method, '`network` must be a string', 'cardano');
  }
  if (!CARDANO_NETWORKS.includes(raw as CardanoNetwork)) {
    throw new InvalidParamsError(
      method,
      `\`network\` must be one of: ${CARDANO_NETWORKS.join(', ')} (got "${raw}")`,
      'cardano',
    );
  }
  return raw as CardanoNetwork;
}

/** Return `params.network` if it's a valid Midnight network string, else `undefined`. */
export function optMidnightNetwork(
  method: string,
  params: unknown,
): MidnightNetwork | undefined {
  if (params === undefined || params === null) return undefined;
  if (typeof params !== 'object' || Array.isArray(params)) {
    throw new InvalidParamsError(method, 'params must be an object', 'midnight');
  }
  const raw = (params as { network?: unknown }).network;
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== 'string') {
    throw new InvalidParamsError(method, '`network` must be a string', 'midnight');
  }
  if (!MIDNIGHT_NETWORKS.includes(raw as MidnightNetwork)) {
    throw new InvalidParamsError(
      method,
      `\`network\` must be one of: ${MIDNIGHT_NETWORKS.join(', ')} (got "${raw}")`,
      'midnight',
    );
  }
  return raw as MidnightNetwork;
}

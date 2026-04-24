import { bytesToHex } from '@metamask/utils';
import type { CardanoNetwork } from '@cmm/shared';
import type { HandlerArgs, HandlerResult } from '../../common/handler';
import { NotYetImplementedError, UnknownMethodError } from '../../common/errors';
import { deriveCardanoKeys } from './derive';
import { buildShelleyBaseAddress } from './address';

/**
 * Cardano RPC handler.
 *
 * M1 live methods:
 *   - cardano_getPublicKey  → hex payment + stake pubkeys + derivation paths
 *   - cardano_getAddress    → bech32 Shelley base address for a network
 *
 * M3 methods (signing): still deferred.
 *
 * Per MIDNIGHT_FIRST_STRATEGY.md we prioritize Midnight for the M6 allowlist
 * submission, but we keep the Cardano read-path live from M1 so the
 * companion dApp can demonstrate both chains side-by-side.
 */
export async function handleCardano({ request }: HandlerArgs): HandlerResult {
  switch (request.method) {
    case 'cardano_getPublicKey': {
      const keys = await deriveCardanoKeys(snap.request);
      return {
        payment: {
          pubKeyHex: bytesToHex(keys.paymentPubKey),
          path: keys.paymentPath,
        },
        stake: {
          pubKeyHex: bytesToHex(keys.stakePubKey),
          path: keys.stakePath,
        },
      };
    }

    case 'cardano_getAddress': {
      const network = parseNetwork(request.params) ?? 'preprod';
      const keys = await deriveCardanoKeys(snap.request);
      const address = buildShelleyBaseAddress(
        keys.paymentPubKey,
        keys.stakePubKey,
        network,
      );
      return {
        address,
        network,
        paymentPath: keys.paymentPath,
        stakePath: keys.stakePath,
      };
    }

    case 'cardano_signTx':
    case 'cardano_submitTx':
    case 'cardano_signData':
      throw new NotYetImplementedError(request.method, 'M3', 'cardano');

    default:
      throw new UnknownMethodError(request.method);
  }
}

/**
 * Extract and validate the optional `{ network }` param. Defaults to preprod
 * when absent — M1 is testnet-first per BUILD_STRATEGY.md.
 */
function parseNetwork(params: unknown): CardanoNetwork | undefined {
  if (!params || typeof params !== 'object') return undefined;
  const raw = (params as { network?: unknown }).network;
  if (raw === 'mainnet' || raw === 'preprod' || raw === 'preview') return raw;
  return undefined;
}

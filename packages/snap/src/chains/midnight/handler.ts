import { bytesToHex } from '@metamask/utils';
import type { HandlerArgs, HandlerResult } from '../../common/handler';
import { NotYetImplementedError, UnknownMethodError } from '../../common/errors';
import { optMidnightNetwork } from '../../common/validate';
import { deriveMidnightKeys } from './derive';
import { midnightPlaceholderAddress } from './address';

/**
 * Midnight RPC handler.
 *
 * M1 live methods:
 *   - midnight_getPublicKey → hex spending pubkey + derivation path
 *   - midnight_getAddress   → PLACEHOLDER address ("mn_test_02_stub_...").
 *                             Real encoding requires midnight-js viewing
 *                             key work in M2.
 *
 * M2 methods (balance reads via viewing key): still deferred.
 * M3 methods (signing, proof generation): still deferred.
 */
export async function handleMidnight({ request }: HandlerArgs): HandlerResult {
  switch (request.method) {
    case 'midnight_getPublicKey': {
      const keys = await deriveMidnightKeys(snap.request);
      return {
        pubKeyHex: bytesToHex(keys.pubKey),
        path: keys.path,
      };
    }

    case 'midnight_getAddress': {
      const network = optMidnightNetwork(request.method, request.params) ?? 'testnet-02';
      const keys = await deriveMidnightKeys(snap.request);
      return {
        address: midnightPlaceholderAddress(keys.pubKey, network),
        network,
        path: keys.path,
        placeholder: true,
        note: 'Placeholder encoding — real Midnight address ships in M2 with midnight-js viewing-key derivation.',
      };
    }

    case 'midnight_getBalance':
    case 'midnight_exportViewingKey':
    case 'midnight_scanShielded':
      throw new NotYetImplementedError(request.method, 'M2', 'midnight');

    case 'midnight_signTx':
    case 'midnight_generateProof':
    case 'midnight_submitTx':
      throw new NotYetImplementedError(request.method, 'M3', 'midnight');

    default:
      throw new UnknownMethodError(request.method);
  }
}

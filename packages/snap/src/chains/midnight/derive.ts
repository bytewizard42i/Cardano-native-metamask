import { SLIP10Node } from '@metamask/key-tree';
import type { ChainId } from '@cmm/shared';
import { DerivationError } from '../../common/errors';

/**
 * Midnight HD key derivation (M1 scope).
 *
 *   m / 44' / 1296' / account' / 0 / index
 *
 * Midnight is not yet officially registered in SLIP-44; `1296'` is our
 * working placeholder until the Foundation assigns a real coin type.
 * Update here + in `snap.manifest.json` once that's settled.
 *
 * M1 curve: plain ed25519. M2 will confirm against midnight-js.
 *
 * IMPORTANT: balances & transaction authorization in Midnight are NOT
 * derived from this key directly — they require a *viewing key* which is
 * separately derived inside the Midnight wallet SDK. This module returns
 * the top-level spending key; viewing-key derivation is M2 scope.
 */

const CMM_MIDNIGHT_ACCOUNT_INDEX = 0;
const CMM_MIDNIGHT_ADDRESS_INDEX = 0;

/** A derived Midnight key ready for (placeholder) address assembly. */
export interface MidnightDerivedKeys {
  pubKey: Uint8Array;
  path: string;
}

const chain: ChainId = 'midnight';

export async function deriveMidnightKeys(
  snapRequest: typeof snap.request,
): Promise<MidnightDerivedKeys> {
  try {
    const entropy = await snapRequest({
      method: 'snap_getBip32Entropy',
      params: {
        path: ['m', "44'", "1296'"],
        curve: 'ed25519',
      },
    });

    const coinRoot = await SLIP10Node.fromJSON(entropy);

    const addrNode = await coinRoot.derive([
      `bip32:${CMM_MIDNIGHT_ACCOUNT_INDEX}'`,
      'bip32:0',
      `bip32:${CMM_MIDNIGHT_ADDRESS_INDEX}`,
    ]);

    return {
      pubKey: toBytes(addrNode.publicKeyBytes),
      path: `m/44'/1296'/${CMM_MIDNIGHT_ACCOUNT_INDEX}'/0/${CMM_MIDNIGHT_ADDRESS_INDEX}`,
    };
  } catch (cause) {
    throw new DerivationError(
      'Midnight key derivation failed — ensure snap_getBip32Entropy permission is granted for m/44\'/1296\' on curve ed25519.',
      chain,
      cause,
    );
  }
}

function toBytes(pk: Uint8Array): Uint8Array {
  if (pk.length === 33 && pk[0] === 0x00) return pk.slice(1);
  return pk;
}

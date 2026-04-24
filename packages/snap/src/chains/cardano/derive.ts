import { SLIP10Node } from '@metamask/key-tree';
import type { ChainId } from '@cmm/shared';
import { DerivationError } from '../../common/errors.js';

/**
 * Cardano HD key derivation per CIP-1852.
 *
 *   m / 1852' / 1815' / account' / role / index
 *
 * Roles we care about:
 *   - 0 = external payment chain
 *   - 2 = stake / reward chain
 *
 * The permission for `snap_getBip32Entropy` in snap.manifest.json only
 * grants the root at `m / 1852' / 1815'`. Deeper indices (account, role,
 * index) are derived in-Snap via key-tree. That's the Snap-security best
 * practice: minimum-privilege root, fine-grained children.
 *
 * IMPORTANT (M1 note): key-tree's `ed25519` curve is plain RFC 8032
 * Ed25519, not the BIP32-Ed25519 variant Cardano actually uses (CIP-3).
 * In M2 we'll either add a CIP-3 derivation helper or vendor-isolate a
 * cardano-specific library. Until then the addresses we generate are
 * SHAPE-CORRECT (bech32 `addr_test1...`) but NOT interoperable with Lace
 * / Eternl keys. This is good enough for M1 demos.
 */

const CMM_CARDANO_ACCOUNT_INDEX = 0;
const CMM_CARDANO_ADDRESS_INDEX = 0;

const ROLE_PAYMENT = 0;
const ROLE_STAKE = 2;

/** A derived pair of Cardano public keys ready for address assembly. */
export interface CardanoDerivedKeys {
  paymentPubKey: Uint8Array;
  stakePubKey: Uint8Array;
  /** The CIP-1852 derivation path actually used (for debugging / dialog). */
  paymentPath: string;
  stakePath: string;
}

const chain: ChainId = 'cardano';

export async function deriveCardanoKeys(
  snapRequest: typeof snap.request,
): Promise<CardanoDerivedKeys> {
  try {
    const entropy = await snapRequest({
      method: 'snap_getBip32Entropy',
      params: {
        path: ['m', "1852'", "1815'"],
        curve: 'ed25519',
      },
    });

    const accountRoot = await SLIP10Node.fromJSON(entropy);

    // Derive account-level node (1852' / 1815' / account').
    const accountNode = await accountRoot.derive([
      `bip32:${CMM_CARDANO_ACCOUNT_INDEX}'`,
    ]);

    // Payment key: account' / 0 / 0
    const paymentNode = await accountNode.derive([
      `bip32:${ROLE_PAYMENT}`,
      `bip32:${CMM_CARDANO_ADDRESS_INDEX}`,
    ]);

    // Stake key: account' / 2 / 0
    const stakeNode = await accountNode.derive([
      `bip32:${ROLE_STAKE}`,
      `bip32:${CMM_CARDANO_ADDRESS_INDEX}`,
    ]);

    return {
      paymentPubKey: toBytes(paymentNode.publicKeyBytes),
      stakePubKey: toBytes(stakeNode.publicKeyBytes),
      paymentPath: `m/1852'/1815'/${CMM_CARDANO_ACCOUNT_INDEX}'/${ROLE_PAYMENT}/${CMM_CARDANO_ADDRESS_INDEX}`,
      stakePath: `m/1852'/1815'/${CMM_CARDANO_ACCOUNT_INDEX}'/${ROLE_STAKE}/${CMM_CARDANO_ADDRESS_INDEX}`,
    };
  } catch (cause) {
    throw new DerivationError(
      'Cardano key derivation failed — ensure snap_getBip32Entropy permission is granted for m/1852\'/1815\' on curve ed25519.',
      chain,
      cause,
    );
  }
}

/**
 * Ed25519 public keys from SLIP10 come in a 33-byte form (0x00 + 32 key bytes)
 * for compatibility with the secp256k1 compressed-point convention. Cardano
 * wants the raw 32-byte key for its hash input, so we strip the leading byte.
 */
function toBytes(pk: Uint8Array): Uint8Array {
  if (pk.length === 33 && pk[0] === 0x00) return pk.slice(1);
  return pk;
}

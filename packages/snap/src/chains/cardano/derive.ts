import { SLIP10Node } from '@metamask/key-tree';
import type { ChainId } from '@cmm/shared';
import { DerivationError } from '../../common/errors';

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
 *
 * SLIP-10 ed25519 quirks (key-tree v10):
 *   - Use `slip10:` prefix for ed25519 — NOT `bip32:`. The `bip32:`
 *     prefix routes through key-tree's BIP-32 deriver which is
 *     secp256k1-only. `slip10:` routes through the curve-aware deriver.
 *   - Plain Ed25519 SLIP-10 only supports HARDENED derivation. Real
 *     CIP-1852 has non-hardened role + index components but those rely
 *     on BIP32-Ed25519 (CIP-3). For M1 we hard-code every component as
 *     hardened so the derivation succeeds.
 *   - M2 swap target: `cip3:` prefix + standard CIP-1852 layout (mixed
 *     hardened/non-hardened) for full Lace/Eternl interop.
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
      `slip10:${CMM_CARDANO_ACCOUNT_INDEX}'`,
    ]);

    // Payment key: account' / 0' / 0' (hardened-everywhere for M1)
    const paymentNode = await accountNode.derive([
      `slip10:${ROLE_PAYMENT}'`,
      `slip10:${CMM_CARDANO_ADDRESS_INDEX}'`,
    ]);

    // Stake key: account' / 2' / 0' (hardened-everywhere for M1)
    const stakeNode = await accountNode.derive([
      `slip10:${ROLE_STAKE}'`,
      `slip10:${CMM_CARDANO_ADDRESS_INDEX}'`,
    ]);

    return {
      paymentPubKey: toBytes(paymentNode.publicKeyBytes),
      stakePubKey: toBytes(stakeNode.publicKeyBytes),
      paymentPath: `m/1852'/1815'/${CMM_CARDANO_ACCOUNT_INDEX}'/${ROLE_PAYMENT}'/${CMM_CARDANO_ADDRESS_INDEX}'`,
      stakePath: `m/1852'/1815'/${CMM_CARDANO_ACCOUNT_INDEX}'/${ROLE_STAKE}'/${CMM_CARDANO_ADDRESS_INDEX}'`,
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

import { bytesToHex } from '@metamask/utils';
import type { MidnightNetwork } from '@cmm/shared';

/**
 * Midnight address encoding — **M1 placeholder**.
 *
 * The real Midnight address format is defined by the midnight-js wallet
 * SDK and is NOT a simple bech32 of the spending pubkey. It involves the
 * viewing key, proof keys, and a ZK-friendly commitment scheme.
 *
 * Rather than ship a wrong-looking-but-plausible address (which would
 * create confusion), M1 emits a clearly-labeled developer placeholder:
 *
 *     mn_test_02_stub_<first16hex>
 *
 * M2 swaps this implementation for real encoding once we've integrated
 * the Midnight wallet SDK and understood the viewing-key derivation.
 *
 * The dApp-side UI should recognize the `_stub_` substring and surface
 * a "placeholder — upgrade to M2" hint so no one mistakes this for a
 * live address.
 */

/** Public HRPs. Kept separate from the encoding so M2 can reuse them. */
const HRP_TESTNET = 'mn_test_02';
const HRP_MAINNET = 'mn';

export function midnightPlaceholderAddress(
  pubKey: Uint8Array,
  network: MidnightNetwork,
): string {
  const hrp = network === 'mainnet' ? HRP_MAINNET : HRP_TESTNET;
  const fingerprint = bytesToHex(pubKey).slice(2, 18); // first 8 bytes → 16 hex chars
  return `${hrp}_stub_${fingerprint}`;
}

/** Type guard used by the UI to flag placeholder addresses. */
export function isMidnightPlaceholder(address: string): boolean {
  return address.includes('_stub_');
}

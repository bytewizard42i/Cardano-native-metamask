import { blake2b } from '@noble/hashes/blake2b';
import { bech32 } from 'bech32';
import type { CardanoNetwork } from '@cmm/shared';

/**
 * Encode a Shelley *base* address (payment-key + stake-key) per CIP-19.
 *
 * Byte layout:
 *
 *     ┌────────────┬─────────────────────────┬─────────────────────────┐
 *     │ header (1) │ blake2b-224(payment_pk) │ blake2b-224(stake_pk)   │
 *     │            │ 28 bytes                │ 28 bytes                │
 *     └────────────┴─────────────────────────┴─────────────────────────┘
 *     header = (address_type << 4) | network_id
 *                └─ 0 for base (key-key)
 *                                            └─ 0 = testnet, 1 = mainnet
 *
 *   → preprod header = 0x00
 *   → mainnet header = 0x01
 *
 * Then bech32-encode with HRP:
 *   - `addr`      for mainnet
 *   - `addr_test` for preprod / preview
 *
 * Bech32 limit for Cardano is raised to 1023 chars via bech32's
 * `toWords`/`encode(hrp, words, LIMIT)` override.
 */

/** Network byte per CIP-19 §5. */
const NETWORK_MAINNET = 0x01;
const NETWORK_TESTNET = 0x00; // preprod + preview share the testnet byte

const ADDRESS_TYPE_BASE_KEY_KEY = 0x00; // upper nibble of header

/** Cardano bech32 address limit (well above default 90). */
const CARDANO_BECH32_LIMIT = 1023;

function networkByteFor(network: CardanoNetwork): number {
  return network === 'mainnet' ? NETWORK_MAINNET : NETWORK_TESTNET;
}

function hrpFor(network: CardanoNetwork): string {
  return network === 'mainnet' ? 'addr' : 'addr_test';
}

/** Cardano uses blake2b-224 (28-byte output) on the raw ed25519 pubkey. */
export function blake2b224(input: Uint8Array): Uint8Array {
  return blake2b(input, { dkLen: 28 });
}

/**
 * Build a Shelley base address from raw ed25519 public keys.
 *
 * @param paymentPk  32-byte ed25519 public key (payment credential)
 * @param stakePk    32-byte ed25519 public key (stake credential)
 * @param network    'mainnet' | 'preprod' | 'preview'
 * @returns bech32 string: `addr1...` or `addr_test1...`
 */
export function buildShelleyBaseAddress(
  paymentPk: Uint8Array,
  stakePk: Uint8Array,
  network: CardanoNetwork,
): string {
  const paymentHash = blake2b224(paymentPk);
  const stakeHash = blake2b224(stakePk);

  const header = (ADDRESS_TYPE_BASE_KEY_KEY << 4) | networkByteFor(network);

  const bytes = new Uint8Array(1 + 28 + 28);
  bytes[0] = header;
  bytes.set(paymentHash, 1);
  bytes.set(stakeHash, 1 + 28);

  const words = bech32.toWords(bytes);
  return bech32.encode(hrpFor(network), words, CARDANO_BECH32_LIMIT);
}

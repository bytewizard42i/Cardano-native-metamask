import type { ChainId } from './chains';

/**
 * Chain-specific address. Opaque to the dApp; chain adapter decodes.
 * Cardano: bech32 (e.g. "addr1...").
 * Midnight: chain-specific shielded or unshielded encoding.
 */
export type ChainAddress = string;

/** A single asset balance record. */
export interface AssetBalance {
  /** Canonical asset identifier (e.g. "lovelace", "policy.assetName", "night", "dust"). */
  assetId: string;
  /** Human-readable ticker (e.g. "ADA", "NIGHT"). */
  symbol: string;
  /** Decimal places applied when formatting. */
  decimals: number;
  /** Raw integer amount (in smallest units) as a string for bigint safety. */
  amount: string;
  /** True if the balance is shielded (Midnight). */
  shielded?: boolean;
}

/** Full balance snapshot for an account on a given chain. */
export interface Balance {
  chain: ChainId;
  /** Optional per-chain network identifier (e.g. 'preprod', 'testnet-02'). */
  network?: string;
  address: ChainAddress;
  native: AssetBalance;
  assets: AssetBalance[];
}

/** Transaction payload handed to the Snap for approval and signing. */
export interface TxPayload {
  chain: ChainId;
  /** Human-readable summary lines shown in the approval dialog. */
  summary: string[];
  /** Chain-specific serialized tx body (CBOR for Cardano, TBD for Midnight). */
  body: string;
  /** Required witness set hints, if any. */
  witnessHints?: string[];
}

/** Signed transaction returned by the Snap. */
export interface SignedTx {
  chain: ChainId;
  /** Hex or base64 serialized signed transaction ready to submit. */
  signed: string;
  /** Content hash for observability / receipt. */
  txHash?: string;
}

/** Network selector (testnet vs mainnet). */
export type Network = 'mainnet' | 'testnet';

/** Snap-level error surface. */
export interface CmmError {
  code: string;
  message: string;
  chain?: ChainId;
  cause?: unknown;
}

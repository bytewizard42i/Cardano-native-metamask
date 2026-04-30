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

/**
 * A single unspent transaction output. Shape is chain-agnostic so dApps can
 * render UTXO lists without caring which chain they came from; chain-specific
 * fields are exposed via optional properties.
 */
export interface Utxo {
  chain: ChainId;
  /** Transaction hash the UTXO was created in (hex). */
  txHash: string;
  /** Output index within the creating transaction. */
  outputIndex: number;
  /** Address that controls the UTXO (bech32 on Cardano; shielded-address placeholder on Midnight). */
  address: ChainAddress;
  /** Lovelace / DUST / equivalent smallest-unit amount as stringified integer for bigint safety. */
  amount: string;
  /** Additional native-asset multi-values (Cardano: policy+asset; Midnight: DUST commitments). */
  assets?: AssetBalance[];
  /** Optional inline datum (Cardano Plutus) or commitment (Midnight). */
  datum?: string;
  /** Optional reference-script / proof-hash pointer. */
  scriptRef?: string;
  /** True if the balance is shielded (Midnight UTXOs are always shielded at M2+). */
  shielded?: boolean;
}

/**
 * Latest-block snapshot. Used by indexer.healthcheck() and by the diagnostics
 * console to surface "chain is advancing" / "chain is stuck" signals.
 */
export interface BlockInfo {
  chain: ChainId;
  /** Block hash (hex) — used to de-dup / confirm freshness. */
  hash: string;
  /** Block height — monotonic, suitable for stall detection. */
  height: number;
  /** Block slot number (chain-specific; optional). */
  slot?: number;
  /** Block timestamp in seconds since unix epoch; present on every major chain. */
  time: number;
  /** Epoch number (Cardano) or equivalent (Midnight). Optional. */
  epoch?: number;
}

/**
 * Lightweight network descriptor. Emitted by indexer.getNetworkInfo() for use
 * in the companion-dApp header strip and MidnightVitals diagnostics.
 */
export interface NetworkInfo {
  chain: ChainId;
  /** e.g. 'preprod', 'mainnet', 'testnet-02'. */
  network: string;
  /** Current protocol / era label if known (e.g. 'Conway', 'Ariadne'). */
  era?: string;
  /** Latest block known to the indexer. */
  latestBlock?: BlockInfo;
  /** Milliseconds since the last block was produced. Useful for stall detection. */
  msSinceLastBlock?: number;
  /** Indexer's self-reported health flag, if any. */
  healthy?: boolean;
}

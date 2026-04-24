/**
 * CMM constants — brand, chain metadata, default endpoints.
 *
 * Defaults only. All endpoint values MUST be user-configurable at runtime.
 */

export const CMM_BRAND = 'CMM';
export const CMM_LONG_NAME = 'Cardano + Midnight in MetaMask';

/** BIP-44 / SLIP-0044 registered coin types. */
export const COIN_TYPE_CARDANO = 1815 as const;
/** Midnight coin type — placeholder until SLIP-0044 registration finalized. */
export const COIN_TYPE_MIDNIGHT_PLACEHOLDER = 0x4d494454 as const; // "MIDT"

/** Default Cardano indexer endpoints (user-configurable). */
export const DEFAULT_CARDANO_INDEXER = {
  mainnet: 'https://cardano-mainnet.blockfrost.io/api/v0',
  testnet: 'https://cardano-preprod.blockfrost.io/api/v0',
} as const;

/** Default Midnight indexer endpoints (Blockfrost Midnight Indexer). */
export const DEFAULT_MIDNIGHT_INDEXER = {
  mainnet: 'https://midnight-mainnet.blockfrost.io/api/v0',
  testnet: 'https://midnight-preview.blockfrost.io/api/v0',
} as const;

/** Default proof server endpoints (Midnight). */
export const DEFAULT_PROOF_SERVER_REMOTE = 'https://proof-server.midnight.network';
export const DEFAULT_PROOF_SERVER_LOCAL = 'http://localhost:6300';

/** Maximum tx body size we'll decode inside the Snap dialog (bytes). */
export const MAX_TX_PREVIEW_BYTES = 65_536;

/* -------------------------------------------------------------------------- */
/* Native asset metadata                                                       */
/* -------------------------------------------------------------------------- */

/** Cardano's native asset ticker. */
export const CARDANO_NATIVE_SYMBOL = 'ADA' as const;
/** Cardano: 1 ADA = 10^6 lovelace. */
export const CARDANO_DECIMALS = 6 as const;

/** Midnight's native asset ticker. */
export const MIDNIGHT_NATIVE_SYMBOL = 'NIGHT' as const;
/** Midnight native-token decimals — placeholder; verify against testnet-02 at M2. */
export const MIDNIGHT_DECIMALS = 6 as const;

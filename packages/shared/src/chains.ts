/**
 * Chain identifiers supported by CMM.
 *
 * NOTE: Midnight ships first per MIDNIGHT_FIRST_STRATEGY.md. Cardano
 * bolts on in a later milestone as an extension of the same Snap.
 */
export const CHAINS = ['midnight', 'cardano'] as const;
export type ChainId = (typeof CHAINS)[number];

export function isChainId(value: unknown): value is ChainId {
  return typeof value === 'string' && (CHAINS as readonly string[]).includes(value);
}

/** Cardano network selectors per Blockfrost's API surface. */
export const CARDANO_NETWORKS = ['mainnet', 'preprod', 'preview'] as const;
export type CardanoNetwork = (typeof CARDANO_NETWORKS)[number];

/** Midnight network selectors. `testnet-02` is the current public testnet. */
export const MIDNIGHT_NETWORKS = ['mainnet', 'testnet-02'] as const;
export type MidnightNetwork = (typeof MIDNIGHT_NETWORKS)[number];

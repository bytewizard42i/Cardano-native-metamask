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

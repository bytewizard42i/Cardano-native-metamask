/**
 * Shared constants for integration tests.
 *
 * The mnemonic is BIP-39 test vector #1 — the most published, most
 * cross-validated 12-word phrase in the industry. Every key derivation
 * test in this folder uses it so outputs are deterministic across runs
 * and across machines.
 *
 * **NEVER** import this from production code. The export is named
 * `TEST_MNEMONIC` to make grep-misuse obvious in code review.
 *
 * See docs/TESTING_STRATEGY.md §3 for the full rationale.
 */

/** BIP-39 test vector #1. Public, deterministic, never used for real funds. */
export const TEST_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

/** Origin string passed to onRpcRequest in tests. Mimics a real dApp host. */
export const TEST_ORIGIN = 'https://test.cmm.local';

/**
 * Method-name constants — keeps tests resilient to typos and gives a
 * single place to update if we ever rename a method (which is a
 * breaking change requiring a major version bump).
 */
export const RpcMethod = {
  Cardano: {
    GetPublicKey: 'cardano_getPublicKey',
    GetAddress: 'cardano_getAddress',
    SignTx: 'cardano_signTx',
  },
  Midnight: {
    GetPublicKey: 'midnight_getPublicKey',
    GetAddress: 'midnight_getAddress',
    SignTx: 'midnight_signTx',
  },
  Common: {
    GetSupportedChains: 'common_getSupportedChains',
    GetBrand: 'common_getBrand',
    GetCapabilities: 'common_getCapabilities',
  },
} as const;

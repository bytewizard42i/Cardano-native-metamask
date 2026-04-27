/**
 * Pinned expected outputs (Known-Answer Tests) for the BIP-39 #1 test
 * mnemonic at integration-test/constants.ts:TEST_MNEMONIC.
 *
 * **🚨 CRITICAL REVIEW RULE 🚨**
 * Changing any value in this file means our derivation logic changed.
 * Ask yourself:
 *
 *   1. Is the derivation change INTENTIONAL? (e.g. M2 swap to CIP-3
 *      BIP32-Ed25519 — yes, expected to change all Cardano vectors.)
 *   2. Is it documented in `docs/RESEARCH_LOG.md` with a date stamp?
 *   3. Does the PR description name the upstream library version /
 *      curve change that caused it?
 *
 * If you can't answer all three, **STOP** and request review from
 * someone who knows the chain. A silent change here means addresses
 * derived from the same seed in different versions of CMM no longer
 * match — a privacy + UX disaster.
 *
 * ---------------------------------------------------------------------
 *
 * Vectors below are MARKED `null` until M2 lands the real mnemonic-fed
 * derivation pipeline. They will be populated by:
 *
 *   1. Running the M2 derivation against TEST_MNEMONIC.
 *   2. Cross-validating the outputs against an independent library
 *      (Lace, Eternl, or `cardano-serialization-lib` reference).
 *   3. Recording the matching values here in the same commit.
 *
 * Until then, integration tests assert SHAPE (regex / prefix) only,
 * not exact-value equality.
 */

/** Cardano vectors. Empty until M2 CIP-3 derivation lands. */
export const CARDANO_EXPECTED = {
  // Format will be: payment + stake pubkeys (32 bytes each, hex), and
  // base addresses for each of: mainnet, preprod, preview.
  paymentPubKeyHex: null as string | null,
  stakePubKeyHex: null as string | null,
  addresses: {
    mainnet: null as string | null, // starts with 'addr1'
    preprod: null as string | null, // starts with 'addr_test1'
    preview: null as string | null, // starts with 'addr_test1'
  },
  paths: {
    payment: "m/1852'/1815'/0'/0/0",
    stake: "m/1852'/1815'/0'/2/0",
  },
} as const;

/** Midnight vectors. Real address vectors land in M2 with midnight-js. */
export const MIDNIGHT_EXPECTED = {
  pubKeyHex: null as string | null,
  // M1 placeholder format: deterministic but not a real Midnight address.
  placeholderAddressShape: /^(mn|mn_test_02)_stub_[0-9a-f]{16}$/,
  path: "m/44'/1296'/0'/0/0",
} as const;

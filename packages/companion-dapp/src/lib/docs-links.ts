/**
 * Single source of truth for external documentation URLs referenced from
 * the companion dApp's InfoHint tooltips. Keep this file tidy — every
 * link should point at authoritative docs, not blog posts or tutorials
 * that may rot.
 *
 * If you add a link, also add a short comment explaining what the user
 * will find at that URL. Makes code review + audit trivial.
 */

export const DOCS_LINKS = {
  // ─── MetaMask Snaps platform ────────────────────────────────────────

  /** Official intro to what a Snap is. */
  snapsOverview: 'https://docs.metamask.io/snaps/',

  /** Install MetaMask Flask (the developer build). */
  metaMaskFlask: 'https://docs.metamask.io/snaps/get-started/install-flask/',

  /** How `wallet_invokeSnap` works (the RPC entry point we use). */
  walletInvokeSnap: 'https://docs.metamask.io/snaps/reference/rpc-api/#wallet_invokesnap',

  /** Snap permissions reference — explains endowments we request. */
  snapPermissions: 'https://docs.metamask.io/snaps/reference/permissions/',

  /** MetaMask Snaps allowlist process (what we'll apply for in M6). */
  allowlistProcess: 'https://docs.metamask.io/snaps/how-to/publish-a-snap/',

  // ─── Cardano ────────────────────────────────────────────────────────

  /** CIP-1852 — HD derivation paths for Shelley. */
  cip1852: 'https://cips.cardano.org/cip/CIP-1852',

  /** CIP-19 — Cardano address format. Explains bech32 + network bytes. */
  cip19: 'https://cips.cardano.org/cip/CIP-19',

  /** CIP-30 — the dApp connector standard we conform to. */
  cip30: 'https://cips.cardano.org/cip/CIP-30',

  /** CIP-3 — Ed25519-BIP32 derivation used by Cardano wallets. */
  cip3: 'https://cips.cardano.org/cip/CIP-3',

  /** Cardano developer hub. */
  cardanoDevHub: 'https://developers.cardano.org/',

  /** Blockfrost — the indexer we use for Cardano preprod reads. */
  blockfrost: 'https://docs.blockfrost.io/',

  // ─── Midnight ───────────────────────────────────────────────────────

  /** Official Midnight documentation. */
  midnightDocs: 'https://docs.midnight.network/',

  /** Midnight's Compact language reference (the ZK smart-contract DSL). */
  midnightCompact: 'https://docs.midnight.network/develop/reference/compact/lang-ref',

  /** testnet-02: what we target throughout M1–M6. */
  midnightTestnet: 'https://docs.midnight.network/develop/testnet',

  /** Aiken — Cardano smart-contract DSL, context for what modern Cardano txs look like. */
  aikenLang: 'https://aiken-lang.org/',

  // ─── Cryptography primitives we use ─────────────────────────────────

  /** bech32 encoding — the bare-bones spec Cardano addresses conform to. */
  bech32: 'https://en.bitcoin.it/wiki/Bech32',

  /** blake2b — the hash Cardano uses for key → address. */
  blake2b: 'https://www.blake2.net/',

  /** BIP-32 HD key derivation — the base abstraction all HD wallets use. */
  bip32: 'https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki',

  /** BIP-44 account structure — the `m/purpose'/coin'/account'` path we derive on. */
  bip44: 'https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki',

  // ─── CMM internal docs ──────────────────────────────────────────────

  /** BUILD_STRATEGY explains the demoland-as-mocked-dApp approach. */
  cmmBuildStrategy:
    'https://github.com/bytewizard42i/Cardano-native-metamask/blob/main/docs/BUILD_STRATEGY.md',

  /** MIDNIGHT_FIRST_STRATEGY explains our ship-Midnight-before-Cardano reasoning. */
  cmmMidnightFirst:
    'https://github.com/bytewizard42i/Cardano-native-metamask/blob/main/docs/MIDNIGHT_FIRST_STRATEGY.md',

  /** ARCHITECTURE doc covers the full stack + security posture. */
  cmmArchitecture:
    'https://github.com/bytewizard42i/Cardano-native-metamask/blob/main/docs/ARCHITECTURE.md',
} as const;

export type DocsLinkKey = keyof typeof DOCS_LINKS;

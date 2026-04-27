# CMM Security Checklist

> **Status**: Living document. Reviewed every milestone gate.
> **Last updated**: 2026-04-26 (M1).
> **Audience**: Anyone touching `@cmm/snap` source. Read before opening a PR.

This is the threat model the test suite is designed to defend against.
Every check below should map to an automated test or a manual audit
gate. Lines marked **🔒 ENFORCED** have automated coverage; **📋 TODO**
items are tracked in the milestone they're scheduled for.

---

## A. MetaMask-Snap Threats (host platform)

### A1. Permission minimization (manifest)
- 🔒 **ENFORCED at M1**: `snap.manifest.json` requests only the BIP32 paths
  and curves we actually derive from. Adding a path requires PR review.
- Current grants:
  - `m/1852'/1815'` ed25519 (Cardano CIP-1852 root)
  - `m/44'/1815'` ed25519 (legacy Cardano BIP44)
  - `m/44'/1296'` ed25519 (Midnight, placeholder coin type)
- **Never grant** `endowment:cronjob`, `endowment:transaction-insight`,
  or wildcard `endowment:rpc.dapps:true` without a documented reason.
- 📋 **M3 TODO**: When we add `snap_dialog` confirmation flows, audit
  whether `endowment:rpc.snaps:false` is still appropriate.

### A2. Origin pinning (sensitive ops)
- 📋 **M3 TODO**: Signing methods (`cardano_signTx`, `midnight_signTx`)
  must inspect `origin` and prompt the user via `snap_dialog` showing
  the requesting dApp's domain. Never sign silently.
- 🔒 **ENFORCED**: M1 read-only methods (`getAddress`, `getPublicKey`)
  intentionally accept any origin since they leak no secrets.

### A3. Private key material isolation
- 🔒 **ENFORCED**: Private keys never leave `SLIP10Node` instances.
  Every code path returns `publicKeyBytes` only, never `privateKey`.
  Unit tests for `derive.ts` will assert no `privateKey` field appears
  in any returned object (see `derive.test.ts`).
- **Code review rule**: any PR introducing `.privateKey` access in the
  Snap requires two reviewers and a written justification in the PR body.

### A4. Manifest shasum integrity
- 🔒 **ENFORCED**: `mm-snap manifest` regenerates the shasum on every
  build. CI will fail if the committed shasum doesn't match the built
  bundle. **Never edit `source.shasum` by hand.**

### A5. Network access scoping
- M1: `endowment:network-access` is granted but unused (no fetch calls
  yet). Plan for M2 Blockfrost integration to use a single allowlisted
  hostname (`cardano-preprod.blockfrost.io`).
- 📋 **M2 TODO**: Add a runtime origin check on every `fetch()` to fail
  closed if a future contributor adds a wildcard URL.

---

## B. Cardano-Specific Threats

### B1. Network-byte confusion (CIP-19)
- 🔒 **ENFORCED**: `address.ts` builds the header byte from `network`
  enum, never accepts an arbitrary integer. `validate.ts` constrains
  network to `'mainnet' | 'preprod' | 'preview'`.
- 🔒 **ENFORCED**: Test vectors verify mainnet HRP `addr` and testnet
  HRP `addr_test` map to the correct network byte.

### B2. Address-type confusion (base vs enterprise vs reward)
- 🔒 **ENFORCED**: Only base addresses (type 0x00, key+key) are emitted
  in M1. Higher nibbles of the header byte are guarded by a constant.
- 📋 **M2 TODO**: When we add reward-account methods, the address-type
  selection must be controlled by a typed enum, never a raw byte.

### B3. Wrong-curve derivation
- 🔒 **ENFORCED at M1**: `derive.ts` hard-codes `curve: 'ed25519'`.
  Tests assert `snap_getBip32Entropy` is called with that exact curve.
- ⚠️ **Known limitation**: M1 uses plain Ed25519 instead of CIP-3
  BIP32-Ed25519. Documented in code; M2 swap is tracked.

### B4. Key reuse across chains
- 🔒 **ENFORCED**: Cardano root path (`m/1852'/1815'`) and Midnight
  root path (`m/44'/1296'`) are disjoint per SLIP-44. The same seed
  derives independent key trees for each chain.
- Tests assert that a Cardano address and a Midnight address derived
  from the same mnemonic do not share any pubkey bytes.

### B5. Bech32 truncation / overflow
- 🔒 **ENFORCED**: `bech32.encode(hrp, words, CARDANO_BECH32_LIMIT)`
  uses a 1023-char limit (per CIP-19 §3.1) instead of the default 90.
  Tests verify a real Shelley base address (~103 chars) round-trips.

### B6. Stake-key reuse exposing pseudonymity
- 📋 **M2 TODO**: Document that all M1 base addresses share the same
  stake credential (account 0' / role 2 / index 0). For privacy, M3
  should support multiple stake keys per account. Stake-key reuse is
  fingerprint-able on-chain.

---

## C. Midnight-Specific Threats

### C1. Placeholder address mistaken for live
- 🔒 **ENFORCED at M1**: `midnight_getAddress` response includes
  `placeholder: true` and a `note` field. `address.ts` exports
  `isMidnightPlaceholder()` for the dApp UI to gate sends.
- 🔒 **ENFORCED**: Address contains the literal substring `_stub_` so
  any string match guards correctly.

### C2. Viewing key leakage
- 🔒 **ENFORCED at M1**: No viewing-key derivation exists yet.
  `midnight_exportViewingKey` throws `NotYetImplementedError`.
- 📋 **M2 TODO**: When viewing-key support lands, the key MUST require
  explicit `snap_dialog` confirmation showing the requesting origin.
  Viewing keys reveal full transaction history — leak == privacy total
  loss.

### C3. Network confusion (testnet-02 vs mainnet)
- 🔒 **ENFORCED**: Network HRPs are disjoint (`mn` vs `mn_test_02`).
  No mainnet codepath ships in M1. M2 must keep mainnet behind a
  feature flag until audit.

### C4. Coin-type squat
- ⚠️ **Known**: SLIP-44 coin type `1296'` is our placeholder until
  the Midnight Foundation registers an official one. Tracked in
  `derive.ts` and the manifest. **Update both atomically when fixed.**

### C5. ZK-proof generation timing leaks
- 📋 **M3 TODO**: When `midnight_generateProof` lands, document and
  test that proof time does not depend on secret inputs (constant-time
  obligations from the proof system).

---

## D. dApp-Boundary Threats

### D1. Hostile-JSON params
- 🔒 **ENFORCED**: Every handler routes params through `validate.ts`
  before touching them. Strings are length-bounded, enums are
  whitelisted, objects rejected if not plain.
- 🔒 **ENFORCED**: `Array.isArray(params)` is rejected — params must
  be a JSON object, never a positional array.

### D2. Method-name spoofing / typosquatting
- 🔒 **ENFORCED**: The dispatcher uses `startsWith('cardano_'|'midnight_'|'common_')`
  prefix routing. Anything else throws `UnknownMethodError`. We don't
  do fuzzy matching.

### D3. Error-message data leakage
- 🔒 **ENFORCED**: Error messages contain only method names, parameter
  names, and constant explanatory text. Never echo back unsanitized
  input. (`InvalidParamsError(method, detail)` — `detail` is built by
  us, not the caller.)
- 📋 **PR rule**: any new error path that interpolates user-supplied
  input into the message requires a unit test verifying the input is
  not echoed back.

### D4. Error-code stability (public contract)
- 🔒 **ENFORCED**: Codes (`CMM_UNKNOWN_METHOD`, `CMM_NOT_YET_IMPLEMENTED`,
  `CMM_INVALID_PARAMS`, `CMM_DERIVATION_FAILED`) are tested for
  presence and exact spelling. Renaming requires a major version bump
  and a `BREAKING.md` entry.

---

## E. Build / Supply Chain Threats

### E1. Dependency provenance
- 🔒 **ENFORCED**: All runtime deps are first-party MetaMask packages
  (`@metamask/*`), audited crypto libraries (`@noble/hashes`), and
  reference-implementation libs (`bech32`). No fly-by-night packages.
- 📋 **M2 TODO**: Add `pnpm audit` to CI with a strict allowlist for
  unfixable advisories.

### E2. Reference-repo drift
- 🔒 **ENFORCED**: The 6 MetaMask reference forks at
  `references/metamask-*` are pinned by submodule SHA. They cannot
  silently update. See `REFERENCE_REPOS.md` for refresh procedure.

### E3. Bundle size as attack surface
- 📋 **M2 TODO**: Add a `bundlesize` budget to the build (target:
  Snap bundle < 500KB compressed). A bundle that suddenly grows is a
  signal something pulled in.

---

## F. Test-Suite Hygiene (the tests defending all of the above)

### F1. Determinism
- 🔒 **ENFORCED**: All key/address tests use the BIP-39 #1 test
  mnemonic. Output is reproducible byte-for-byte.

### F2. No live network in tests
- 🔒 **ENFORCED**: Unit tests mock `snap.request`. Integration tests
  use `installSnap()` with `network-access` permission revoked unless
  a specific test grants it.

### F3. Coverage thresholds
- 📋 **M1 starting bar**: 60% lines / 60% branches / 60% functions /
  60% statements. Ratchet up to MetaMask BTC's 75%/65% by M3.
- 🔒 **ENFORCED**: Lowering the bar requires PR justification.

### F4. Known-Answer Tests (KATs) over snapshots
- 🔒 **POLICY**: All cryptographic outputs (addresses, hashes, hex
  pubkeys) are compared against explicit expected values, never
  `toMatchSnapshot()`. Snapshots silently regenerate; KATs don't.

---

## G. Out-of-Scope (Documented Non-Threats)

- **Side-channel attacks on the host browser**: out of scope; trust the
  Snap runtime's isolation guarantees.
- **Physical device attacks**: out of scope; defer to MetaMask's
  hardware-wallet integration when we add it.
- **Phishing the user into installing a malicious clone of CMM**:
  out of scope at the Snap layer; mitigated by the Snap registry
  allowlist (M6).

---

*Cross-references: `TESTING_STRATEGY.md` (how we verify), `RESEARCH_LOG.md`
(decisions log), `NATIVE_PATH.md` (long-term Snap → first-party path).*

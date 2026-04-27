# Testing Strategy

> **Status**: Adopted — M1 phase. *Last updated: 2026-04-26.*
> **Owner**: Penny / Cassie / Cara / Casie + John

This is the canonical answer to "how do we test the CMM Snap?". It's
grounded in a deep read of how MetaMask itself tests their first-party
Snaps — primarily `@metamask/bitcoin-wallet-snap` (our EUTXO cousin and
the closest architectural reference we have).

---

## 1. How MetaMask Tests Their Snaps (Deep Dive)

We read every test file in `references/metamask-snap-bitcoin-wallet/packages/snap/`
to extract their pattern. Two layers, clean separation:

### Layer 1 — Unit tests (`src/**/*.test.ts`)

- **Runner**: `jest@30` + `ts-jest@29`
- **Preset**: `@metamask/snaps-jest` (provides snap-aware globals)
- **Mocking**: `jest-mock-extended` for typed mocks of class interfaces
- **Coverage**: enforced thresholds (BTC Snap: lines 75%, branches 65%,
  functions 62%, statements 74%)
- **Co-location**: `Foo.ts` and `Foo.test.ts` sit side-by-side in `src/`
- **Native deps stubbed at module level**: `jest.mock('@metamask/bitcoindevkit', ...)`
  so wasm modules don't need to load
- **`resetMocks: true`** in config — never trust cross-test pollution
- **Coverage exclusions**: `index.ts` files, since they're just re-exports

What they test at this layer:
- Pure parsing/validation (`validation.test.ts`)
- Handler routing logic (`RpcHandler.test.ts`) — mock all use-cases
- Mappings between chain primitives and MetaMask types (`mappings.test.ts`)
- Repository / cache behavior (`InMemoryCache.test.ts`)

### Layer 2 — Integration tests (`integration-test/*.test.ts`)

- **Same runner**, separate folder, separate `jest.config.integration.js`
- Uses `installSnap()` from `@metamask/snaps-jest` — actually boots the
  Snap inside a sandboxed test runtime
- Pass a known mnemonic via `options.secretRecoveryPhrase` so all key
  derivations are **deterministic and reproducible**
- `snap.mockJsonRpc((req) => ...)` intercepts platform RPCs:
  - `snap_dialog` → return `true` (auto-accept) or `false` (auto-reject)
  - `snap_manageAccounts` → return synthetic accounts
  - `snap_trackError` → return `{}` (swallow telemetry)
- Call the real handler: `snap.onRpcRequest({ origin, method, params })`
- For BTC, they stand up a **regtest blockchain** (`BlockchainTestUtils`)
  to fund accounts and mine blocks. We won't need that until M3 (when we
  start building real txs); at M1 we test only key/address derivation.

### Layer 3 — Lint / typecheck / depcheck (already in CI)

- `tsc --noEmit` for type safety
- `eslint . --ext js,jsx,ts,tsx` with `@metamask/eslint-config-snaps`
- `depcheck` to catch unused dependencies (security: shrinks bundle)
- `prettier --check '**/*.{json,md}'`

---

## 2. CMM's Adopted Strategy

We mirror the BTC Snap pattern with three deliberate simplifications:

| MetaMask BTC | CMM | Why |
|---|---|---|
| `superstruct` for param validation | Hand validators (`common/validate.ts`) | M1 surface is 6 methods × ≤1 param. Swap to `superstruct` at M3 when signing params arrive. |
| Regtest blockchain in tests | None at M1 | We only test pure derivation + encoding. M3 will add Blockfrost-mock + Midnight indexer-mock. |
| Coverage thresholds 65–75% | Start at 60% all four metrics | We're new; ratchet upward as the suite matures. Never lower the bar. |

### Test pyramid (CMM-shaped)

```
                    ╱╲                  ← E2E (Playwright in companion-dapp)
                   ╱  ╲                    deferred to M2
                  ╱────╲
                 ╱      ╲              ← Integration: installSnap()
                ╱        ╲                onRpcRequest end-to-end
               ╱──────────╲               (Snap layer only)
              ╱            ╲
             ╱              ╲          ← Unit: pure functions, handlers
            ╱                ╲            (the bulk of the suite)
           ╱──────────────────╲
```

### File layout

```
packages/snap/
├── src/
│   ├── chains/cardano/
│   │   ├── address.ts
│   │   ├── address.test.ts        ← unit
│   │   ├── derive.ts
│   │   └── derive.test.ts         ← unit (mock snap.request)
│   ├── chains/midnight/
│   │   ├── address.ts
│   │   ├── address.test.ts
│   │   └── derive.test.ts
│   ├── common/
│   │   ├── errors.test.ts
│   │   └── validate.test.ts
│   └── index.ts
├── integration-test/
│   ├── constants.ts               ← shared test mnemonic, origin
│   ├── onRpcRequest.test.ts       ← end-to-end via installSnap()
│   └── jest.config.integration.cjs
├── jest.config.cjs                ← unit-test config
└── tsconfig.test.json             ← test-only ts settings
```

### Test naming

- **Unit**: `<module>.test.ts` next to `<module>.ts`. Each `describe` block
  is one exported function or class. `it('does X when Y', ...)` style.
- **Integration**: descriptive method-level files: `cardano.getAddress.test.ts`,
  `midnight.getAddress.test.ts`, etc.

---

## 3. The Test Mnemonic

We use BIP-39 test vector #1 from the spec — a 12-word mnemonic that
every BIP-39 implementation in the world uses for cross-validation:

```
abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about
```

- **Public** — appears in BIPs, hardware wallet test suites, Trezor docs.
- **Reproducible** — every key derived from this is deterministic and
  can be cross-validated against any other Cardano/Midnight implementation.
- **Never use in production code** — `installSnap()` only. No real funds.

We pin expected addresses derived from this mnemonic in
`integration-test/expected-vectors.ts`. Whenever derivation logic
changes, we re-derive and update the file in the same commit. **A
silent change to the expected vectors is a critical review red flag.**

> 📌 *Cardano-specific note:* Because M1 uses plain Ed25519 (not CIP-3
> BIP32-Ed25519), our expected addresses will NOT match Lace / Eternl
> output for the same mnemonic. M2 fixes this and the expected vectors
> swap. Documented in `chains/cardano/derive.ts`.

---

## 4. What We Test First (Priority Order)

| # | Module | Why first | Test type |
|---|---|---|---|
| 1 | `common/validate.ts` | Pure functions, hostile-input surface | unit |
| 2 | `common/errors.ts` | Error-code stability is a public contract | unit |
| 3 | `chains/cardano/address.ts` | Pure crypto, has CIP-19 test vectors | unit |
| 4 | `chains/midnight/address.ts` | Placeholder shape contract — UI relies on `_stub_` substring | unit |
| 5 | `chains/cardano/derive.ts` | Mock `snap.request`, verify path + curve passed correctly | unit |
| 6 | `chains/midnight/derive.ts` | Same | unit |
| 7 | `index.ts` end-to-end | All RPC methods through `installSnap()` | integration |

After M1 ships, M2/M3 add:

- Live Blockfrost adapter (recorded fixtures via `nock` or VCR)
- Cardano CIP-3 BIP32-Ed25519 derivation cross-validated against Lace
- Midnight viewing-key derivation cross-validated against `midnight-js`
- `signTx` + `submitTx` round-trips with regtest-style fixture chains
- Snap dialog interaction tests (auto-accept, auto-reject paths)

---

## 5. CI Integration (when it lands)

The Snap test command should be runnable **standalone** (no other
packages built first) for fast iteration:

```bash
pnpm -F @cmm/snap test          # unit only, fast
pnpm -F @cmm/snap test:integration   # full installSnap() suite
pnpm -F @cmm/snap test:coverage      # unit with thresholds enforced
```

The monorepo-level `pnpm test` (via Turborepo) runs both layers in
each package, with proper task dependency on `^build`.

---

## 6. What We Will NOT Do

- **No mocking of `@noble/hashes` or `bech32`** — those are tiny pure-JS
  libraries with their own audits. Mocking them hides the truth.
- **No snapshot tests** for addresses or hex strings. Use *known-answer
  tests* (KATs) with explicit expected values. Snapshots silently
  regenerate; KATs force a human to re-derive when something changes.
- **No tests against mainnet networks** — ever. Integration tests must
  pass with `network-access` denied at the runtime level. M2 Blockfrost
  tests use recorded fixtures, not live calls.
- **No private keys in test fixtures** — only public keys / addresses
  derived from the BIP-39 #1 test mnemonic. The mnemonic itself is the
  only secret, and it's a published one.

---

## 7. Open Questions (M2 work)

- Do we record real Blockfrost responses with `nock` or hand-craft
  minimal fixtures? *Decision deferred to BLOCKFROST_INTEGRATION.md M2 update.*
- How do we test Midnight ZK-proof generation without a live proof
  server? *Likely use `midnight-js`'s own mock proof provider once we
  understand its surface.*
- Do we adopt MetaMask's coverage thresholds verbatim or set lower
  initial bars? *Start at 60% all metrics, ratchet up.*

---

*See also: `SECURITY_CHECKLIST.md` (the threat model these tests guard
against), `REFERENCE_REPOS.md` (which repos to grep for test patterns),
`packages/snap/README.md` (per-method API surface).*

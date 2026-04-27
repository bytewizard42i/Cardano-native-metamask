# Research Log — Cardano-native MetaMask

> Append-only log of findings, open questions, and decisions.
> Update every session. Date each entry.

---

## 2026-04-23 — Kickoff

**Participants**: John, Cassie

**Goal**: Define the north star and map the territory.

### Decisions
- Private repo, Apache-2.0, under `bytewizard42i` org
- Two-phase strategy: MetaMask Snap first, upstream PR as stretch goal
- Midnight privacy tier planned — Snap-first still correct, sequencing
  revisited same day (see second entry below)

### Open Questions (resolved or updated later — see below)
- Which Cardano tx-building lib? CSL vs Lucid vs Mesh
- Key management inside Snap sandbox on mobile
- Hardware wallet pass-through through Snap
- CIP-30 surface injection mechanism
- Midnight ZK prover in Snap sandbox

### Prior Art to Deep-Dive
- Cosmos / Solflare / MultiversX Snaps
- Existing "MetaMask for Cardano" efforts

### Risks
- Approval timelines
- eUTxO vs account model
- Midnight SDK volatility
- UTxO coin-selection UX

---

## 2026-04-23 — Deep-dive research session

**Participants**: John, Cassie
**Output**: `DEEP_DIVE_METAMASK_INTEGRATION.md`, `ARCHITECTURE.md`,
`COMPETITIVE_ANALYSIS.md`, `INCENTIVE_STRATEGY.md`,
`MIDNIGHT_FIRST_STRATEGY.md`, `FUTURE_FUNCTIONALITY.md`

### Key findings

**Competitive landscape**:
- **NuFi shipped a Cardano MetaMask Snap in September 2024** via Project
  Catalyst Fund11. Closed-source core, NuFi-branded, no Midnight, no DID.
  We are **not first** to Cardano-in-MM — but we can win on open-source +
  Midnight + Foundation alignment.
- **No MetaMask Midnight integration exists anywhere**. Midnight's
  self-custody today = Lace (live) + VESPR (roadmap). MetaMask is greenfield.
- Aleo, MultiversX, NEAR, Starknet Snaps all offer instructive patterns.

**Financial model**:
- MetaMask earns **0.875%** on Swaps (~$325M cumulative, ~$38M annualized)
- Snaps are **free to publish**. No per-tx fee extracted by MM.
- The "pay MetaMask per transaction" framing was a misread on our part —
  the real lever is **Swap volume we originate for them**, not tribute.
- Willing ceiling if MM asks: 20–25% of our own Snap-layer fees, capped at
  half of MM's Swaps rate. Floor: $0 for plain allowlist (status quo).

**Allowlisting mechanics**:
- Submit form → 2 MM-team approvals → audit required for key-mgmt APIs
- Approved-auditor list published by MM; typical cost $30k–$80k
- Strict shasum versioning — every bump re-submits
- Realistic timeline to directory listing: **4–7 months**
- Total bootstrap cost floor: **~$40k** (audit-dominated)

**Technical requirements**:
- `snap_getBip44Entropy` with coinType 1815 for Cardano
- `snap_getBip32Entropy` for Midnight (curve + path TBD final)
- `endowment:keyring` with `allowedOrigins` for dApp surface
- CSL (WASM, ~800KB) canonical for Cardano tx-building; Lucid wraps it
- midnight.js 2.1+, wallet SDK 5.0+ for Midnight
- Proof-server: v1 remote + user-configurable, v2 local option

### Decisions

- **Midnight first, Cardano second (as extension of same Snap)**. See
  `MIDNIGHT_FIRST_STRATEGY.md` for the 7-reason case. TL;DR: no competition,
  narrative alignment with MM's own "Interoperability Snaps" thesis, smaller
  v1 audit surface, Midnight Fdn is an easier funder, and Cardano bolt-on is
  cheap once the Snap skeleton is audited + allowlisted.
- **One Snap, multi-chain**. Shared key-mgmt, shared audit surface, shared
  dApp SDK. Architected as chain-adapters from day one.
- **Stack**: TypeScript strict, pnpm + turbo monorepo, `@metamask/snaps-sdk`,
  CSL in Snap / Lucid in dApp SDK, Blockfrost default indexer (both chains),
  Next.js + Tailwind + shadcn/ui for companion dApp, Apache-2.0.
- **Repo name stays** (`Cardano-native-metamask`) — Midnight-first is
  internal sequencing; Cardano frame is John's strategic positioning.

### Strategy commitments

- Open source core from day one (differentiator vs NuFi)
- Pursue Foundation endorsement (CF for Cardano extension, Midnight Fdn for
  Midnight-first); avoid exclusivity
- Target Project Catalyst Fund14+ proposal covering both chains
- Pitch featured placement (not paid) once traction earned (~25k installs)
- Upstream PR conversation reserved for 2027+ if traction warrants

### Timeline adopted

- Weeks 0–4: architecture + SDK exploration
- Weeks 4–22: Midnight Snap MVP + audit
- Weeks 22–28: Midnight allowlist review → **M6 ship**
- Weeks 24–40 (overlapping): Cardano extension + audit + allowlist
- Week 40+: growth, Foundation co-marketing, Swap integration
- Year 2+: featured placement, upstream conversation

### Open questions (carried forward)

- [ ] Can the Midnight ZK prover run inside the Snap sandbox, or must we
      always offload to a proof server? (Benchmark needed.)
- [ ] What's the current state of MetaMask mobile Snap support for non-EVM?
- [ ] When does MetaMask ship the Snap → hardware wallet pass-through?
- [ ] Is there a CF DevRel contact we know we can approach directly?
- [ ] Who at Midnight Foundation handles ecosystem wallet grants?
- [ ] What's the licensing posture for upstreaming an Apache-2.0 Snap into
      MetaMask core (primarily MIT/LGPL)?
- [ ] Inspect the published NuFi Snap npm package to see how much of the
      implementation is actually closed vs obfuscated-but-inspectable.

### Next

- Benchmark Midnight proof-server compute in Snap sandbox (critical
  feasibility gate)
- Draft Midnight Foundation outreach email
- Draft CF DevRel outreach email (for later — Cardano phase)
- Start Project Catalyst Fund14 proposal outline
- Map current Midnight dApp connector API surface in detail

---

## 2026-04-24 — Brand, team, and M0 scaffold

**Participants**: John, Cassie

### Decisions
- **Brand: CMM** — pronounced "see-em-em". Works as "Cardano MetaMask"
  (external) and "Cardano + Midnight in MetaMask" (internal). See
  `docs/NAMING.md` for the full reasoning (CMM vs CMMN).
- **Collaborator added**: Riley Kilgore (`Riley-Kilgore`, IOG / Aiken) invited
  with `push` permission on `bytewizard42i/Cardano-native-metamask`.
- **Build approach**: one project, not a separate demoland. The companion
  dApp's mock adapter IS the demoland. See `docs/BUILD_STRATEGY.md`.

### Implemented (M0 scaffold)
- Monorepo: pnpm workspaces + Turborepo + strict TypeScript 5.6
- Prettier + base tsconfig + root `.gitignore` additions
- `packages/shared` — chain IDs, types, constants, coin-type registrations
- `packages/snap` — manifest (CSL-friendly permissions, coin 1815 + Midnight
  BIP32 path), `snap.config.ts`, entry + common/midnight/cardano handlers
  (all M0 stubs with milestone-tagged errors), SVG icon placeholder
- `packages/dapp-sdk` — `SnapAdapter` interface, `createSnapAdapter(mode)`
  factory, full `mock` adapter with Cardano + Midnight fixtures, `real`
  adapter calling `wallet_invokeSnap`
- `packages/companion-dapp` — Next.js 15 App Router, Tailwind + CMM color
  palette, hero, chain cards that consume the mock adapter and render
  deterministic balances, footer
- README rewritten with CMM brand, Riley, monorepo quickstart, links to
  all strategy docs

### Known non-issues
- IDE shows many "cannot find module" lints pre-install. These all resolve
  after `pnpm install` runs. They are not bugs; the TS server simply has no
  node_modules / workspace symlinks to follow yet.

### Next
- Run `pnpm install` locally to verify workspace links resolve
- Pick a Snap version of `@metamask/snaps-sdk` and `@metamask/snaps-cli`
  from the latest published (versions in package.json are best-guess 2026-Q1)
- First real code delivery: M2 — `midnight_getAddress` via
  `snap_getBip32Entropy` inside the Midnight handler

---

## 2026-04-24 — Stack pivot to Vite + first spin-up

**Participants**: John, Cassie

### Decision
**Swapped companion-dapp from Next.js 15 to Vite 6 + React 18 + Tailwind 3.**

### Reasoning
- Penny's `monolith-docs/DEEP_DIVE_Vite_Assessment_2026-04-23.md` shows 4 of 9
  DIDzMonolith frontends are already on Vite; standardizing on it is the
  dominant-path move.
- A MetaMask Snap companion dApp is 99% client-side by nature — `window.ethereum`
  doesn't exist on a server, so Next.js SSR is actively a problem, not a feature.
- HMR in Vite: ~50ms. Next.js: 500ms–2s. Matters a lot for UX-heavy M1–M3 work.
- Vite 8 (Rolldown, Rust) benchmarks: Linear cut builds 46s → 6s. We'll adopt v8
  when Penny's monolith-wide upgrade wave hits; sticking with stable v6 for now.
- Solflare's Snap companion uses Vite + React. Solid precedent.

### Concrete changes
- Removed: `next`, `next.config.js`, `next-env.d.ts`, `src/app/` (layout + page)
- Added: `vite`, `@vitejs/plugin-react`, `vite.config.ts`, `index.html`,
  `src/main.tsx`, `src/App.tsx`, `src/index.css`
- Kept: all `src/components/` unchanged (dropped one `'use client'` directive
  from `chain-card.tsx`)
- Workspace packages `@cmm/shared` and `@cmm/dapp-sdk` now point `main` at
  `src/index.ts` directly (Vite's bundler resolves TS at dev-time, no pre-build
  step needed to iterate on the dApp)
- `tsconfig.json`: standard Vite React template — `jsx: "react-jsx"`,
  `types: ["vite/client", "node"]`, no Next.js plugin

### Spin-up verification (this session)
- `pnpm install` — clean, 706 packages resolved, 6s
- `pnpm -F @cmm/companion-dapp dev` — **Vite v6.4.2 ready in 183 ms**
- Browser preview opened on http://localhost:3000 — mock Midnight + Cardano
  balance cards rendering deterministic fixtures. Demoland is live.

### Notes
- pnpm 9.15.9 installed globally via nvm's npm (no sudo needed)
- TypeScript toolchain warnings `Cannot find type 'node'/'vite/client'`
  resolve once `pnpm install` runs; all green now
- No regression risk — swap is additive (new files) and subtractive (Next.js
  files that had no users yet)

---

## 2026-04-24 — Blockfrost integration (live Cardano preprod balances)

**Participants**: John, Cassie

### Decision
Blockfrost becomes CMM's default indexer. Lives in the dApp layer, not the
Snap. See `docs/BLOCKFROST_INTEGRATION.md` for the full rationale.

### What shipped
- `@cmm/dapp-sdk/src/indexers/` — new module:
  - `IndexerAdapter` interface + `IndexerError`
  - `BlockfrostCardanoIndexer` — real preprod/mainnet/preview reads
  - `MidnightTestnetIndexer` — M1 stub returning `"encrypted"` sentinel
  - `MockIndexer` — deterministic fixtures
  - `createIndexer(chain, config)` factory with `'mock' | 'live' | 'auto'`
- New `live-readonly` SnapAdapter mode: real indexer reads, mock signing.
  Bridges the gap before M1 Snap lands — stronger demo than pure fixtures.
- `createSnapAdapter(mode, options)` now accepts `liveReadonly` config
- `@cmm/shared` extended: `CardanoNetwork`, `MidnightNetwork`, symbol/decimal
  constants, `Balance.network` field
- Companion-dApp wiring:
  - `src/lib/adapter.ts` — env-driven adapter resolver
  - `ModeSwitcher` top-of-page toggle (Mock · Live · Snap-pending)
  - `ChainCard` now: network badge, shielded-flag pill, encrypted
    placeholder, error banner
  - `.env.example` + `vite-env.d.ts` for typed env access

### Design choices worth remembering
- **Indexer stays out of the Snap** — API keys with deployer, audit surface
  minimized. `wallet_invokeSnap` handlers do NO network I/O in M1.
- **Midnight balance stays mock** until Snap provides viewing key (M2). The
  `"encrypted"` sentinel string is the contract between indexer and UI.
- **Graceful auto-fallback** — no Blockfrost project_id configured ⇒ the
  factory silently uses `MockIndexer`. Demoland never breaks.
- **`Balance.network` is optional** to preserve backward compatibility with
  existing fixtures.

### Verified in this session
- `pnpm -F @cmm/companion-dapp typecheck` — clean across all 4 packages
- Vite HMR hot-reloaded `chain-card.tsx` changes without dev-server restart
- Server still on port 3000 from earlier session; ~50ms HMR updates as advertised

### Deferred (intentional)
- Client-side caching (15s TTL around `getBalance`) — M1
- Midnight GraphQL viewing-key flow — M2
- Koios / Maestro fallback indexers — M6+
- `getUtxos`, `getTxHistory`, `submitTx` on the interface — M3

---

## 2026-04-24 — MetaMask reference repos forked + wired into monolith

**Participants**: John, Cassie

### Decision
Added **6 MetaMask repos** as forks (`bytewizard42i/*-metamask-johns-copy`)
mounted as **nested submodules** inside CMM at `references/metamask-*`.
Documented in `docs/REFERENCE_REPOS.md`. *(Originally placed at
DIDzMonolith root as `utils_metamask-*`, migrated into CMM on 2026-04-26
so references travel with the project.)*

### What's in, what's out
**In** (6):
- `references/metamask-snaps` — SDK monorepo
- `references/metamask-snap-bitcoin-wallet` — **primary EUTXO template**
- `references/metamask-snap-simple-keyring` — keyring pattern
- `references/metamask-template-snap-monorepo` — scaffold reference
- `references/metamask-snaps-registry` — allowlist (we'll PR at M6)
- `references/metamask-SIPs` — improvement proposals (potential future SIPs)

**Out** (2, intentionally):
- `snap-solana-wallet` — account model, structurally far from UTXO chains
- `metamask-extension` / `metamask-mobile` — too large, only relevant at
  M8+ upstream-PR time; browse on GitHub if needed

### Key insight (John's call-out)
The Bitcoin Snap is our strongest architectural reference: Cardano EUTXO is
a direct extension of Bitcoin UTXO; Midnight's shielded UTXO is Zcash-style
on the same base. When we begin the Cardano handler in M2, read
`references/metamask-snap-bitcoin-wallet` first — UTXO selection, BIP32
derivation, tx building, and dialog UX all transfer.

### Mobile note
MetaMask Snaps do NOT run on mobile as of this cutoff. Mobile Snap support
is on the roadmap but unshipped. Revisit quarterly. No repo cloned for this.

### Disk footprint
~83MB across all 6 submodules (largest: `snaps-registry` at 53MB, `snaps`
at 16MB). Acceptable.

### Monolith changes
- `.gitmodules` — 6 new entries
- `DIDzMonolith.code-workspace` — 6 new folder entries under "🦊 ref:"
  prefix for clear visual grouping next to the Cardano-native-metamask entry

---

## 2026-04-24 — M1 Snap guts + UX layer + repo polish

**Participants**: John, Cassie

**Milestone crossed**: **M0 → M1**. The Snap now produces real cryptographic output from HD entropy; the companion dApp now has an accessible tooltip layer citing authoritative docs.

### Decisions

**Fork-or-clone the MetaMask reference repos?** Forked 6, dropped 1.
- Forked (under `bytewizard42i/*-metamask-johns-copy`): `snaps`, `snap-bitcoin-wallet`, `snap-simple-keyring`, `template-snap-monorepo`, `snaps-registry`, `SIPs`.
- Dropped `snap-solana-wallet` — account model, wrong lineage for us. Cardano EUTxO and Midnight shielded UTxO both descend from Bitcoin UTxO, so the Bitcoin Snap is our strongest architectural cousin.
- Mounted all 6 as nested CMM submodules at `references/metamask-*`. ~83MB total disk. *(Migrated from DIDzMonolith root on 2026-04-26.)*

**Adopt the keyring-Snap pattern now?** Deferred to M3.
- BTC Snap uses `endowment:keyring` + `snap_manageAccounts` — accounts appear directly in MetaMask's account list UI. Powerful but significantly larger audit surface.
- For M1 we stayed with the simpler `endowment:rpc` pattern (dApp calls `wallet_invokeSnap`). Revisit when we have signing + account management to justify the complexity.

**Upgrade the Snap SDK?** Yes — major leap.
- `@metamask/snaps-sdk` 6.12 → 10.3 (4 major versions)
- `@metamask/snaps-cli` 6.5 → 8.3
- Added `@metamask/key-tree` ^10.1, `@metamask/utils` ^11.9, `@noble/hashes` ^1.5, `bech32` ^2.0
- `snap.config.ts` format changed in 8.x — removed invalid `bundler: 'webpack'` key.
- Manifest now requires `platformVersion: '10.3.0'`.
- Stripped `.js` import extensions from all TS source (webpack in SES can't resolve them).

**Cardano derivation — CIP-3 or plain Ed25519 for M1?** Plain Ed25519 via key-tree with documented caveat.
- `@metamask/key-tree`'s `ed25519` curve is RFC-8032, not Cardano's BIP32-Ed25519 (CIP-3). Addresses we generate are **shape-correct bech32** (`addr_test1...`) but **not interoperable** with Lace/Eternl keys.
- Good enough for M1 demo. M2 wires CIP-3 derivation for interop.
- Caveat documented in-code at `packages/snap/src/chains/cardano/derive.ts:19`.

**Midnight address encoding for M1?** Clearly-labeled placeholder.
- Real Midnight address format requires `midnight-js` viewing-key derivation (M2 scope).
- Rather than ship wrong-looking-but-plausible addresses, we emit `mn_test_02_stub_<fingerprint>` so the UI can detect and warn.
- `isMidnightPlaceholder(addr)` helper lets the dApp flag it.

**Input validation — superstruct or hand-rolled?** Hand-rolled for M1.
- BTC Snap uses `superstruct`. For our current param surface (2 optional fields across 6 methods) a 40-line hand validator (`packages/snap/src/common/validate.ts`) is clearer and keeps the Snap bundle small.
- Swap to superstruct when param surface grows past ~5 methods.

**Error-surface shape?** Structured `data.code` on every error.
- New `CmmSnapError` hierarchy: `UnknownMethodError`, `NotYetImplementedError`, `InvalidParamsError`, `DerivationError`.
- Dispatcher catches these and emits JSON-RPC errors with `data: { code, chain }` so dApps branch on stable codes, not parsed strings.

### What shipped today

**Snap (`packages/snap/`):**
- Modern SDK versions + `snap.manifest.json` with `platformVersion` and CIP-1852 Cardano paths.
- `src/common/errors.ts` — error hierarchy.
- `src/common/validate.ts` — param validators (security boundary).
- `src/common/handler.ts` — added `common_getCapabilities` (dApp feature probe).
- `src/chains/cardano/derive.ts` — CIP-1852 derivation via key-tree.
- `src/chains/cardano/address.ts` — blake2b-224 + bech32 per CIP-19.
- `src/chains/cardano/handler.ts` — `cardano_getPublicKey` + `cardano_getAddress` live.
- `src/chains/midnight/derive.ts` — `m/44'/1296'` derivation.
- `src/chains/midnight/address.ts` — placeholder encoding.
- `src/chains/midnight/handler.ts` — `midnight_getPublicKey` + `midnight_getAddress` live.
- `src/index.ts` — dispatcher + error unwrapping.

**dApp SDK (`packages/dapp-sdk/`):**
- `adapters/real.ts` — unwraps new M1 Snap response shapes.
- New exports: `invokeCardanoGetAddress`, `invokeMidnightGetAddress`, `invokeGetCapabilities`, `CmmSnapErrorShape`.

**Companion dApp (`packages/companion-dapp/`):**
- `src/lib/docs-links.ts` — single-source registry of 21 authoritative external URLs.
- `src/components/info-hint.tsx` — accessible ⓘ popover (hover peek, click pin, Escape close, aria-described, focusable).
- `ModeSwitcher` and `ChainCard` now carry InfoHint tooltips on every technical term.
- Snap mode is no longer disabled — enabled at M1.

**Docs:**
- Main `README.md` — hero image, badges, visual sections, M1 status panel, docs grouped by purpose, reference-repo table.
- `packages/snap/README.md` — full RPC method reference, error-code table, security boundary doc, Flask testing guide.
- `packages/dapp-sdk/README.md` — advanced exports, error handling pattern, all four modes.
- `packages/companion-dapp/README.md` — updated for M1 state + tooltip layer.

### Verification

- `pnpm typecheck` — 6/6 tasks green
- `pnpm -F @cmm/snap build` — 165 files, clean SES-compatible bundle, dist/bundle.js produced
- All commits pushed to `origin/main`; WIP safety branch `wip/m1-snap-guts-partial` preserved on origin for archive

### Open Questions

- **CIP-3 derivation in-Snap**: which library? Options: port aicone's `cardano-hd` subset, vendor a tiny CIP-3 helper, or wait for `@metamask/key-tree` to add CIP-3 support upstream (unlikely). M2 decision.
- **Midnight viewing-key derivation**: confirm with Midnight Foundation that our `m/44'/1296'` placeholder matches whatever they settle on for SLIP-44. Ask in Discord when we have a first-draft M2 PR.
- **Keyring Snap pattern adoption**: M3 or defer further? Need to weigh audit-surface cost vs. "accounts in MM UI" UX win. Revisit when we have signing prototype.
- **CIP-30 compatibility shim**: decide whether `window.cardano.metamask` gets injected by the Snap or by a separate npm package dApps install themselves. BTC Snap doesn't do this; they rely on `wallet_invokeSnap` directly. Cardano ecosystem may expect CIP-30 though. M4 decision.

### Next

- M1 wrap-up: test end-to-end in MetaMask Flask (John installs Flask, Cassie runs `pnpm -F @cmm/snap serve`, we verify real `addr_test1...` round-trip from dApp → MetaMask dialog → back).
- M2 kickoff: pick CIP-3 derivation approach, start on Midnight viewing-key integration.

---

## 2026-04-26 — Test infrastructure + threat model land

**Participants**: John, Penny

### Decision
Stand up the testing rails NOW, while the M1 surface is still small enough
to fully cover. Two new long-lived docs (`TESTING_STRATEGY.md`,
`SECURITY_CHECKLIST.md`) + a working jest scaffold under `@cmm/snap`.

### Approach (deep-dive on MetaMask's own test patterns)
Read every test file in `references/metamask-snap-bitcoin-wallet/` —
our closest EUTXO architectural cousin — and extracted the pattern:

- **Two layers**: `src/**/*.test.ts` (unit) + `integration-test/` (boots
  Snap via `installSnap()`).
- **Stack**: `jest@30` + `ts-jest@29` + `@metamask/snaps-jest@9` preset
  + `jest-mock-extended` for typed mocks.
- **Coverage thresholds enforced** in jest config (BTC: 75/65/62/74).
  CMM starts at 60 across the board, ratchet upward each milestone.
- **Co-located unit tests**, separate integration folder + config.
- **`resetMocks: true`** + `clearMocks: true` — never trust cross-test
  state.
- **Deterministic mnemonic** for integration tests: BIP-39 #1
  (`abandon × 11 about`), the most cross-validated phrase in crypto.

### What shipped today

**Docs:**
- `docs/TESTING_STRATEGY.md` — full pattern reference + CMM strategy.
- `docs/SECURITY_CHECKLIST.md` — living threat model. Sections A–G
  cover Snap-host / Cardano / Midnight / dApp-boundary / supply-chain /
  test-hygiene threats, each mapped to enforcement (🔒) or milestone TODO.

**Snap test scaffold:**
- `packages/snap/jest.config.cjs` — unit config with coverage thresholds.
- `packages/snap/integration-test/jest.config.integration.cjs` — uses
  `@metamask/snaps-jest` preset.
- `packages/snap/tsconfig.test.json` — test-only TS settings.
- New scripts: `test`, `test:watch`, `test:coverage`, `test:integration`.
- New devDeps: `jest@30`, `ts-jest@29`, `@metamask/snaps-jest@9`,
  `jest-mock-extended@4`, `@jest/globals@30`, `@types/jest@30`.

**Seed test files (all written, install-pending for first run):**
- `src/common/validate.test.ts` — hostile-input fuzz, error-code stability.
- `src/common/errors.test.ts` — public error-code contract regression guard.
- `src/chains/cardano/address.test.ts` — KAT (known-answer tests) for
  network bytes, header layout, bech32-1023-limit round-trip.
- `src/chains/midnight/address.test.ts` — placeholder `_stub_` substring
  contract that the UI relies on.
- `src/chains/cardano/derive.test.ts` — mocks `snap.request`, asserts
  correct path + curve sent to host. Five `it.todo` placeholders for the
  full SLIP10 fixture (lands when M2 mnemonic pipeline arrives).
- `integration-test/onRpcRequest.test.ts` — end-to-end via `installSnap()`
  for every M1 RPC method, including error-code paths.
- `integration-test/constants.ts` — `TEST_MNEMONIC`, `TEST_ORIGIN`,
  `RpcMethod` enum.
- `integration-test/expected-vectors.ts` — pinned KATs (currently `null`
  for Cardano values; populated once M2 derivation lands).

### Key design decisions

**Known-Answer Tests over snapshots.** All cryptographic outputs compare
against explicit expected values, never `toMatchSnapshot()`. Snapshots
silently regenerate; KATs force a human pause when something changes.

**Inline crypto libs are not mocked.** `@noble/hashes` and `bech32` are
small, audited pure-JS — mocking them would hide the truth.

**Hand validators stay (for now).** Re-evaluated `superstruct` vs the
current 40-line `validate.ts` — for M1's 2 fields × 6 methods surface,
the hand validator is clearer + smaller bundle. Swap at M3.

**Expected-vectors review rule.** Comment block in `expected-vectors.ts`
makes it a critical-review red flag if anyone changes a KAT silently.
Three questions any PR touching that file must answer.

### Open Questions

- Do we record real Blockfrost responses with `nock` or hand-craft
  minimal fixtures? *Decision deferred to BLOCKFROST_INTEGRATION.md M2 update.*
- How do we test Midnight ZK-proof generation without a live proof
  server? *Likely use midnight-js's mock proof provider once we
  understand its surface.*

### Next
- John runs `pnpm install` from CMM root to fetch the new test deps.
- First-run validation: `pnpm -F @cmm/snap test` should green for
  `validate.test.ts`, `errors.test.ts`, `*/address.test.ts`. Some
  `derive.test.ts` cases will hit the synthetic-fixture limitation —
  that's expected and tracked as `it.todo`.
- M2 kickoff plan: pick CIP-3 derivation approach, populate the
  Cardano expected vectors, retire the `it.todo` set.

---

## 2026-04-26 (later) — Tests green, CI scaffolded, two real bugs caught

**Participants**: John, Penny

### Headline
First full-suite green run: **149 tests passing across 4 packages**
(89 Snap unit + 11 Snap integration + 29 dapp-sdk + 20 shared). The
test infrastructure caught two real bugs the day it landed.

### Bugs caught by the new test suite (the whole point)

**Bug 1: Error data lost through JSON-RPC serialization.**
- *Symptom*: integration tests asserting `error.data.code === 'CMM_*'`
  saw `data: undefined`.
- *Root cause*: `index.ts` was wrapping our `CmmSnapError` into a plain
  `Error` with a `data` property. The Snap runtime serializes via
  `@metamask/rpc-errors` which only preserves `data` on errors built
  through its own constructors — plain `Error.data` is silently dropped.
- *Fix*: Use `@metamask/snaps-sdk`'s `MethodNotFoundError`,
  `InvalidParamsError`, `InternalError` wrappers. They serialize as
  proper JSON-RPC errors with our payload at `error.data.{code,chain}`
  flat (NOT nested under `data.cause` as the SnapError docs imply).
- *Pattern reference*: `references/metamask-snap-bitcoin-wallet/packages/
  snap/src/handlers/HandlerMiddleware.ts` does the same mapping.

**Bug 2: Wrong path-prefix for ed25519 derivation.**
- *Symptom*: every Cardano + Midnight derivation threw
  `"Invalid curve: Only secp256k1 is supported by BIP-32."`
- *Root cause*: `derive.ts` used `bip32:N'` path nodes for ed25519.
  In `@metamask/key-tree` v10, the `bip32:` prefix routes through a
  secp256k1-only deriver. Ed25519 needs `slip10:` (or `cip3:` for full
  Cardano BIP32-Ed25519). This was hidden because our unit tests
  mocked `snap.request` and didn't actually run derivation —
  integration tests caught it the moment they booted a real Snap.
- *Fix*: swapped all `bip32:N'` to `slip10:N'`. M2 will swap to `cip3:`
  for Lace/Eternl interoperability.
- *Bonus*: also forced every path component hardened (M1 plain
  Ed25519 SLIP-10 only allows hardened); M2 CIP-3 swap restores the
  standard mixed layout.

### CI scaffolded

- `.github/workflows/ci.yml` — 4 jobs: `static` (lint+typecheck),
  `unit`, `integration`, `manifest` (shasum drift detector).
- `.github/dependabot.yml` — weekly grouped npm bumps + monthly
  GitHub Actions bumps. SECURITY_CHECKLIST.md E1 enforcement.

### dApp SDK + shared got tests too

- `@cmm/dapp-sdk` adopted **vitest** (lighter than jest for an
  ESM-first lib package). 29 tests covering `mockAdapter`, `factory`
  (auto-mode adapter selection), `realAdapter` (window.ethereum
  mocking, error data shape).
- `@cmm/shared` got `chains.test.ts` — 20 tests on `isChainId` +
  network enum disjointness.

### Coverage outcome

After adding handler unit tests (cardano + midnight + common):

| Metric | Result | M1 bar |
|---|---|---|
| Lines      | 92.25% | 60% |
| Statements | 90.54% | 60% |
| Functions  | 90.00% | 60% |
| Branches   | 84.05% | 60% |

We're already above the M3-target thresholds (75/65/62/74) on
everything except branches. Will re-tighten in a follow-up.

### CONTRIBUTING.md landed

`CONTRIBUTING.md` at the repo root — onboards new contributors with
the test-first workflow, the security-checklist gate, and the
"sister convention" so AI pair-programmers across John's machines
get attribution.

### Open Questions

- Should we wire `@metamask/eslint-config-snaps` now? The lint command
  still echoes a stub. Probably worth a 30-min PR.
- Coverage delta on `derive.ts` files (~70%) is the synthetic-fixture
  limitation — `it.todo`'s waiting on the M2 mnemonic pipeline. Not a
  threshold blocker but worth noting.

### Next

- Open M2 ticket: CIP-3 derivation + Cardano expected-vectors KAT
  population + Midnight viewing-key prep.
- Optional: enable branch protection on `main` requiring CI green.

---

## Template for next entries

```
## YYYY-MM-DD — <topic>

**Participants**:

### Findings

### Decisions

### Open Questions

### Next
```

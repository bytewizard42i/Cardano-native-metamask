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
mounted as submodules into DIDzMonolith at `utils_metamask-*`. Documented
in `docs/REFERENCE_REPOS.md`.

### What's in, what's out
**In** (6):
- `utils_metamask-snaps` — SDK monorepo
- `utils_metamask-snap-bitcoin-wallet` — **primary EUTXO template**
- `utils_metamask-snap-simple-keyring` — keyring pattern
- `utils_metamask-template-snap-monorepo` — scaffold reference
- `utils_metamask-snaps-registry` — allowlist (we'll PR at M6)
- `utils_metamask-SIPs` — improvement proposals (potential future SIPs)

**Out** (2, intentionally):
- `snap-solana-wallet` — account model, structurally far from UTXO chains
- `metamask-extension` / `metamask-mobile` — too large, only relevant at
  M8+ upstream-PR time; browse on GitHub if needed

### Key insight (John's call-out)
The Bitcoin Snap is our strongest architectural reference: Cardano EUTXO is
a direct extension of Bitcoin UTXO; Midnight's shielded UTXO is Zcash-style
on the same base. When we begin the Cardano handler in M2, read
`utils_metamask-snap-bitcoin-wallet` first — UTXO selection, BIP32
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

## Template for next entries

```
## YYYY-MM-DD — <topic>

**Participants**:

### Findings

### Decisions

### Open Questions

### Next
```

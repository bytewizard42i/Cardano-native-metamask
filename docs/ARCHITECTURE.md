# Architecture — Cardano-native MetaMask Snap

> Target design for the Cardano + Midnight MetaMask Snap and its companion dApp.
> Phased — not all pieces land in v1.

---

## 1. High-level topology

```
┌──────────────────────────────────────────────────────────────────────┐
│                            USER'S BROWSER                            │
│                                                                      │
│  ┌────────────────────────┐      ┌──────────────────────────────┐    │
│  │   MetaMask Extension   │◄────►│  Companion dApp              │    │
│  │                        │ CIP- │  (cardano-metamask.io)       │    │
│  │  ┌──────────────────┐  │  30  │  - Snap install              │    │
│  │  │  Cardano-Midnight│  │      │  - Account / balance UX      │    │
│  │  │  Snap (sandbox)  │  │      │  - Staking UI                │    │
│  │  │                  │  │      │  - Shielded tx composer      │    │
│  │  │  ┌────────────┐  │  │      │  - DID / AgenticDID bridge   │    │
│  │  │  │ Key derive │  │  │      └──────────┬───────────────────┘    │
│  │  │  │ BIP44 1815 │  │  │                 │                        │
│  │  │  └────────────┘  │  │                 │                        │
│  │  │  ┌────────────┐  │  │                 │                        │
│  │  │  │ CSL WASM   │  │  │                 │                        │
│  │  │  │ (Cardano   │  │  │                 │                        │
│  │  │  │  tx build) │  │  │                 │                        │
│  │  │  └────────────┘  │  │                 │                        │
│  │  │  ┌────────────┐  │  │                 │                        │
│  │  │  │ midnight.js│  │  │                 │                        │
│  │  │  │ (Midnight  │  │  │                 │                        │
│  │  │  │  tx build) │  │  │                 │                        │
│  │  │  └────────────┘  │  │                 │                        │
│  │  │  ┌────────────┐  │  │                 │                        │
│  │  │  │ CIP-30 /   │  │  │                 │                        │
│  │  │  │ Midnight   │  │  │                 │                        │
│  │  │  │ connector  │  │  │                 │                        │
│  │  │  └────────────┘  │  │                 │                        │
│  │  └──────────────────┘  │                 │                        │
│  └───────────┬────────────┘                 │                        │
└──────────────┼──────────────────────────────┼────────────────────────┘
               │                              │
               │ HTTPS                        │ HTTPS / WSS
               ▼                              ▼
 ┌────────────────────────┐   ┌──────────────────────────────────┐
 │  Cardano indexer       │   │  Midnight proof server (local    │
 │  (Blockfrost default,  │   │  or remote) + Blockfrost         │
 │   Koios / Maestro /    │   │  Midnight Indexer (GraphQL/WS)   │
 │   user node optional)  │   │                                  │
 └────────────────────────┘   └──────────────────────────────────┘
               │                              │
               ▼                              ▼
        Cardano L1 mainnet / preprod   Midnight testnet02 / mainnet
                                       (settles on Cardano)
```

## 2. Monorepo layout (proposed)

```
Cardano-native-metamask/
├── packages/
│   ├── snap/                       # The Snap itself
│   │   ├── src/
│   │   │   ├── index.ts            # RPC entry, request routing
│   │   │   ├── keys/               # Key derivation (BIP44/32)
│   │   │   ├── cardano/            # CSL tx building, UTxO mgmt
│   │   │   ├── midnight/           # midnight.js integration
│   │   │   ├── cip30/              # CIP-30 surface
│   │   │   ├── midnight-connector/ # proposed window.midnight.metamask
│   │   │   └── ui/                 # snap_dialog components
│   │   ├── snap.manifest.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── dapp-sdk/                   # TypeScript SDK for dApp devs
│   │   ├── src/
│   │   │   ├── cardano.ts          # CIP-30-compatible wrapper
│   │   │   ├── midnight.ts         # Midnight connector API
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── companion-dapp/             # User-facing dApp
│   │   ├── app/                    # Next.js App Router
│   │   ├── components/
│   │   ├── lib/
│   │   └── package.json
│   │
│   └── shared/                     # Types, constants, utilities
│       ├── src/
│       └── package.json
│
├── audits/                         # Audit reports (PDFs)
├── docs/                           # (this directory)
├── scripts/                        # Release, build, manifest gen
├── .github/workflows/              # CI
├── package.json                    # pnpm workspaces root
├── turbo.json                      # Turborepo pipeline
├── pnpm-workspace.yaml
└── README.md
```

## 3. Technology choices

### 3.1 Core stack

| Concern | Choice | Rationale |
|---|---|---|
| Language | TypeScript 5.x, strict | Snap SDK is TS-first; audit-friendly |
| Package manager | pnpm + workspaces | Matches MetaMask monorepo conventions |
| Build orchestration | Turborepo | Fast iteration, cache-aware |
| Snap bundler | `@metamask/snaps-cli` | Official, only fully-supported path |
| Testing | Vitest + `@metamask/snaps-jest` | Unit + Snap-harness integration |
| Linting | ESLint + `@metamask/eslint-config-snaps` | MM-blessed rule sets |
| Type-checking | `tsc --noEmit` + `@types/metamask-onboarding` | |
| Fuzzing | fast-check on signing codepaths | Audit prep |

### 3.2 Cardano libraries

| Concern | Choice | Rationale |
|---|---|---|
| Tx building (in Snap) | `@emurgo/cardano-serialization-lib-nodejs` (or browser) | Canonical, WASM, ~800KB |
| Tx building (in dApp) | `Lucid` | Ergonomic; internally uses CSL |
| Address / key utilities | `@emurgo/cardano-serialization-lib-*` | Same package |
| Asset metadata | CIP-26 registry + CIP-68 on-chain | Standard paths |
| Stake pool list | Koios / Blockfrost | API lookups |
| Indexer default | Blockfrost | Broad coverage, proven |
| Indexer fallback | Koios (free), Maestro (paid) | User-configurable |
| HD derivation | CIP-1852 (Shelley era), SLIP-0044 coin 1815 | Standard |

### 3.3 Midnight libraries

| Concern | Choice | Rationale |
|---|---|---|
| SDK | `midnight-js` 2.1+ (matching testnet_02) | Only supported path |
| Wallet API | `@midnight-ntwrk/wallet-sdk` 5.0+ | Per support matrix |
| DApp connector | `@midnight-ntwrk/dapp-connector-api` 3.0+ | Mirrors CIP-30 pattern |
| Tx builder | Part of midnight.js | |
| Proof server | Remote (v1) / local (v2) | See §3.5 |
| Indexer | Blockfrost Midnight Indexer (GraphQL + WS) | Per our existing docs |

### 3.4 Companion dApp

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15 App Router | SSG + edge, SEO, ecosystem |
| Styling | TailwindCSS + shadcn/ui | Matches rest of DIDzMonolith |
| Icons | Lucide | Per John's convention |
| Hosting | Vercel | Zero-ops, fast |
| Analytics | Plausible (privacy-first) | Fits the narrative |
| Wallet connect bridge | Our own SDK package | |

### 3.5 Midnight proof-server decision tree

```
Does user prefer full privacy?
├─ YES → Run local proof-server (Docker) — slow to generate, zero viewing-key leak
└─ NO  → Use remote proof-server
          ├─ User's own self-hosted — acceptable
          └─ Public remote — warn: viewing key may be sent to indexer/prover
```

Default for v1: **remote** (easier onboarding), with a prominent "upgrade to local" prompt.

## 4. Snap API surface (sketch)

### 4.1 Cardano methods (CIP-30 compatible)

```typescript
// RPC methods exposed by snap
'cardano_getAddresses'         // returns bech32 addresses
'cardano_getBalance'           // ADA + native assets
'cardano_getUtxos'             // raw UTxO set (CBOR)
'cardano_signTx'               // sign a serialized tx
'cardano_signData'             // CIP-8 message signing
'cardano_submitTx'             // broadcast
'cardano_delegate'             // stake delegation
'cardano_withdrawRewards'      // claim rewards
```

### 4.2 Midnight methods (proposed)

```typescript
'midnight_getAddress'
'midnight_getBalance'          // NIGHT + DUST + shielded tokens
'midnight_signTx'
'midnight_generateProof'       // offloads to proof-server
'midnight_submitTx'
'midnight_exportViewingKey'    // explicit user consent required
'midnight_scanShielded'        // via indexer subscription
```

### 4.3 Shared

```typescript
'common_getConfig'             // current network, indexer URLs
'common_setConfig'             // update (with consent)
'common_getSupportedChains'    // ['cardano', 'midnight']
```

## 5. Security posture (audit-aligned)

- **Key material**: derived via `snap_getBip44Entropy` / `snap_getBip32Entropy` only. Never written to `snap_manageState`. Never exposed via RPC. Never logged.
- **Tx signing**: every signature requires a `snap_dialog` confirmation showing decoded tx contents (amounts, recipients, fees, script hashes).
- **RPC origin gating**: `endowment:rpc` with explicit `allowedOrigins`. Keyring API origin-locked to our companion dApp until broader adoption is earned.
- **Network calls**: user-configurable endpoints; default set pinned in manifest; TLS + certificate checks.
- **Dependency policy**: strict semver, renovate-bot managed, audit every dep change touching the signing path.
- **Repro builds**: Snap `shasum` must be reproducible from a tagged commit — critical for allowlist submissions.
- **Incident response**: documented disclosure policy, bug bounty via Immunefi when traction justifies.

## 6. Phased milestone ladder

| Milestone | What ships | Who uses it |
|---|---|---|
| **M0** | Repo skeleton, pnpm/turbo scaffold, empty Snap stub | Us only |
| **M1** | Key derivation (both chains), unit tests, CI green | Us + devs |
| **M2** | Cardano tx build + sign (testnet), CIP-30 minimal surface | Flask testers |
| **M3** | Midnight tx build + sign (testnet_02), proof-server integration | Flask testers |
| **M4** | Companion dApp MVP (install flow, balance, send) | Alpha users |
| **M5** | Audit-ready: fuzzing, coverage, docs, security policy | Auditor |
| **M6** | Audited + allowlisted on `snaps.metamask.io` | **Public** |
| **M7** | DEX/swap integration (Cardano), dApp marketing push | Growth phase |
| **M8** | AgenticDID integration, DID-anchored tx UX | Advanced |
| **M9** | Featured placement / upstream PR discussions with MM | Strategic |

## 7. Deferred / explicitly out of scope (v1)

- Cardano hardware wallet pass-through (waiting on MM Snap HW pipe)
- Native token launching / minting UX (belongs in dApp, not wallet)
- Smart-contract dev tools (not a wallet concern)
- In-wallet fiat on-ramp (partner integration, post-launch)
- Mobile parity (extension-first; mobile when MM mobile Snap story matures)
- Cross-chain bridging UI (surface partner integrations rather than building)

## 8. Decision log (to keep updated)

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-23 | **Midnight first, Cardano as extension** | No competition in Midnight; NuFi owns Cardano-in-MM today |
| 2026-04-23 | **Open source core, Apache-2.0** | Differentiates from NuFi; supports future upstream-PR path |
| 2026-04-23 | **One Snap, multiple chains** | Shared key-mgmt, smaller audit surface than two separate Snaps |
| 2026-04-23 | **Blockfrost default indexer** | Coverage + reliability; user-configurable for purists |

_(Append new rows as decisions get made.)_

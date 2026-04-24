# Deep Dive — MetaMask Integration for Cardano (and Midnight)

> **Date**: 2026-04-23
> **Authors**: Cassie + John Santi
> **Status**: Research complete (v1). Strategy recommendations at end.

---

## 0. Executive Summary

- **MetaMask already supports non-EVM chains** via its **Snaps** architecture (Solana, Bitcoin, Starknet, Cosmos, Sui, NEAR, MultiversX, and — crucially — **Cardano via NuFi since Sept 2024**).
- **We are not first** to Cardano. NuFi shipped a closed-source, branded Cardano Snap a year and a half ago. Our value has to come from: (1) being *open source reference implementation*, (2) being the *community / Cardano Foundation-aligned* Snap, (3) bringing **Midnight privacy** (no one has done this), and/or (4) pushing for *truly native upstream* support beyond the Snap sandbox.
- **MetaMask does not charge Snap developers** to publish. There is no per-transaction fee model between a Snap and MetaMask. MetaMask's revenue is primarily its 0.875% **Swap** fee (~$325M cumulative, ~$38M annualized as of 2025). The "how do we pay MetaMask" framing is slightly miscast — the real incentive lever is **Swap volume routed through MetaMask**.
- **Midnight has no MetaMask Snap** today. Midnight's official self-custody path is **Lace** (live) with **VESPR** planned. A MetaMask-native Midnight integration would be a first.
- **Recommended play**: **Midnight first** (novel, privacy narrative aligns with MetaMask's own Snaps messaging, no competitor), then **Cardano second** (as a compatible extension of the same Snap, differentiated from NuFi by being open source + Midnight-capable + CF-endorsed if possible).

---

## 1. MetaMask's Extension Architecture (the lay of the land)

### 1.1 Three integration tiers

| Tier | Who can build it | Approval surface | Examples |
|---|---|---|---|
| **A. Native (upstream core)** | ConsenSys / MetaMask team | MM team only | ETH L1, EVM L2s (Optimism, Base, Arbitrum, Polygon PoS), Linea |
| **B. Native (upstream, MM-blessed non-EVM)** | MetaMask team, usually w/ a dedicated partner | MM team | **Solana** (native UI as of 2025), **Bitcoin** (native) |
| **C. Snap (sandboxed extension)** | Anyone, allowlist-reviewed | Snaps team (2 approvers + audit for key-management) | **Cardano (NuFi)**, Cosmos, Sui, Starknet, NEAR, MultiversX, Aleo, Filecoin, Ethereum gas-fee Snaps, Dogecoin, etc. |

### 1.2 The Snap architecture in one picture

```
 ┌───────────────────────────────────────────────────────────┐
 │                     MetaMask Extension                    │
 │                                                           │
 │  ┌─────────┐   ┌──────────────┐   ┌─────────────────────┐ │
 │  │  EVM    │   │  Solana /    │   │  Snap Host          │ │
 │  │  Core   │   │  Bitcoin     │   │   ┌───────────────┐ │ │
 │  │         │   │  (native)    │   │   │  Cardano Snap │ │ │
 │  │         │   │              │   │   │  (sandboxed)  │ │ │
 │  └─────────┘   └──────────────┘   │   └───────────────┘ │ │
 │                                   │   ┌───────────────┐ │ │
 │                                   │   │ Midnight Snap │ │ │
 │                                   │   └───────────────┘ │ │
 │                                   └─────────────────────┘ │
 │                                                           │
 │     Keyring API   ◄──── snap_getBip44Entropy              │
 │                   ◄──── snap_getBip32Entropy              │
 │                   ◄──── endowment:keyring                 │
 │                                                           │
 └───────────────────────────────────────────────────────────┘
           ▲                                   ▲
           │ dApp via window.ethereum          │ dApp via window.cardano /
           │                                   │ explicit Snap invocation
```

### 1.3 How Snaps derive Cardano (or Midnight) keys

MetaMask's Snaps API lets a Snap derive **any chain's** keys from the user's existing MetaMask secret recovery phrase, without ever exposing the seed:

- `snap_getBip44Entropy` with `coinType: 1815` → Cardano (CIP-1852 / SLIP-0044 registered)
- `snap_getBip32Entropy` for arbitrary paths (Midnight Ed25519-on-JubJub, or whatever final scheme is)
- Keys are **derived in the Snap sandbox**, used for signing, and never exported

Result: the user's MetaMask seed becomes a **multi-chain** seed. No separate wallet. No bridge. Same recovery phrase → Ethereum + Cardano + Midnight.

### 1.4 Permissions we'll need

```json
{
  "initialPermissions": {
    "endowment:network-access": {},      // call Blockfrost / indexer
    "endowment:rpc": { "dapps": true },   // expose CIP-30 surface to dApps
    "endowment:keyring": {
      "allowedOrigins": ["https://cardano-metamask.io", ...]
    },
    "snap_getBip44Entropy": [
      { "coinType": 1815 }                // Cardano
    ],
    "snap_getBip32Entropy": [
      { "path": ["m", "44'", "2147483647'"], "curve": "ed25519" }  // Midnight (tbd)
    ],
    "snap_manageState": {},                // persisted Snap storage
    "snap_dialog": {},                     // approval prompts
    "snap_notify": {}                      // tx confirmations
  }
}
```

### 1.5 Snap security rules (hard requirements)

From `docs.metamask.io/snaps/features/non-evm-networks` — **must-follow**:

- **Must**: derive keys only inside Snap execution environment
- **Must**: get user consent before any irreversible operation
- **Must not**: export private keys via RPC / network
- **Must not**: execute untrusted code with key access
- **Must not**: expose key material in clear text

Any Snap using key-management API **requires a professional audit** before allowlisting. MetaMask maintains a list of approved auditors. Budget: typically **$30k–$80k** for a Snap of moderate scope.

---

## 2. The Allowlisting / Distribution Pipeline

### 2.1 Three distribution modes (in order of friction)

1. **Unlisted / dev-only** — MetaMask Flask (developer flavor) can install any Snap from npm. Fine for dev, useless for users.
2. **Allowlisted (directory)** — submit form, 2 MM-team approvals, audit if key-management. Once approved, **anyone** can install from `snaps.metamask.io` on regular MetaMask.
3. **Featured / native** — upstream into MetaMask core itself. Only done by MM team (Solana, Bitcoin examples).

### 2.2 Allowlisting steps (official, from MetaMask docs)

1. Submit the [MetaMask Snaps Directory Information form](https://go.metamask.io/snaps-directory-request) with:
   - `proposedName` (cannot contain "MetaMask", "Snap", "Meta", or "Mask")
   - Brand, website, GitHub repo, **public** npm package URL
   - Version number (must match `package.json` + `snap.manifest.json` + correct `shasum`)
   - **Audit report PDF/URL** (if using key-management APIs — required for us)
   - Customer support escalation contact + at least one public support channel
   - Screenshots, promotional images, demo video
2. Review: **2 approvals minimum** from the MetaMask Snaps team
3. Directory listing on `snaps.metamask.io`
4. Distribute via companion dApp
5. Every version bump requires re-submission (strict versioning)

### 2.3 Realistic timeline

| Phase | Duration |
|---|---|
| Build working Snap (MVP: derive key, sign tx, CIP-30 surface) | 6–10 weeks |
| Testnet deployment + dApp compatibility testing | 2–4 weeks |
| Professional audit (approved auditor) | 4–6 weeks |
| Audit remediation | 2–3 weeks |
| Allowlist submission + review | 2–6 weeks (manual, variable) |
| **Total to directory listing** | **16–29 weeks (~4–7 months)** |

### 2.4 Costs (rough estimate, 2026 dollars)

| Item | Low | High |
|---|---|---|
| Audit (approved auditor, single chain scope) | $30k | $80k |
| Hosting + infra (Blockfrost / indexer / proof-server) 1 year | $2k | $12k |
| Legal review (allowlisted privacy disclosures) | $3k | $15k |
| Design / UX (companion dApp, icons, demo video) | $5k | $20k |
| Dev time (if hiring) | $0 (us) | $150k |
| **Total (bootstrap)** | **~$40k** | **~$280k** |

The floor assumes we do the coding ourselves. Audit is the hard cash floor.

---

## 3. MetaMask's Business Model — What Actually Pays Bills

### 3.1 Revenue reality (public data)

- **MetaMask Swaps** = **0.875%** fee on every swap routed through the aggregator
- **Cumulative swap fees**: ~$325M (as of early 2026)
- **Annualized revenue**: ~$37.8M (DefiLlama, early 2026)
- **Historical peak**: ~$100k–$200k/day from Swaps (2021 bull market)
- **Other recent streams**: In-app perps (Hyperliquid integration, Oct 2025), MetaMask Card (interchange), Portfolio/staking fees
- **Infura** is a separate ConsenSys P&L, but tightly coupled — most MM users default to Infura RPC

### 3.2 The Snaps-to-revenue gap

**Snaps themselves are free to install and generate zero direct revenue for MetaMask.** There is no revenue share, no per-install fee, no listing fee, no per-transaction cut extracted by MetaMask from Snap transactions.

This is critical to our "how do we pay MetaMask" framing: **the question is not "what do we pay them" — it's "what volume do we bring them."**

### 3.3 Revenue levers a Cardano Snap can actually move

| Lever | Mechanism | Realistic uplift |
|---|---|---|
| **Swap volume (EVM → ADA)** | Route ADA on-ramp via MM Swaps into bridged ADA (e.g. Wanchain, Multichain successor, or future native bridge) | **Very material** — every new MM user buying ADA = 0.875% |
| **Swap volume (ADA → EVM)** | Same in reverse | Material |
| **On-chain Cardano swaps** | MM Swaps does not today route on-chain Cardano DEXes (Minswap, Sundae). Adding this = new TAM for MM | Potentially very material |
| **Cardano-native Swap fee** | MM takes 0.875% on intra-Cardano DEX swaps routed through the Snap's swap UI | Material |
| **Perps/Derivs** | Bring Cardano-backed perps via existing Hyperliquid integration or Cardano-native venues | Speculative |
| **Stake delegation fees** | MM could take a cut of delegation rewards (like Lido fees on ETH staking) | Modest, steady |
| **Fiat on-ramp partners** (MoonPay, Transak) for ADA | Already exists; widen the funnel | Modest |

### 3.4 What's a "fair" amount per transaction?

If we frame it as **ADA→ADA swaps inside the Snap** (the cleanest monetization path):

- MM Swaps base rate: **0.875%**
- Cardano DEX native fee: usually **0.3–0.5%** (Minswap, Sundae)
- Reasonable combined: **0.3% DEX + 0.5% MM = 0.8%** total user cost — competitive with MM's current EVM rate
- **Our ask**: MM takes the same 0.875% they take on EVM — we don't need them to take less, we need them to let us plumb it. Cardano DEX provides the route, MM Swaps UI + fee captures the revenue, Snap provides the signing + CIP-30 surface.

If framed as **on-ramp (fiat → ADA via MoonPay/Transak)**:

- MM already partners and takes ~0.5–1% — extend to Cardano routes via the Snap

**Bottom line**: we are not "paying MetaMask per transaction" — we are offering them **a new revenue surface at their existing rate**. That's a much easier pitch than carving out a Cardano-specific fee share.

---

## 4. Competitive Landscape (who's already done what)

### 4.1 Cardano in MetaMask — NuFi (live)

- **Live since September 2024** on `snaps.metamask.io`
- Built by **Vacuumlabs / NuFi** (well-regarded Cardano wallet team)
- Scope: CIP-30 compatible, Cardano addresses, ADA + native tokens, tx signing, delegation
- Funding path: **Project Catalyst Fund11**
- Demo repo: `nufi-official/metamask-snap-demo` (public)
- **Weaknesses**:
  - Branded NuFi (not a neutral "Cardano" Snap, has NuFi UX baked in)
  - Closed-source core Snap (demo is open, Snap source is not publicly canonical)
  - No Midnight integration, no path announced
  - Not formally Cardano Foundation endorsed
  - No deep dApp-side marketing push — most Cardano dApps still primarily integrate with Lace, Eternl, Yoroi, Vespr

### 4.2 Solana — Solflare Snap (live)

- `@solflare-wallet/solana-snap` — open source, published on npm
- In the MM directory
- Precedent for: how a chain-specific wallet brand can extend itself into MM while keeping its own standalone wallet

### 4.3 Cosmos, Sui, Starknet, Bitcoin, etc.

- Each has 1–3 Snaps, usually from an ecosystem incumbent (Leap for Cosmos, Phantom for Solana pre-native, Argent/Braavos for Starknet)
- Pattern: **incumbent chain wallet → extends via Snap**, not a brand new team

### 4.4 Midnight — no MetaMask integration exists

- Midnight's current self-custody path is **Lace** (integrated per `lace.io/midnight`, 2024)
- **VESPR wallet** announced as next integration (per Midnight blog)
- **No MetaMask Snap** for Midnight anywhere
- **No announced plans** for one
- This is a **clear greenfield opportunity** — see §7.

### 4.5 Our positioning given this landscape

| Axis | NuFi Snap | Our Snap |
|---|---|---|
| Open source | Partially | **Fully** |
| Cardano Foundation aligned | No | **Target: yes** |
| Midnight integration | No | **Yes (differentiator)** |
| DID / identity integration (AgenticDID) | No | **Yes** |
| Multi-chain (ADA + NIGHT + shielded) | No | **Yes** |
| dApp ecosystem neutral | Less | **More** |
| Upstream-PR path to MM core | Not pursuing | **Long-term goal** |

---

## 5. Technical Requirements & Hurdles

### 5.1 Cardano-specific technical hurdles

1. **eUTxO mental model vs MetaMask's account model**
   - MM users expect "balance" and "send to address"; eUTxO has per-UTxO selection
   - Solution: abstract at Snap layer — user sees "balance", Snap internally does coin selection
2. **Tx building library weight**
   - `cardano-serialization-lib` (CSL, WASM, ~800KB) is the canonical but heavy
   - `Lucid` is lighter TypeScript but wraps CSL anyway
   - **Recommendation**: CSL in the Snap sandbox; Lucid-style ergonomics in the companion dApp SDK
3. **Hardware wallet integration**
   - Ledger + Trezor already have Cardano apps, but MM Snap API doesn't yet fully pipe HW device access to Snap sandbox
   - v1: software-only (seed-derived); v2: HW path when MM ships it
4. **CIP-30 compatibility**
   - The de-facto Cardano dApp connector standard
   - Must inject `window.cardano.{metamask|ourbrand}` matching CIP-30 interface
   - Snap can do this via `endowment:rpc` + content script on companion dApp
5. **Blockfrost / indexer dependency**
   - Snap needs UTxO set, tx submission, script execution context
   - Options: Blockfrost, Koios, Maestro, user's own node
   - v1: Blockfrost default, user-configurable
6. **Staking and rewards UX**
   - Cardano stake pool selection, delegation, rewards withdrawal — all needs UI
   - MM's internal UI is limited; most rich UX must live on companion dApp
7. **Native assets (policy-id / asset-name)**
   - Different data model than ERC-20 — Snap must resolve metadata (CIP-26, CIP-68)

### 5.2 Midnight-specific technical hurdles

1. **ZK proof generation in a browser sandbox**
   - Proofs can take 1–60 seconds (per our research on Minokawa/Compact)
   - Snaps execute in a restrictive sandbox — heavy compute may be blocked or require offload
   - **Solution options**: (a) local proof server (like Lace Midnight option 1), (b) remote proof server with viewing-key trust tradeoff, (c) WASM-compiled prover if it fits in Snap constraints
2. **Viewing keys**
   - Shielded tx scanning requires sending viewing key to an indexer (Blockfrost Midnight Indexer supports this — see our `DEEP_DIVE_Blockfrost_Midnight_Indexer_API_2026-04-21.md`)
   - Must surface privacy implications to user clearly
3. **Cardano settlement layer coupling**
   - Midnight settles on Cardano — need both chains' plumbing active
   - Architectural reason to **build both in one Snap**
4. **NIGHT / DUST token model**
   - NIGHT is unshielded, DUST is transaction-fee-style — novel UX
5. **Version churn**
   - Minokawa / Compact is moving fast (v0.18.0 language / v0.26.0 compiler at time of writing)
   - Snap must track SDK versions — risk of frequent re-audits

### 5.3 Snap architecture hurdles (common)

- **Sandbox constraints**: 60s timeout on most RPC handlers, limited IO
- **Audit requirement per version bump**: changes to key-management code path may trigger re-audit
- **Strict manifest shasum**: every byte change in Snap source = new submission
- **Mobile vs extension parity**: MM mobile adopts Snaps slower than extension; we may be desktop-first for v1
- **No revenue plumbing from MM**: we capture value via our own monetization (token, freemium dApp features, B2B) or not at all

---

## 6. Incentive Strategy — Getting MetaMask to Say Yes

### 6.1 The two "yes"es we need

1. **Allowlist yes** — MM Snaps team approves our submission (required for shipping)
2. **Upstream/featured yes** — MM marketing features us in-app, or (stretch) upstreams into core (like Solana got)

Allowlist #1 is a function of quality, audit, and permission hygiene. Upstream #2 is a function of **strategic alignment and volume**.

### 6.2 Levers to pull for upstream adoption

| Lever | Why MM cares |
|---|---|
| **TAM expansion** — millions of Cardano holders who currently *can't* use MM | Direct user growth |
| **Swap volume** — ADA on-/off-ramps via MM Swaps at 0.875% | Direct revenue |
| **Privacy narrative** — Midnight ZK is aligned with MM's Snaps "interoperability" messaging | PR, differentiation from Phantom/Rabby |
| **Regulatory posture** — Midnight selective disclosure is a legible answer to EU MiCA / US stablecoin bill privacy questions MM is wrestling with | Reg moat |
| **Enterprise** — AgenticDID + Cardano RWA tooling = enterprise wedge MM lacks | B2B channel |
| **Ecosystem partnerships** — IOG, Cardano Foundation, Emurgo, Midnight Foundation joint marketing | Trust/legitimacy |
| **Open source + neutrality** — we ship what NuFi wouldn't: a non-branded reference impl | Fills a real gap |

### 6.3 The pitch narrative

> *"MetaMask Snaps opened the door to non-EVM chains. One year in, Cardano is served by a single closed-source wallet integration, and Midnight — the privacy-first L1 that's the cleanest fit for MetaMask's own 'interoperability' narrative — is served by none. We're proposing an open source, Cardano Foundation-aligned, Midnight-capable Snap that gives MetaMask's 30M users first-class access to both chains, plus a verifiable path to ZK privacy inside the wallet they already trust. We're not asking MetaMask for anything except review and, eventually, a featured placement. We'll bring the audit, the maintenance, and the ecosystem partnerships."*

### 6.4 Who to approach (in order)

1. **MetaMask Snaps team** — standard allowlist + Snaps ecosystem outreach (`snaps@consensys.net`, Discord `#snaps-dev`)
2. **Cardano Foundation / IOG DevRel** — for endorsement + co-marketing
3. **Midnight Foundation** — for SDK alignment, co-announcement, potentially grant funding
4. **Project Catalyst** — funding proposal (NuFi used Fund11; we can target Fund14+)
5. **MetaMask product leads** — pitch upstream/featured placement *after* Snap is live with traction

### 6.5 Pay-to-play scenarios (if it ever comes up)

MetaMask has historically **not charged for listings**. If they ever did, reasonable ranges based on comparable platform economics:

- **Featured directory placement**: $0–$25k/year equivalent sponsorship
- **Native upstream**: we don't pay — they pay or we grant-fund it
- **Per-tx revenue share**: if pushed, 10–20% of our own Snap fees to MM *maybe*, but only if it unlocks featured placement. Don't lead with this.

---

## 7. Should We Do Midnight First?

### 7.1 Short answer

**Yes.** Here's why.

### 7.2 Midnight-first — the case

| Reason | Explanation |
|---|---|
| **No competition** | Zero MetaMask-Midnight integrations exist. We are literally first if we ship. |
| **Narrative fit** | MM's whole Snaps messaging is "privacy + interoperability"; Midnight *is* that thesis in chain form |
| **Lower audit surface** | Smaller feature set for MVP (account, sign, shielded send) vs full Cardano DEX/staking stack |
| **Smaller competitor risk** | NuFi owns Cardano-in-MM mindshare; we'd be chasing. In Midnight we'd *define* it. |
| **Foundation funding** | Midnight Foundation is actively funding ecosystem wallets (VESPR, Lace integration grants) — we're a clean grant target |
| **Future-proof** | Cardano is mature; Midnight is still finding its shape. Early positioning = deeper influence on standards (CIP-30 equivalent for Midnight) |
| **Easier Cardano bolt-on later** | Once Midnight Snap ships, adding Cardano to same Snap ≈ reusing key-mgmt, adding tx-building + CIP-30. Reverse is not as elegant. |

### 7.3 Cardano-first — the case (for completeness)

| Reason | Explanation |
|---|---|
| **Larger existing user base** | Cardano has ~4M active addresses vs Midnight's sub-50k |
| **Mature tooling** | CSL, Lucid, Mesh SDK all production-grade; Midnight SDK still moving |
| **Easier audit** | Cardano cryptography is battle-tested; Midnight ZK stack has moving parts |
| **More immediate revenue** | ADA swap volume >>> NIGHT swap volume today |

### 7.4 Recommended phasing

**Phase 0 (now → 4 weeks)**: Architecture + SDK exploration for *both* chains. Common Snap skeleton with pluggable chain adapters.

**Phase 1 (weeks 4–16)**: **Ship Midnight Snap MVP**. Derive Midnight keys, sign a shielded tx, integrate with Midnight proof-server (local or remote). Audit. Allowlist. *First MetaMask-Midnight integration in history.*

**Phase 2 (weeks 12–28, overlapping)**: **Extend the same Snap to Cardano.** CIP-30 surface, ADA + native assets, staking. Differentiate from NuFi on open source + Midnight-integrated + CF-aligned. Re-audit delta. Re-allowlist.

**Phase 3 (weeks 24+)**: Unified Cardano+Midnight UX. Cross-chain settlement awareness. DID integration (AgenticDID). Swap routing through MM Swaps. Outreach for upstream/featured placement.

**Phase 4 (quarter 4+)**: Upstream PR discussion with MetaMask core (only if traction justifies). Revenue-share conversations (only if needed for featured placement).

---

## 8. Recommended Stack

See `ARCHITECTURE.md` for the full design. In brief:

- **Snap runtime**: TypeScript, `@metamask/snaps-sdk`, built with `@metamask/snaps-cli`
- **Key derivation**: `@metamask/key-tree`, BIP-44 for Cardano (1815), BIP-32 custom for Midnight
- **Cardano tx-building**: `cardano-serialization-lib` (WASM) inside Snap; **Lucid** in companion dApp SDK
- **Cardano indexer**: **Blockfrost** default, Koios fallback, user-configurable
- **Midnight tx-building**: `midnight.js` v2.1+, `@midnight-ntwrk/*` SDK packages, compact-runtime 0.9+
- **Midnight proof**: v1 remote proof server (user-configurable), v2 local proof server option
- **Midnight indexer**: Blockfrost Midnight Indexer API (see our existing docs)
- **dApp SDK**: Lightweight TS wrapper exposing CIP-30 for Cardano + a proposed `window.midnight.metamask` API
- **Companion dApp**: Next.js (or SvelteKit), Tailwind, deployed on Vercel
- **Build/CI**: pnpm, turbo, GitHub Actions, semantic-release
- **Audit-ready tooling**: strict TypeScript, zero `any`, 100% branch coverage on signing paths, fuzzing via `fast-check`

---

## 9. Open Questions / To-Research

- [ ] Can the Midnight ZK prover run inside Snap sandbox constraints? (Benchmark needed)
- [ ] Does Snap sandbox allow WebWorker-style threads for CSL parallel tx-building?
- [ ] MetaMask mobile — Snap parity for Cardano/Midnight? What's the timeline?
- [ ] Hardware wallet (Ledger Cardano app) pipe through Snap — is MM's path public yet?
- [ ] Cardano Foundation stance on a new Cardano Snap given NuFi exists — formal endorsement possible?
- [ ] Midnight Foundation grants — eligibility and process
- [ ] What is the current state of MM's "chain-agnostic" Keyring API for non-BIP44 schemes?
- [ ] Legal — Apache-2.0 compatibility if upstreamed to MetaMask (MM core is primarily MIT/LGPL blended; check case-by-case)

---

## 10. References

- MetaMask Snaps documentation: https://docs.metamask.io/snaps/
- Non-EVM networks guide: https://docs.metamask.io/snaps/features/non-evm-networks/
- Snap permissions: https://docs.metamask.io/snaps/reference/permissions/
- Get allowlisted: https://docs.metamask.io/snaps/how-to/get-allowlisted/
- Snaps directory: https://snaps.metamask.io
- NuFi Cardano Snap intro: https://support.nu.fi/support/solutions/articles/80001145639
- NuFi demo repo: https://github.com/nufi-official/metamask-snap-demo
- Solflare Solana Snap: https://github.com/solflare-wallet/solflare-snap
- MetaMask Swaps case study: https://consensys.io/blockchain-use-cases/finance/metamask-swaps
- DefiLlama MetaMask protocol page: https://defillama.com/protocol/metamask
- MetaMask Interoperability Snaps announcement: https://metamask.io/news/breaking-the-evm-barrier-with-interoperability-snaps
- Midnight × Lace: https://www.lace.io/midnight
- Midnight self-custody integrations blog: https://midnight.network/blog/looking-ahead-to-midnight-self-custody-wallet-integrations

---

*Living document. Update every research session. Cassie + John, Apr 2026.*

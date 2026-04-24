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

## Template for next entries

```
## YYYY-MM-DD — <topic>

**Participants**:

### Findings

### Decisions

### Open Questions

### Next
```

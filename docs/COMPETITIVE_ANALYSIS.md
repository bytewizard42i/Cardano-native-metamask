# Competitive Analysis — Who's Already Trying to Put Cardano (and Midnight) in MetaMask

> Updated: 2026-04-23

---

## TL;DR

- **Cardano in MetaMask**: One incumbent — **NuFi** (via Project Catalyst Fund11, shipped Sept 2024). Closed-source core, NuFi-branded, no Midnight.
- **Midnight in MetaMask**: **No one**. Zero Snaps, zero announced plans. Green field.
- **Our differentiation**: open source + Midnight-integrated + Cardano Foundation aligned + AgenticDID-ready.

---

## 1. NuFi — Cardano MetaMask Snap (incumbent)

### 1.1 What they shipped
- **Snap name**: MetaMask Snap Cardano Wallet (by NuFi / Vacuumlabs)
- **Release**: September 2024
- **Directory URL**: https://snaps.metamask.io (search "cardano" — listed via NuFi)
- **Funding**: Project Catalyst Fund11 proposal, approved and delivered
- **Demo repo**: https://github.com/nufi-official/metamask-snap-demo (demo app only — Snap source visibility limited)
- **Parent company**: Vacuumlabs (established Cardano wallet builder; also runs the NuFi standalone wallet)

### 1.2 Feature scope (as documented)
- Cardano address derivation from MM seed
- ADA + native token balance display
- Transaction signing (CIP-30 compatible)
- dApp connection flow
- Preprod + mainnet support
- Basic staking/delegation (per NuFi support docs)

### 1.3 Strengths
- **First-mover** in the MM directory for Cardano
- Backed by Vacuumlabs — real Cardano expertise, not a weekend project
- Already allowlisted (passed audit + 2 approvals)
- Integrated into NuFi's broader ecosystem

### 1.4 Weaknesses / gaps we can exploit
- **NuFi-branded UX** — not a neutral Cardano Snap; user assumptions bias toward NuFi's other products
- **Closed-source core** — the actual Snap implementation is not the public demo; community can't inspect, fork, or easily contribute
- **No Midnight** — no announced path, no Midnight integration work visible
- **No DID / identity layer** — doesn't speak to AgenticDID, KYCz, or any identity stack
- **No Cardano Foundation formal endorsement** — they're a vendor, not a Foundation project
- **Limited dApp push** — most Cardano dApps still integrate Lace, Eternl, Yoroi, Vespr first; MM Snap is a secondary path
- **No visible upstream ambitions** — NuFi seems content with allowlist placement, not pushing for featured or native upstream

### 1.5 Implication for us
NuFi is **not a blocker**. They proved the path works. We differentiate on:
1. **Open source** (reference implementation for the whole ecosystem)
2. **Midnight integration** (the thing they haven't done)
3. **CF / Foundation alignment** (we pursue formal endorsement)
4. **DID-native** (AgenticDID + KYCz hooks)
5. **Upstream ambition** (pursue featured placement, potentially upstream PR)

---

## 2. Other Cardano wallet attempts in/around MetaMask

### 2.1 Historical/abandoned efforts
- Various community proposals and forum threads pre-2023 attempting to brute-force Cardano via custom RPC or EVM-sidechain wraps. None shipped.
- **Cardano on EVM sidechain** (Milkomeda C1) — briefly made ADA accessible to MM via wrapped-ADA bridge. Still limited; not native Cardano.

### 2.2 No other direct Cardano Snaps
As of the latest check on `snaps.metamask.io`, **NuFi's Snap is the sole Cardano Snap** in the directory. (Previously a handful of Flask-only experiments existed but none made allowlist.)

---

## 3. Midnight in MetaMask — The Empty Field

### 3.1 Official Midnight self-custody integrations
- **Lace × Midnight** — **live**. `lace.io/midnight`. First-class self-custody; the canonical Midnight wallet today.
- **VESPR × Midnight** — **announced/roadmap**. Per Midnight blog (`midnight.network/blog/looking-ahead-to-midnight-self-custody-wallet-integrations`).
- **Other Cardano wallets** considering Midnight — Eternl, Yoroi, NuFi itself potentially (they've not announced).

### 3.2 MetaMask × Midnight
- **Zero** integrations exist
- **Zero** Snaps proposed or in-flight publicly
- **Zero** grants announced (as far as we can tell)

### 3.3 Why this is extraordinary
Midnight is literally the L1 chain whose thesis ("selective disclosure + rational privacy + ZK") is the **cleanest possible fit** for MetaMask's own "Interoperability Snaps" messaging. The fact that no one has built this Snap yet is either:
- **(a)** A timing gap — Midnight is still pre-mass-market, wallets waiting for SDK maturity
- **(b)** A resourcing gap — Midnight Foundation is funding CF-aligned wallets (Lace, VESPR) first
- **(c)** An ecosystem-attention gap — MM Snap builders don't know enough about Midnight yet

All three are **addressable by us**. We can be the "MetaMask-side champion" for Midnight exactly when (a) SDK stabilizes (~mid-2026), (b) Foundation looks for new funded ecosystem wallets, and (c) CF + Midnight co-marketing gets louder.

---

## 4. Adjacent ecosystem — non-Cardano, non-Midnight Snaps worth studying

| Chain | Snap | Builder | Lessons for us |
|---|---|---|---|
| Solana | `@solflare-wallet/solana-snap` | Solflare | **Open source**, extends incumbent brand while preserving standalone wallet. Model we can emulate for a *Lace-compatible* Cardano Snap. |
| Cosmos | Various (Leap, Keplr's ecosystem tries) | Multiple | Keyring API + HD derivation patterns |
| Starknet | Starknet Snap (official) | ConsenSys/Argent | Example of **chain-team-endorsed** Snap — the model to aim for |
| Sui | Suiet Snap, others | Multiple | Sui has multiple competing Snaps — shows room for non-first-mover |
| Bitcoin | Native (as of 2025) | MetaMask team | Shows graduation path from Snap → native |
| MultiversX | Official Snap | MultiversX Foundation | Foundation-funded, endorsed — closest to our target model |
| NEAR | Official Snap | NEAR | Similar |
| Aleo | Aleo Snap | Multiple | ZK precedent in Snaps — shows Midnight ZK is feasible in a Snap |

### Key takeaway
**Official / Foundation-endorsed Snaps (Starknet, MultiversX, NEAR) outperform community-only Snaps in adoption.** Our path should aim for **Foundation endorsement** (Cardano and/or Midnight) as a strategic pillar, not an afterthought.

---

## 5. Positioning matrix

| Dimension | NuFi Cardano Snap | Our Cardano Snap (planned) | Our Midnight Snap (planned) |
|---|---|---|---|
| Open source | Partial | **Full** | **Full** |
| Foundation endorsement | No | **Target: yes (CF)** | **Target: yes (Midnight Fdn)** |
| Multi-chain (ADA + NIGHT) | ADA only | **Both** | **Both** |
| DID / identity hooks | No | **Yes (AgenticDID)** | **Yes (AgenticDID)** |
| Swap integration (MM Swaps) | None | **Planned** | **Planned (NIGHT/DUST)** |
| Proof-server (Midnight) | N/A | N/A | **Local + remote options** |
| Hardware wallet | Roadmap | Roadmap | Roadmap |
| Mobile parity | No | Follow MM | Follow MM |
| Upstream PR ambition | None | **Long-term goal** | **Long-term goal** |

---

## 6. Threats / what could make us wrong

- **NuFi adds Midnight** before we ship — possible, their parent Vacuumlabs has Midnight exposure. Mitigation: move fast on Midnight-first MVP.
- **Lace team builds a MetaMask Snap** themselves — would be powerful, but Lace is a full wallet; a Snap is a different product shape. Less likely short-term.
- **MetaMask upstreams Cardano natively via IOG partnership** — would leapfrog us but is speculative and Snap-first is the clear interim. We'd actually benefit from the TAM expansion.
- **Cardano Foundation endorses a different Snap** — possible; we need to build relationships early.

---

## 7. Action items

- [ ] Confirm NuFi's Snap source-code availability (inspect published npm package)
- [ ] Read NuFi's Project Catalyst Fund11 proposal for scope details
- [ ] Outreach to Cardano Foundation DevRel — explore endorsement/grant path
- [ ] Outreach to Midnight Foundation — explore wallet grant
- [ ] Study the MultiversX and NEAR Snap repos for Foundation-funded Snap patterns
- [ ] Study the Aleo Snap for ZK-in-Snap feasibility patterns

# Incentive Strategy — Getting MetaMask to Say Yes

> How we make MetaMask want this — at allowlist, featured, and upstream tiers.

---

## 1. Reframing the question

**John asked**: *"What is an acceptable amount to pay MetaMask per transaction?"*

**Honest answer**: You don't pay MetaMask per transaction. **That's not the model.**

- MetaMask does **not** charge Snap developers to publish
- MetaMask does **not** take a per-transaction cut of Snap-initiated transactions
- MetaMask does **not** have a revenue-share program with Snaps (as of early 2026)
- MetaMask *does* earn **0.875%** on transactions that go through **MetaMask Swaps** — which is a separate product, not a tax on Snaps

The real question: **"How do we bring MetaMask revenue such that they're motivated to feature / upstream us?"**

---

## 2. MetaMask's revenue surfaces (what actually moves their P&L)

| Surface | Rate | Our leverage |
|---|---|---|
| **MetaMask Swaps (EVM)** | 0.875% on the swap | Out of our control |
| **MetaMask Swaps (cross-chain, incl. future Cardano)** | Same, where offered | **High — we can route ADA on-ramps and eventually native Cardano DEX swaps through MM Swaps UI** |
| **Perps / Derivatives** (Hyperliquid integration) | Maker/taker fee share | Medium — Cardano-backed perps venues exist |
| **MetaMask Card** (interchange) | Card interchange revenue | Low — not Snap-related |
| **Fiat on/off ramp partnerships** (MoonPay, Transak) | Revenue share on fiat→crypto | **Medium — we can push ADA/NIGHT into these partner flows via the Snap** |
| **Infura** (RPC) | Per-request / tier | Low — Cardano doesn't use Infura; different infra |
| **Portfolio / staking products** | Fee on staking rewards | **Medium — Cardano staking is huge ($X B TVL). A MM-branded delegation UX could take a fee cut** |

### The three real incentive levers we control

1. **Onboard MM users to ADA via MM Swaps** (cross-chain on-ramp)
2. **Route intra-Cardano DEX swaps through a MM Swaps-branded UI** (our Snap + our dApp + MM's aggregator fee)
3. **Offer MM-branded ADA staking** with a fee-share

All three are **additive** to MM's P&L, none requires MM to *spend* anything. This is the pitch.

---

## 3. What "fair" looks like on the rare case they want a cut

If MetaMask ever asks for a direct cut of our Snap's non-MM-Swaps revenue (unprecedented but let's prep), here's the math we're willing to accept:

### 3.1 Scenario — our Snap includes a Cardano DEX swap UI that doesn't route through MM Swaps

- Cardano DEX base fee: **0.3%** (Minswap / Sundae standard)
- Our UX layer could add: **0.1–0.3%**
- If MM demands a share: **15–25% of our layer**, capped at **0.075%** of swap notional (half of MM's own Swaps rate)
- Users pay similar to current MM EVM swap costs; we keep most of our margin; MM gets a line-item return

### 3.2 Scenario — pure Snap usage fee (stake delegation flows)

- Typical Cardano stake pool fee: **340 ADA/epoch + margin (1.5–5%)**
- A wallet-level delegation convenience fee could add: **0.25% of rewards** (modest, common in other ecosystems)
- Willing MM share: **20–30% of that**

### 3.3 Absolute floor — pay-for-placement

If MM asks for a fee to feature (not just list) the Snap:

- **$0–$25k/year** is defensible (comparable to browser extension feature spots)
- **>$50k/year** is a red flag — we walk away and stay in the regular directory

### 3.4 Absolute ceiling — the hard no

- **No** flat per-user fee
- **No** cut of user key material or any privacy concession
- **No** exclusivity (we must stay Foundation-aligned)

---

## 4. The pitch deck (in narrative form)

### Slide 1 — The opportunity
> MetaMask has 30M+ MAU. Cardano has ~4M active addresses. Midnight has the privacy narrative MetaMask itself leans into. Today, one closed-source Snap serves Cardano; zero Snaps serve Midnight.

### Slide 2 — What we're building
> An open source, Cardano-Foundation-aligned, Midnight-capable MetaMask Snap. Single Snap, both chains, shared seed. Seamless install. CIP-30 + a proposed Midnight connector API compatible with the ecosystem.

### Slide 3 — Why MetaMask wins
> - New TAM: every MM user becomes ADA + NIGHT capable
> - New Swap revenue: ADA on/off ramps + Cardano DEX swaps routed through MM Swaps UI
> - New staking revenue: MM-branded ADA delegation
> - Narrative wins: privacy + interoperability story told in code

### Slide 4 — What we ask
> - Standard allowlist review (we bring the audit)
> - Consideration for featured placement once traction earned
> - Discussion of upstream PR path for native integration in late 2026 / 2027

### Slide 5 — What we don't ask
> - Any funding from MetaMask
> - Any revenue share from their existing products
> - Any exclusivity or lock-in

### Slide 6 — Who we are
> John Santi + the sisterhood (Cassie, Casie, Cara, Penny, Alice) + the DIDzMonolith ecosystem: AgenticDID, KYCz, MidnightVitals, selectConnect, SentinelDID. Track record in Cardano + Midnight dev since the Minokawa (Compact) 0.18 era. Apache-2.0 from day one.

---

## 5. Who to pitch, in order

### 5.1 Layer 1 — Getting allowlisted (required path)

1. **MetaMask Snaps allowlist review team** — submit form, audit PDF, demo video. Transactional, not strategic.
2. **Approved auditor** (list on MM docs) — contract audit early.

### 5.2 Layer 2 — Getting endorsed (strategic, accelerator)

1. **Cardano Foundation DevRel** — Tim Harrison, Denicio Bute, etc. (identify current team). Pitch: "open source reference, CF-aligned, community-first, no competing brand."
2. **Midnight Foundation** — pitch: "first MetaMask Midnight Snap, community wallet diversification."
3. **IOG developer relations** — indirect via CF, but useful for Minokawa SDK alignment.
4. **Project Catalyst** — Fund14+ proposal. NuFi used Fund11; precedent clean.

### 5.3 Layer 3 — Getting featured (post-launch)

1. **MetaMask product team** — only approach after we have: allowlist + user traction (10k+ installs) + Foundation endorsement + a demoable Midnight flow
2. **MetaMask Snaps ecosystem lead** — Joel de Rosnay, others (check current org)
3. **ConsenSys BD** — for revenue-share conversations *only if* they push it

### 5.4 Layer 4 — Upstream PR (speculative, 2027+)

1. **MetaMask core engineering** — path only viable if: Solana/Bitcoin's native integration sets precedent we can match, and we have ecosystem mandate (CF + Midnight Fdn both asking for it)
2. **ConsenSys leadership** — strategic alignment on privacy-first wallet thesis

---

## 6. Grant targets (money to build, not money to pay MM)

| Funder | Program | Amount range | Likely fit |
|---|---|---|---|
| **Project Catalyst** | Fund14+ product challenges | $30k–$150k | Very high — precedent with NuFi's Fund11 |
| **Midnight Foundation** | Ecosystem grants | Unknown, growing | High — novel integration, strategic |
| **Cardano Foundation** | Community-led initiatives | Varies | Medium — if CF wants a neutral MM Snap |
| **Gitcoin / Octant / Retro PGF** | Public goods rounds | $5k–$50k | Low-Medium — open source narrative |
| **ConsenSys Mesh / Linea-adjacent grants** | Snap ecosystem | Unclear | Worth asking once a demo exists |

---

## 7. Counter-offers / negotiation postures

### If MM says: *"We want a flat annual platform fee."*
- **Response**: *"Snaps are free to publish per your docs. If you're creating a new tier, we need: (a) it's publicly documented, (b) it applies uniformly across Snaps. Happy to discuss if that's the plan."*

### If MM says: *"We'll take 50% of your swap UX fee."*
- **Response**: *"Our swap UX fee is 0.1–0.2%. A 50% share is ~0.05–0.1% for MM on top of 0.875% MM Swaps already collects on the same user. We can do 20% — that's ~0.02–0.04% per swap, delivered on top of a flow that wouldn't exist without us."*

### If MM says: *"Add our token burn / MASK rewards logic."*
- **Response**: *"We're delighted to integrate with any open, documented mechanism MetaMask publishes for the broader Snaps ecosystem. We don't do private/exclusive deals."*

### If MM says: *"Give us exclusivity against a NuFi-style competitor."*
- **Response**: *"We're open source; any other Snap can build what we build. Exclusivity on our Snap is fine (we're not cloning it into another wallet); exclusivity against all Cardano Snaps in MM is anti-ecosystem and we won't sign it."*

---

## 8. Metrics that earn featured placement (leading indicators)

Based on observed patterns of other featured Snaps (Solflare, MultiversX, Starknet):

| Metric | Likely featured-ready threshold |
|---|---|
| Directory installs | 25k+ |
| Monthly active users | 5k+ |
| dApp integrations (third-party) | 10+ |
| Audit cleanliness | Zero unremediated medium+ findings |
| Uptime / incident history | 99.5%+, zero critical incidents in 90 days |
| Ecosystem endorsement | CF or Midnight Fdn formal |
| Revenue contribution to MM | Measurable Swap volume generated |

We should **track all of these from day one**.

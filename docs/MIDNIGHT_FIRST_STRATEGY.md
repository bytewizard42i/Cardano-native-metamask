# Midnight-First Strategy

> Why building the Midnight Snap **before** the Cardano Snap is the right call.

---

## 1. Decision

**Ship Midnight first. Ship Cardano second, as an extension of the same Snap.**

## 2. Seven reasons

### 2.1 Zero competition vs entrenched incumbent
- **Cardano in MM**: NuFi shipped Sept 2024. A year of mindshare ahead of us. We'd be chasing.
- **Midnight in MM**: Nothing. Anywhere. We'd be defining the category.

### 2.2 Perfect narrative alignment
MetaMask's entire Snaps marketing is "interoperability + privacy + user-controlled accounts across chains." Midnight's product thesis is "selective disclosure + rational privacy + ZK-first chain." These are the same sentence. No other chain lines up as cleanly.

A Cardano Snap is "another wallet integration." A Midnight Snap is "**the privacy story MetaMask has been telling, now executable**." That's a featurable narrative.

### 2.3 Smaller v1 audit surface
Cardano v1 needs: key derivation, CSL WASM tx-building, UTxO selection, coin control, CIP-30 surface, native asset metadata, staking, rewards, multi-sig considerations, script witness handling, Plutus tx integration paths... it's a big surface.

Midnight v1 can be: key derivation, midnight.js tx-building, shielded tx signing, NIGHT balance, viewing-key management, proof-server coordination. Smaller, more auditable, faster to ship.

### 2.4 Foundation funding alignment
Midnight Foundation is **actively** funding new self-custody wallets (Lace integration, VESPR, potentially more). A MetaMask Midnight Snap is a logical next bet for them — the entire EVM user base as TAM for Midnight, served by a Foundation-funded integration.

Cardano Foundation funding path for "another Cardano Snap" is harder — NuFi already exists, and CF has to justify funding a parallel one. Feasible, but a harder pitch than Midnight's greenfield.

### 2.5 Influence on emerging standards
Midnight's dApp connector API (the equivalent of CIP-30 for shielded txs) is still **nascent**. Wallets shipping now have an outsized voice in what that standard looks like. We can propose `window.midnight.*` conventions, tx-approval flows, viewing-key consent UX, and have them stick because we're one of very few voices at the table.

Cardano's CIP-30 is 4+ years old, fully mature, and well-litigated. Less room to innovate.

### 2.6 Better differentiation story
"Yet another Cardano wallet in MetaMask" is a weak headline. "**First MetaMask Midnight integration — bringing ZK privacy to the 30M-user EVM wallet**" is a cover story.

### 2.7 The Cardano bolt-on is cheap
Once the Midnight Snap ships:
- Key-management infrastructure is already audited
- Snap sandbox patterns are already established
- Allowlist relationship is already built
- Companion dApp framework is already running

Adding Cardano is then: new key derivation path (BIP44 coinType 1815), new tx builder (CSL), new connector surface (CIP-30), new indexer adapter (Blockfrost Cardano). **That's an extension, not a greenfield project.** Much faster and cheaper than the reverse order.

---

## 3. The flip-side: what we give up

### 3.1 Slower time-to-market on the larger user base
Cardano has ~4M active addresses. Midnight has a few tens of thousands at most (testnet + early mainnet). Revenue and volume from Cardano-first would be larger in absolute terms for the first 6 months.

### 3.2 Cardano dApp ecosystem demand
Cardano dApps (Minswap, Sundae, JPG Store, etc.) would *love* more wallet options. Our Cardano Snap has real pull. Midnight dApps are fewer and earlier.

### 3.3 Risk: Midnight SDK volatility
Minokawa 0.18 → future versions may break things. Building on a moving target can eat dev cycles.

### 3.4 Mitigation
- Keep the architecture **multi-chain-first** from day one (see `ARCHITECTURE.md`). We don't build "a Midnight Snap" — we build "a Cardano-ecosystem Snap with Midnight shipping first."
- Publicly preview the Cardano roadmap alongside the Midnight launch. Don't surprise anyone.
- Track Midnight SDK releases weekly (use the Midnight MCP tooling we already have for this).

---

## 4. Concrete phasing

```
Week 0 (now):     Research + architecture (this doc + ARCHITECTURE.md)
Weeks 1–4:        Repo skeleton, pnpm workspaces, Snap stub, CI
Weeks 4–8:        Midnight key derivation + midnight.js integration
Weeks 8–12:       Midnight tx signing + proof-server coordination
Weeks 12–16:      Companion dApp MVP for Midnight
Weeks 16–18:      Internal testing, security hardening
Weeks 18–22:      Audit (approved auditor, Midnight-scoped)
Weeks 22–24:      Audit remediation
Weeks 24–28:      Allowlist submission + review
Week 28:          🎯 MIDNIGHT SNAP LIVE

Weeks 24–32:      Cardano extension work (parallel to audit/allowlist)
Weeks 32–36:      Cardano testing + delta audit
Weeks 36–40:      Cardano allowlist submission
Week 40:          🎯 CARDANO EXTENSION LIVE

Week 40+:         Growth, dApp integrations, Foundation co-marketing
Week 52+:         Featured placement conversations with MM
Year 2+:          Upstream PR discussion (if traction)
```

Timeline is **7 months to Midnight live**, **~10 months to Cardano live**.
Aggressive but achievable with focused work + a small team.

---

## 5. What changes in the repo name / positioning

The repo is named `Cardano-native-metamask` because that was the originating idea. Given this strategy shift, consider:

### Options for naming/positioning
- **Keep the repo name** (Cardano-native-metamask), position as the superset project; Midnight-first is the internal sequencing
- **Rename** to something neutral (e.g., `midnight-cardano-metamask`, `cf-metamask-snap`, `privacy-metamask-snap`)
- **Split** into two repos later if they diverge significantly

**Recommendation**: Keep the name for now. It's private, and the name captures John's strategic vision (Cardano is what he told me about). We can position *internally* as Midnight-first while keeping the Cardano frame externally. If we later decide to go public and rename, it's a 30-minute job.

---

## 6. Immediate next steps (before writing any Snap code)

- [ ] Benchmark Midnight proof-server compute inside a Snap sandbox (critical feasibility check)
- [ ] Reach out to Midnight Foundation DevRel — grant eligibility conversation
- [ ] Draft a Project Catalyst Fund14 proposal (cover Midnight + Cardano together)
- [ ] Map current Midnight dApp connector API surface (`@midnight-ntwrk/dapp-connector-api`)
- [ ] Document CIP-30 gaps that Midnight's connector API fills/differs
- [ ] Schedule a Foundation outreach call (CF + Midnight Fdn, separately)

---

## 7. Decision review trigger

Revisit this decision if **any** of these happen:

- NuFi announces Midnight integration
- Another MetaMask Midnight Snap appears in Flask or directory
- Midnight Foundation explicitly funds a different MetaMask integration
- Midnight mainnet launch delays past Q3 2026
- Cardano Foundation offers a substantial grant contingent on Cardano-first

Otherwise: **Midnight-first stays.**

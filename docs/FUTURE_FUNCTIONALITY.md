# Future Functionality & Considerations

> Forward-looking roadmap beyond v1. Features we want but don't scope into the first release.
> Append-only; promote items to `ARCHITECTURE.md` when they become in-scope.

---

## 1. Near-term (v1.1 – v1.3, first 6 months post-launch)

### 1.1 Cardano native-asset metadata richness
- Full CIP-26 and CIP-68 metadata rendering in tx-approval dialogs
- NFT preview (image, collection, rarity hints)
- Policy-ID reputation badges ("verified project", "scam warning")

### 1.2 Cardano staking UX
- In-Snap stake pool browser with filters (saturation, performance, margin, ITN/mission-driven, environmental)
- One-click delegation with informed defaults
- Rewards history + auto-withdrawal options

### 1.3 Midnight UX polish
- Shielded balance visualizations (private by default, reveal-on-gesture)
- Selective-disclosure "show proof to X" workflow (the Midnight killer demo)
- NIGHT/DUST fee estimation transparency

### 1.4 Cross-chain awareness
- Show user that their Cardano ADA is separate from Midnight NIGHT (same seed, different balances)
- Warn on common confusion paths (e.g., sending NIGHT to a Cardano address)
- Unified "accounts" view with per-chain breakouts

### 1.5 dApp integrations (dog-fooded from DIDzMonolith)
- **AgenticDID** — sign DID operations from the Snap
- **KYCz** — anchor KYC assertions against a Snap-controlled DID
- **MidnightVitals** — telemetry hooks (opt-in)
- **SilentLedger** — sign orderbook commitments via the Snap
- **realVote** — voting on-chain with Snap-controlled identity

## 2. Mid-term (v1.4 – v2.0, 6–12 months post-launch)

### 2.1 MetaMask Swaps integration (Cardano DEX aggregation)
- Route ADA→native-token and native-token→ADA swaps through Minswap, Sundae, WingRiders via the Snap
- Ideally: MM Swaps UI extends to Cardano via our aggregator adapter
- Revenue angle: MM Swaps fee (0.875%) captured on volume we originate

### 2.2 Midnight shielded swaps
- Zswap pool interactions
- Private DEX order placement
- Cross-shielded → unshielded settlements

### 2.3 Fiat on-ramp deep integration
- MoonPay, Transak ADA/NIGHT routes embedded in the Snap dialog
- User-friendly default conversion UX
- Revenue angle: on-ramp partner rev-share

### 2.4 Hardware wallet pass-through
- Wait for MetaMask to ship Snap → HW device pipe (currently limited)
- When available: Ledger Cardano app, Trezor Cardano app, eventually HW Midnight support
- Adds cold-storage tier, unlocks enterprise / RWA use cases

### 2.5 Multi-sig and account abstraction
- Cardano native multi-sig (scripts + witness coordination) via the Snap
- Account-abstraction-style policies (spending limits, co-signer requirements)
- Integration with SentinelDID guardian model

### 2.6 Programmable spending limits and allowances
- "Never spend more than X ADA per day without 2FA"
- "Require biometric for any send to a new address"
- Browser-native WebAuthn where possible

### 2.7 Mobile parity
- Once MetaMask Mobile Snaps are production-grade (watch the roadmap)
- Priority: signing + balance; staking + dApp connect close behind

## 3. Long-term (v2.x – v3.x, 12+ months)

### 3.1 Upstream PR to MetaMask core
- Only pursued if: Snap has >50k active users, Foundation endorsement, and MM receptive
- Scope: Cardano (and Midnight) as first-class chains alongside ETH/Solana/Bitcoin
- Requires: MM core buy-in, potentially ConsenSys strategic agreement
- Reference path: Solana's native integration post-Solflare-Snap

### 3.2 Native token (MASK-like) for the Snap ecosystem
- If ever — ecosystem incentives token for dApp integrations, governance, fee rebates
- Only if needed for sustainability beyond grant + Swaps-referral revenue
- Avoid for avoid's sake; tokens should solve problems, not be marketing

### 3.3 Privacy-preserving identity middleware
- Deep integration with AgenticDID as the default DID for Snap-controlled accounts
- Selective disclosure credentials for dApp login (no more signing arbitrary messages)
- KYC-lite tier: prove age / jurisdiction / solvency without revealing identity
- Enterprise: zero-knowledge compliance reports via MidnightVitals hooks

### 3.4 Enterprise edition / custody integration
- B2B MetaMask Snap instances with:
  - HSM-backed keys
  - Approval workflows
  - Audit trails written to private chain segments
  - KYCz-compatible user onboarding
- Adjacent to the EnterpriseZK product line

### 3.5 Cross-chain atomic swaps
- ADA ↔ NIGHT atomic swaps via HTLC or Midnight-specific primitive
- ADA ↔ ETH via established bridges, surfaced in Snap UI
- Risk surface is huge — low priority until fundamentals are bulletproof

### 3.6 Decentralized proof-server coordination
- User-owned proof-server discovery and load balancing
- "Proof-server marketplace" — pay NIGHT/DUST to have someone else generate your proof
- Optional; default path stays self-hosted or Foundation-run

### 3.7 Chain-agnostic framework upstreamed
- The "multi-chain Snap" pattern we build could become a reusable library
- Other chain ecosystems (Tezos? Algorand? Polkadot parachains?) could plug in
- Possibly a MetaMask-endorsed reference framework

## 4. Considerations always worth re-evaluating

### 4.1 Privacy posture evolution
- Browser fingerprinting — does our dApp leak user identity?
- Indexer query correlation — does every Blockfrost call reveal the user's address?
- Midnight viewing-key handling — remote prover tradeoffs
- **Always**: prefer user-sovereign options; default to paranoid

### 4.2 Regulatory evolution
- EU MiCA privacy token treatment — Midnight's selective-disclosure is our positioning answer
- US stablecoin / RWA bills — AgenticDID + KYCz layer demonstrates compliance-compatible privacy
- Travel rule — we build the tools, don't take custody of compliance decisions
- **Always**: surface the user's choice, never make the choice for them

### 4.3 MetaMask policy shifts
- Snap policy changes that affect us (new required audits, permission tightening)
- Upstream core roadmap surprises (native Cardano from MM directly?)
- Revenue-share or platform-fee introductions (our posture in `INCENTIVE_STRATEGY.md`)

### 4.4 Ecosystem realignments
- NuFi adds Midnight → re-evaluate differentiation
- Lace adds MetaMask integration → unlikely but plausible; our differentiation stays
- Midnight renames / re-brands (we've already lived through Compact → Minokawa)

### 4.5 Technical evolution
- Minokawa language evolution (breaking changes tracked via MCP tools)
- Cardano Plutus V3+ features affecting wallet requirements
- MetaMask Snaps API additions (keyring v2, better sandboxing)
- WebAssembly / SIMD / WebGPU for faster in-Snap proof generation

### 4.6 Team and resources
- When does this need a dedicated full-time team vs "the sisterhood on nights and weekends"?
- Grant sustainability — diversify beyond Catalyst + Midnight Fdn
- Hiring vs outsourcing auditors, designers, dApp devs

## 5. Explicit "no, never" list

- **No closed-source core**. We're open source or we're nothing.
- **No exclusive deals** with chains, wallets, or platforms that lock us in.
- **No private-key export** features, period. Seed export is MetaMask's own flow; we never build a parallel one.
- **No data collection** beyond opt-in telemetry. No tracking, no analytics cookies, no dark patterns.
- **No token pre-mine** if we ever launch a token. Fair launch or no launch.
- **No feature flag that deletes user agency** (e.g., "forced upgrade deletes your accounts").

## 6. Sunset and end-of-life considerations

- If MetaMask upstreams native Cardano + Midnight and our Snap becomes obsolete: **gracefully deprecate** with a 6-month migration notice
- If Midnight pivots in a way that makes the Snap approach unworkable: publish a post-mortem, open-source everything, and make cleanup easy
- Keep the repo alive for historical reference even post-sunset

---

## 7. Open brainstorms (raw, to refine)

- "Social recovery" — integrate with SouLink / SelectConnect for wallet recovery via trusted contacts?
- NFC tap to approve tx (companion app + EventRevolution hardware)?
- AI-assisted tx review — LLM reads the tx CBOR and flags anomalies before user signs?
- Whistleblower mode — full privacy + deniability for activist use cases?
- Multi-device roaming via encrypted backup (user-chosen custodian, user-controlled key)?
- Cross-chain identity proof — "my MM Snap proves I'm the same person across Cardano, Midnight, and Ethereum" without revealing which addresses?

Add more as they emerge. This section is where wild ideas live before they earn a proper home.

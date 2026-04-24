# Cardano-native MetaMask

**Bringing Cardano natively to the world's most-installed crypto wallet.**

> An effort by John Santi, Cassie, and the sisterhood — to land Cardano support
> in MetaMask (via MetaMask Snap, then upstream PR where feasible) and give
> tens of millions of MetaMask users first-class access to Cardano dApps,
> Midnight privacy features, and the broader Cardano / Fi ecosystem.

---

## Why This Matters

MetaMask has **~30M MAU** and is the default on-ramp to Web3 for most humans.
Cardano has:

- Extended UTxO — deeper programmability than EVM
- Native assets — no token-contract attack surface
- Midnight — the first mainstream privacy L1 with selective disclosure
- A mature stablecoin, DeFi, DID, and RWA ecosystem

...and yet a typical EVM user has no path to it without installing a second wallet,
learning a new mental model, and bridging assets through fragile third parties.

**That is a solvable UX problem.** MetaMask Snaps exist precisely for this.
The Cosmos, Solana, Sui, Bitcoin, and MultiversX communities all have shipped
Snaps. **Cardano deserves one too — and Midnight privacy alongside it.**

---

## Strategy (phased)

### Phase 1 — MetaMask Snap (JavaScript, sandboxed)
- Ship a permissionless Snap: `@cardano/snap` or similar
- Feature scope:
  - Key derivation (CIP-1852 HD wallet, Shelley era)
  - UTxO selection, tx building via `cardano-serialization-lib` (WASM) or `Lucid`
  - Stake delegation, reward withdrawal
  - Native token send/receive
  - CIP-30 compatible API surface so existing Cardano dApps work *unmodified*
- Optional: Midnight shielded-tx support (viewing keys, Zswap)

### Phase 2 — dApp Connector Compatibility Shim
- `window.cardano.metamask` injection mimicking CIP-30
- Existing Cardano dApps (Minswap, JPG Store, etc.) work with a MetaMask user
  out of the box

### Phase 3 — Upstream PR to MetaMask core
- Where Snap architecture limits (e.g. deep hardware-wallet integration,
  native UI), propose upstream changes
- This is a *stretch goal* — Snaps may be sufficient for most users

### Phase 4 — Midnight Privacy Tier
- Leverage Midnight selective disclosure inside the same Snap
- ZK proofs for compliance, KYC-lite, privacy-preserving DeFi
- Companion to the AgenticDID identity layer

---

## Technical Reference Points

- **MetaMask Snaps docs**: https://docs.metamask.io/snaps/
- **CIP-30 (dApp connector)**: https://cips.cardano.org/cip/CIP-30
- **CIP-1852 (HD derivation)**: https://cips.cardano.org/cip/CIP-1852
- **cardano-serialization-lib**: https://github.com/Emurgo/cardano-serialization-lib
- **Lucid**: https://lucid.spacebudz.io/
- **Midnight.js**: https://github.com/midnight-ntwrk/midnight-js
- **Existing Snap precedents**:
  - Cosmos: https://github.com/cosmos/snap
  - Solana: https://github.com/solflare-wallet/solana-snap
  - Sui, MultiversX, NEAR, etc.

---

## Collaborators

**The sisterhood:**
- **Cassie** — Cascade on Chuck (Ubuntu workstation, primary driver)
- **Casie** — Cascade on Terry (Ubuntu laptop)
- **Cara** — Cascade on Sparkle (desktop)
- **Penny** — Cascade on artpro (laptop)
- **Alice** — ChatGPT
- **John Santi** — human lead

---

## Status

**Greenfield.** Repo initialized. Architecture + scoping phase.

See:
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — target system design (coming)
- [`docs/RESEARCH_LOG.md`](./docs/RESEARCH_LOG.md) — open questions, prior art

---

## License

Apache-2.0. See [LICENSE](./LICENSE).

> If this ever goes upstream to MetaMask, we may need to dual-license or
> relicense portions. Track at the PR stage.

---

*Part of the DIDzMonolith. Private until ready for public unveiling.*

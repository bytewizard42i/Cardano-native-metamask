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
- Midnight privacy tier planned for Phase 4 — not MVP

### Open Questions
- [ ] Which Cardano tx-building lib? `cardano-serialization-lib` (WASM, Emurgo,
      canonical but heavy) vs `Lucid` (TS, lighter, but derivative) vs
      Mesh SDK?
- [ ] Key management inside Snap sandbox — can we get secure element access
      on iOS/Android MetaMask mobile? Or desktop-browser-only for v1?
- [ ] Hardware wallet story — Ledger / Trezor Cardano apps already exist;
      how does the Snap compose with them?
- [ ] CIP-30 surface: does MetaMask Snap architecture let us inject
      `window.cardano.metamask` or do we need a companion content script?
- [ ] Midnight Zswap integration — needs viewing key custody; ZK prover is
      large, can it run in a Snap? Or offload to a local proof server?

### Prior Art to Deep-Dive (one each per upcoming session)
- Cosmos Snap architecture + repo layout
- Solflare Solana Snap
- MultiversX Snap (closest to Cardano's account model, interesting design)
- Existing "MetaMask for Cardano" community threads / failed attempts

### Risks
- MetaMask Snap approval process — review times, policy surprises
- Cardano's eUTxO model vs MetaMask's account-centric UI assumptions
- Midnight SDK maturity (Minokawa 0.18 / compiler 0.26 at time of writing)
- Double-spend UX in UTxO world — MetaMask users won't understand "coin
  selection" intuitively

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

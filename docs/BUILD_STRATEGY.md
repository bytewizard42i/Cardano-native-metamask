# Build Strategy — Demoland Inside the Real Thing

> **Decision (2026-04-24)**: Build CMM as **one real project** from day one.
> The companion dApp doubles as our "demoland" via mocked Snap responses
> during M0–M3. No parallel throwaway demo codebase.

---

## Why not a separate demoland

A separate demoland repo would:
- Duplicate the UI layer (waste)
- Get thrown away when we swap in real Snap calls
- Diverge from real types/contracts over time
- Not reduce our audit surface (audit cares about the Snap, not the dApp)
- Not help allowlisting (MM review needs real code anyway)

A separate demoland repo would **only** make sense if:
- We were pitching a visual concept before any code was decided (we're past that)
- The real protocol were huge and speculative (ours is finite and defined)
- The demo audience couldn't install MetaMask Flask (they can)

## Why one project works

CMM has a naturally phased dev path where the companion dApp is usable
*before* the Snap is signing real txs:

```
M0 — Scaffold: monorepo, shared types, CI, zero features
M1 — Companion dApp with MOCKED Snap: install flow, UI states, balance mocks,
     approval dialogs — looks and feels real, no key material touched
M2 — Real key derivation in Snap (Midnight first), dApp swaps mock→real for
     read-only operations (address, balance)
M3 — Real tx signing (Midnight), proof-server integration, dApp swaps
     mock→real for full flow
M4 — Polish pass, security hardening, docs for users + third-party dApps
M5 — Audit
M6 — Allowlist → 🎯 CMM v1 LIVE on snaps.metamask.io
```

At every milestone M1+ the companion dApp is a **demo we can pitch**:

- **M1 demo**: "Here's the UX with all flows wired up — nothing actually signs
  yet." Good for: Midnight Foundation preview, Catalyst pitch, internal review.
- **M2 demo**: "Here's a real MetaMask-derived Midnight address, rendered in a
  real UX." Good for: Foundation validation, community preview.
- **M3 demo**: "Here's a live shielded transaction signed from MetaMask."
  Good for: public launch buzz, audit scope confirmation, featured-placement
  ammunition.

The companion dApp code is the same from M1 through M6. Only the Snap RPC
adapter flips from mock → real over time.

## How mocking works in practice

Every Snap method lives behind a **chain-adapter** interface. The adapter has
two implementations: `mock` and `real`. A single env var (or build flag)
selects which is wired up.

```typescript
// packages/dapp-sdk/src/adapters/index.ts
export interface SnapAdapter {
  getAddress(chain: 'cardano' | 'midnight'): Promise<string>;
  getBalance(chain: 'cardano' | 'midnight'): Promise<Balance>;
  signTransaction(tx: TxPayload): Promise<SignedTx>;
  // ... etc
}

// packages/dapp-sdk/src/adapters/mock.ts
export const mockAdapter: SnapAdapter = { /* returns fixtures */ };

// packages/dapp-sdk/src/adapters/real.ts
export const realAdapter: SnapAdapter = { /* calls wallet_invokeSnap */ };

// packages/dapp-sdk/src/index.ts
export const snap = process.env.NEXT_PUBLIC_CMM_MOCK === '1'
  ? mockAdapter
  : realAdapter;
```

Companion dApp code **never** knows the difference. We ship the same dApp to
`cmm-mock.vercel.app` (for demos) and `cmm.wallet` (for production) with a
single build variable flipped.

## What about the audit?

The audit scope is **the Snap package** (`packages/snap/`). The companion
dApp and dApp-SDK live outside the audit boundary — they're standard web code
that can be updated without re-audit.

This is a deliberate architectural choice: **keep the audited surface small,
keep the UX surface flexible.** All key material and signing logic lives in
`packages/snap/`. Everything else is orchestration.

## What this does NOT change

- Our seven-reason Midnight-first sequencing (`MIDNIGHT_FIRST_STRATEGY.md`)
  still holds. Midnight ships to allowlist before Cardano.
- Our timeline (`DEEP_DIVE_METAMASK_INTEGRATION.md`, §2.3): ~7 months to
  Midnight live on allowlist, ~10 months to Cardano on top.
- Our architecture (`ARCHITECTURE.md`): monorepo layout, stack, security
  posture all as documented.
- Our incentive posture (`INCENTIVE_STRATEGY.md`): open source, Foundation-
  aligned, no pay-to-play.

## Demo moments to engineer

These are the pitch artifacts the companion dApp needs to produce at each
milestone:

| Milestone | Demo artifact |
|---|---|
| M1 | 60-second video: "install CMM Snap → see mocked balance → compose mock tx → approval dialog" |
| M2 | Live demo: "installed fresh, sees real Midnight address, verifies on Blockfrost explorer" |
| M3 | Live demo: "send 1 shielded NIGHT testnet, proof server generates proof, tx confirms on-chain" |
| M4 | Public walkthrough with two dApps integrated (internal: AgenticDID + KYCz) |
| M6 | Launch video with Foundation quote, media kit ready |

Each demo is reusable for:
- Grant applications (Catalyst, Midnight Fdn)
- Foundation outreach (CF, Midnight Fdn, IOG)
- MetaMask Snaps team relationship building
- Community launch

## TL;DR

**Build it all once. Mocks are the demoland. The dApp is the demoland. The
dApp is also the product. The Snap is the audited core. Done.**

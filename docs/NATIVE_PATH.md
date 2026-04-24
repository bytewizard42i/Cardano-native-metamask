# The Path to "Native" MetaMask Support

> **For Riley Kilgore** (IOG / Aiken) — written 2026-04-24 after your very
> sharp pushback on the word *native* in our repo name. You're right, and
> this doc makes our assumptions explicit so you can tear them apart.

---

## 🎯 Riley's Point, Restated

> *"You cannot create a new repo to integrate anything into MetaMask. You
> have to fork their repo and modify it to make a pull request… If you want
> people to be able to download MetaMask and immediately have Cardano
> available — what I stated before is true, you must fork their repo
> directly."*

**You're correct.** Truly *native* = bundled into `metamask-extension` so
every user who installs MetaMask from the Chrome Web Store has Cardano +
Midnight out of the box. **That is not what a Snap delivers**, and our
repo name is aspirational, not a statement of current scope.

This doc explains:
1. The specific repo(s) we would fork to attempt the fully-native path
2. Why nobody has successfully merged a non-EVM chain that way (yet)
3. The pragmatic ladder we're actually climbing (Snap → Keyring Snap → upstream PR)
4. Where your expertise would be **most impactful** if you want to plug in

---

## 🏛️ The Specific Repos (Riley's Way, Literal Version)

### Primary target
**`MetaMask/metamask-extension`** — https://github.com/MetaMask/metamask-extension

The actual browser extension. Chrome / Firefox / Brave / Edge all ship from this single monorepo.
- License: **Apache-2.0** (same as us)
- Size: ~3–4M lines of code
- Activity: dozens of merges per week

### But "native" is never just one repo

A real native-chain integration touches **three** MetaMask repos, and possibly more:

| Repo | Purpose | What a native-Cardano PR would change |
|---|---|---|
| [`MetaMask/metamask-extension`](https://github.com/MetaMask/metamask-extension) | Browser extension UI + state glue | Send/receive screens, network selector, account picker wiring, Redux state for the new chain |
| [`MetaMask/core`](https://github.com/MetaMask/core) | Shared controllers consumed by both extension + mobile | New `KeyringType` (`cardano-keyring`), `TransactionController` extension for UTxO semantics, chain-agnostic plumbing. **Most architectural changes land here first.** |
| [`MetaMask/metamask-mobile`](https://github.com/MetaMask/metamask-mobile) | React Native iOS/Android app | Full parity work — separate team, separate review, separate release train |

Plus adjacent:
- `MetaMask/design-tokens` — chain icons, brand colors
- `MetaMask/controller-utils` — address validation, chain-ID helpers
- `MetaMask/providers` — injected-provider spec would likely need extension (or Multichain API changes upstream)

---

## 🧱 What the Work Actually Looks Like

### Crypto dependencies added to the extension bundle
- `cardano-serialization-lib` (WASM, ~500 KB gzipped) — significant bundle hit shipped to ~30M users
- OR [Lucid](https://lucid.spacebudz.io/) (pure TS, smaller, less audited) — security team pushes back on "less audited"
- OR [Mesh SDK](https://meshjs.dev/) (also pure TS) — same concern
- `bech32`, `blake2b`, ed25519-BIP32 (CIP-3) — some of these exist via `@metamask/utils` already
- For Midnight: the ZK proof system (more WASM, even more bundle controversy)

> *Riley — genuinely asking your take: if forced to ship a Cardano lib inside `metamask-extension` itself, would you pitch CSL, Lucid, Mesh, or a new minimal builder? We're evaluating for M3 but haven't committed.*

### Architectural changes required

1. Invent a `CardanoKeyring` implementing MM's `Keyring` interface — but for **UTxO**, not account-model. MM's existing keyrings all assume `from/to/amount` account semantics.
2. Extend `TransactionController` to understand UTxO selection, coin selection, change addresses.
3. Build a chain-abstraction in the UI so the send screen renders "to address: …" *or* "to UTxO: …" contextually.
4. For Midnight: build shielded-UI primitives (private amounts, selective disclosure) into the extension from scratch.
5. Mobile parity for everything above.

### Review process (the political reality)

- MetaMask core team review — weeks per PR
- Security review — weeks to months (WASM gets extra scrutiny)
- Bundle-size signoff — every byte ships to ~30M users
- Mobile team parity review — separate timeline
- If it merges, indefinite maintenance burden on MM for chain-specific code they don't own

---

## 📉 The Brutal Precedent Check

**Zero non-EVM chains have ever merged native support into `metamask-extension`.**

| Chain | Path they took | First-party? |
|---|---|---|
| Bitcoin | Snap | ✅ Yes — maintained by MM's own team. **Closest thing to "native" today.** |
| Solana | Two Snaps — Solflare's third-party + MM's first-party `solana-wallet` | ✅ Partial |
| Cosmos | Snap | ❌ Third-party |
| Sui | Snap | ❌ Third-party |
| Starknet | Snap | ❌ Third-party |
| MultiversX, NEAR, Aptos | Snap | ❌ Third-party |

There is a reason. **MetaMask built Snaps specifically so chain teams wouldn't need to fork `metamask-extension`.** The Snaps SDK, the Snaps Registry allowlist, the Snaps Directory UI, the Interoperability marketing — all of it is MetaMask saying "please don't send us a `metamask-extension` PR, use this instead."

When we pitch "we want to merge Cardano into your core extension," their first question will be: *"why can't this be a Snap?"* — and for 95% of use cases the honest answer is "it can."

---

## 🪜 The Ladder We're Actually Climbing

Riley, you might find this reframing useful. "Native" isn't binary — MetaMask has evolved a **tiered integration model**:

| Tier | Mechanism | User UX | Our milestone | Probability |
|---|---|---|---|---|
| **1. Sideloaded Snap** | URL-entered install from our site | User knows they installed a Snap | **M1 (current)** through **M5** | ✅ Shipping now |
| **2. Allowlisted Snap** | One-click install from MM's Snap Directory (no URL entry) | User browses "available features" in MM itself | **M6** | 🎯 ~60% if we execute M2–M5 cleanly |
| **3. Keyring Snap** | Snap that registers as a proper keyring; accounts appear in MM's account list indistinguishable from EVM accounts | User sees "Cardano account" in their account dropdown, never thinks about Snaps | **M3 or later** | 🎯 ~75% once we have signing |
| **4. First-party Snap** (MM's own team contributes/maintains) | Same as tier 2 or 3 but badged/featured by MetaMask | Trust halo from MM itself | Stretch — would require MM commitment | ~25% (requires partnership) |
| **5. `metamask-extension` PR** | The literal thing you described | Ships with MM to all users by default | Stretch stretch goal | **<5%** (zero precedent) |

> **Our realistic endgame**: tier 3 or 4 — a Keyring Snap that becomes so core to MetaMask's Cardano story that it gets featured like the Bitcoin Snap. That's as close to "native feel" as the current MetaMask architecture allows without a core-extension merge.

---

## 🤝 Where Your Input Would Be Most Valuable

We've flagged several open questions we genuinely can't resolve alone. Any of these where you have opinions would be gold:

### 1. CIP-3 (BIP32-Ed25519) derivation inside a Snap
Our M1 caveat: `@metamask/key-tree`'s `ed25519` curve is RFC-8032, **not** CIP-3. Addresses we emit today are shape-correct bech32 (`addr_test1…`) but **not interoperable with Lace/Eternl keys** derived from the same seed phrase.

**Question for Riley**: in M2 we need proper CIP-3 derivation inside the Snap. Options we see:
- Port a minimal subset of [`input-output-hk/cardano-hd`](https://github.com/input-output-hk/cardano-hd) to pure TS
- Vendor a tiny hand-rolled CIP-3 helper (≈200 LOC based on the spec)
- Wait for `@metamask/key-tree` to add CIP-3 upstream (we assume: never)

Is there an audited pure-TS CIP-3 implementation we're missing?

### 2. Tx-building library inside the Snap (M3 scope)
We need one of CSL / Lucid / Mesh inside a sandboxed SES environment (MetaMask Snaps run under SES lockdown — no eval, no dynamic code gen, restricted globals). Your Aiken-side experience would be valuable here: **what breaks under SES for each?** CSL's WASM bootstrapping especially worries us.

### 3. CIP-30 compatibility shim
The BTC Snap exposes nothing via `window.*` — dApps must explicitly call `wallet_invokeSnap`. But Cardano dApps (Minswap, JPG Store, SundaeSwap) all expect `window.cardano.<walletName>` with CIP-30 methods.

**Two paths:**
- (a) Snap injects `window.cardano.metamask` via a companion page-script
- (b) Ship a separate npm package dApps install + import to bridge

Which does the Cardano community actually want?

### 4. Midnight viewing-key derivation path
We use `m/44'/1296'` as the Midnight root (SLIP-44 coin 1296 — I'm not certain this is ratified). Do you know if Midnight Foundation has locked in a SLIP-44 coin type?

### 5. Zero-precedent question
Has anyone at IOG / Aiken ever been approached by MetaMask's Snap team, or vice versa? A pre-existing relationship would accelerate our path dramatically.

---

## 📚 Background Reading for Snap Internals

You mentioned you're going to read up on Snaps. Suggested order:

1. [Snaps overview](https://docs.metamask.io/snaps/) — 10 minutes, gives you the mental model
2. [`endowment:rpc`](https://docs.metamask.io/snaps/reference/permissions/#endowmentrpc) — how Snaps expose JSON-RPC methods to dApps
3. [BIP-32 entropy permissions](https://docs.metamask.io/snaps/reference/permissions/#snap_getbip32entropy) — how Snaps derive keys from the user's MetaMask seed
4. [Keyring Snaps](https://docs.metamask.io/snaps/features/custom-evm-accounts/create-account-snap/) — the "tier 3" above; accounts in the MM UI
5. [Our `packages/snap/README.md`](../packages/snap/README.md) — concrete RPC reference for what we've built so far

And the repos we forked as references (all in `/home/js/DIDzMonolith/` as submodules if you want to clone):

| Ref repo | Why |
|---|---|
| [`MetaMask/snap-bitcoin-wallet`](https://github.com/MetaMask/snap-bitcoin-wallet) | **Our strongest architectural cousin.** Cardano EUTxO and Midnight shielded UTxO both descend from Bitcoin UTxO. |
| [`MetaMask/snaps`](https://github.com/MetaMask/snaps) | The SDK monorepo |
| [`MetaMask/snap-simple-keyring`](https://github.com/MetaMask/snap-simple-keyring) | Canonical Keyring-Snap template |
| [`MetaMask/template-snap-monorepo`](https://github.com/MetaMask/template-snap-monorepo) | Bare scaffold |
| [`MetaMask/snaps-registry`](https://github.com/MetaMask/snaps-registry) | Where our M6 allowlist PR lands |
| [`MetaMask/SIPs`](https://github.com/MetaMask/SIPs) | Where Snap Improvement Proposals go (likely for Midnight shielded-signing RPC) |

---

## 🔁 TL;DR

- You asked which repo we fork for "native." Answer: **`MetaMask/metamask-extension`** — and realistically `MetaMask/core` and `MetaMask/metamask-mobile` alongside it.
- Nobody has ever merged native non-EVM chain support. Everyone goes through Snaps.
- Our endgame is **tier 3 or tier 4** — a Keyring Snap featured by MetaMask (like the Bitcoin Snap) — not a `metamask-extension` merge.
- Repo name "Cardano-native-metamask" is the north star, not a current-state claim. We're keeping it because the pressure it creates is the right pressure.
- Your sharpest value-add would be on: CIP-3 derivation inside SES, tx-builder choice, CIP-30 shim strategy, and any Midnight SLIP-44 intel.

**Thanks for the pushback.** It's exactly the kind of signal that keeps us honest.

— Cassie & John

---

## See Also

- [`README.md`](../README.md) — project overview, phased strategy, quickstart
- [`docs/INCENTIVE_STRATEGY.md`](./INCENTIVE_STRATEGY.md) — how to get MetaMask to say yes (allowlist → featured → upstream)
- [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) — Snap API surface, security posture, phased milestones
- [`docs/REFERENCE_REPOS.md`](./REFERENCE_REPOS.md) — per-fork purpose and refresh instructions
- [`docs/MIDNIGHT_FIRST_STRATEGY.md`](./MIDNIGHT_FIRST_STRATEGY.md) — why we ship Midnight before Cardano

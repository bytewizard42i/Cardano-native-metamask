# Roberto's Questions (2026-07-09)

Answers prepared for Roberto Cerrud, Aiken/Cardano expert and Emurgo alum.

---

## 1. Is Lucid working in latest Cardano versions?

**Yes.** Lucid (by SpaceBudz) is actively maintained and works with current Cardano eras (Conway +).

Current state (as of July 2026):
- **Repo**: https://github.com/spacebudz/lucid (720 commits, 359 stars, 103 releases)
- **Now Deno-first**: `import { Lucid } from "jsr:@spacebudz/lucid"` is the recommended path
- **Legacy npm**: `npm install lucid-cardano` still works but is marked "will likely be obsolete"
- **Core rewritten in Rust** compiled to WASM (69% Rust, 31% TypeScript)
- **CIP-0057 blueprint support**: can import Aiken validators directly via generated `plutus.ts`
- **Node.js**: requires `--experimental-wasm-modules` flag and `"type": "module"` in package.json

**Important distinction for CMM**: Our ARCHITECTURE.md lists two separate concerns:
- **In-Snap tx building**: `@emurgo/cardano-serialization-lib` (CSL) WASM, because Snaps run in a sandboxed SES environment where Deno imports are not available
- **In dApp tx building**: Lucid, for ergonomic developer UX

**Known ecosystem shift**: Emurgo's CSL (`cardano-serialization-lib`) has slowed in maintenance. Many Cardano projects have migrated to **CML** (Cardano Multiplatform Lib by dcspark), which is Rust-native, more actively maintained, and covers more ledger eras. CMM may evaluate CML for M2/M3 when we integrate real tx building. Lucid's new Rust core is actually independent of CSL, so Lucid itself is not blocked by CSL's maintenance pace.

**Bottom line**: Lucid works today, is the most ergonomic Cardano tx-building library, and supports Aiken validators via CIP-0057 blueprints. For our Snap sandbox, we will likely use CSL or CML directly (WASM) rather than Lucid, since Lucid's Deno-first distribution does not fit the SES lockdown environment.

---

## 2. How about Leios?

**Leios is Cardano's next major consensus scaling upgrade, not a library change.** It does not affect transaction format, so Lucid, CSL, CML, and our Snap code do not need changes for Leios compatibility.

Current status (as of July 2026):
- **CIP-164** merged: defines Ouroboros Leios (Linear Leios as the first variant)
- **Treasury proposal**: IOG submitted ₳27.7M to mature Leios from testnet prototype to mainnet-ready release candidate
- **Testnet "Musashi Dojo"**: launched end of June 2026, structured in 5 phases (Earth, Water, Fire, Wind, Void)
- **Throughput target**: 10x to 65x current capacity (current ~4.5 KB/s, target up to 200 KB/s)
- **Mainnet hard fork**: anticipated end of 2026 or early 2027
- **Phased rollout**: starts with modest 2x to 5x increase, scales up through protocol parameter updates with community consensus

**What Leios does**: Decouples transaction diffusion from transaction sequencing using endorser blocks (EBs) and committee-based validation. This allows much larger blocks to be processed without changing the core ledger rules. Uses SNARKs for sublinear correctness verification, Data Availability Sampling (DAS), and Bloom filters.

**What it means for CMM**: Nothing changes in our code. Leios is a node/consensus layer upgrade. Transactions, addresses, keys, and CSL/CML/Lucid all remain the same. When Leios activates on mainnet, our Snap will just see faster confirmation times and higher throughput like every other Cardano client. No action needed.

---

## 3. For Midnight, what is used?

**Midnight.js SDK** (`midnight-js`) from the Midnight Foundation (midnight-ntwrk).

Our ARCHITECTURE.md specifies:
- **SDK**: `midnight-js` 2.1+ (matching testnet-02 / mainnet)
- **Wallet API**: `@midnight-ntwrk/wallet-sdk` 5.0+
- **DApp connector**: `@midnight-ntwrk/dapp-connector-api` 3.0+ (mirrors CIP-30 pattern)
- **Proof server**: `midnightntwrk/proof-server` via Docker, listens on port 6300
- **Indexer**: Blockfrost Midnight Indexer (GraphQL + WebSocket)

**Key difference from Cardano**: Midnight addresses are NOT a simple bech32 of the spending pubkey. They involve a **viewing key** derived separately inside the Midnight wallet SDK, plus proof keys and a ZK-friendly commitment scheme. This is why M1 ships a placeholder Midnight address (`mn_test_02_stub_...`) and real encoding lands in M2 once we integrate `midnight-js` viewing-key derivation.

**Midnight key derivation**: `m/44'/1296'` on curve ed25519. Coin type 1296 is our working placeholder (not yet officially in SLIP-44). The spending key is derived in M1, but the viewing key (needed for balance reads and address encoding) is M2 scope.

**Runtime note**: Midnight SDK uses WASM + native crypto tested against Node.js. We must run on Node (not Bun) for Midnight operations in production, per our ecosystem runtime policy.

---

## 4. What works for M1?

### Live and functional

| Method | Chain | Status |
|--------|-------|--------|
| `cardano_getPublicKey` | Cardano | Real hex payment + stake Ed25519 pubkeys with CIP-1852 derivation paths |
| `cardano_getAddress` | Cardano | Real bech32 Shelley base address (CIP-19 compliant) |
| `midnight_getPublicKey` | Midnight | Real hex spending pubkey from `m/44'/1296'` HD derivation |
| `midnight_getAddress` | Midnight | Placeholder only (`mn_test_02_stub_...`), clearly labeled, wired for M2 swap |
| `common_getSupportedChains` | Cross-chain | Returns `['midnight', 'cardano']` |
| `common_getBrand` | Cross-chain | Returns brand + long name strings |
| `common_getCapabilities` | Cross-chain | Feature-flag probe so dApps can branch on what is live |

### Companion dApp

- Three modes: mock, live-readonly (real Blockfrost reads), Snap-backed (real key derivation)
- Accessible tooltips on every technical term with links to CIPs, MetaMask Snaps docs, BIP specs
- Structured error codes (`CMM_UNKNOWN_METHOD`, `CMM_NOT_YET_IMPLEMENTED`, `CMM_INVALID_PARAMS`, `CMM_DERIVATION_FAILED`)
- Param validation on every Snap handler
- 161 tests across 4 packages

### Important M1 caveats (what does NOT work yet)

1. **Cardano addresses are shape-correct but NOT interoperable with Lace/Eternl keys.** MetaMask's `@metamask/key-tree` uses RFC 8032 Ed25519, not CIP-3 BIP32-Ed25519. The bech32 strings look right but the underlying keys differ. CIP-3 derivation lands in M2.
2. **Midnight addresses are placeholders.** Real encoding requires `midnight-js` viewing-key derivation (M2).
3. **No tx signing.** `cardano_signTx`, `midnight_signTx` throw `CMM_NOT_YET_IMPLEMENTED` (M3).
4. **No tx submission.** `cardano_submitTx`, `midnight_submitTx` throw `CMM_NOT_YET_IMPLEMENTED` (M3).
5. **No balance queries.** `midnight_getBalance`, `cardano_getBalance` not yet implemented (M2).
6. **No Midnight viewing key export or shielded scan.** M2 scope.

### M1 demo artifact

A 60-second video: "install CMM Snap, see mocked balance, compose mock tx, approval dialog." Good for: Midnight Foundation preview, Catalyst pitch, internal review.

### What M2 adds

- Real Midnight address encoding via `midnight-js` + viewing-key derivation
- Cardano CIP-3 BIP32-Ed25519 derivation (interop with Lace/Eternl keys)
- `getBalance` live for both chains (Blockfrost inside the Snap)

### What M3 adds

- `signTx` / `submitTx` for both chains
- Keyring-Snap pattern (accounts appear in MetaMask's own UI)
- `snap_dialog` confirmations for destructive actions

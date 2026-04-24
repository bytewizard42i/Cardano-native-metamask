# @cmm/snap

> The **CMM MetaMask Snap** — Cardano + Midnight key derivation and (eventually) signing, running sandboxed inside MetaMask Flask.

## 📍 Current Milestone: M1

- ✅ Real HD key derivation for both chains via `snap_getBip32Entropy` + `@metamask/key-tree`
- ✅ Real bech32 Cardano Shelley base addresses (CIP-19 compliant)
- ⚠️ Midnight addresses are **shape-only placeholders** — `midnight-js` integration lands in M2
- 🔜 Signing + tx submission — M3

---

## 🧩 Architecture

```
src/
├── index.ts                # RPC dispatcher, error unwrapping
├── common/
│   ├── errors.ts           # CmmSnapError hierarchy
│   ├── handler.ts          # common_* methods
│   └── validate.ts         # param validators (security boundary)
└── chains/
    ├── cardano/
    │   ├── derive.ts       # CIP-1852 HD via key-tree
    │   ├── address.ts      # blake2b-224 + bech32 per CIP-19
    │   └── handler.ts      # cardano_* RPC methods
    └── midnight/
        ├── derive.ts       # m/44'/1296' HD
        ├── address.ts      # M1 placeholder (real encoding lands M2)
        └── handler.ts      # midnight_* RPC methods
```

**Influences**: mirrors the clean layout of `@metamask/bitcoin-wallet-snap` (repo vendored at `/home/js/DIDzMonolith/utils_metamask-snap-bitcoin-wallet`), simplified — no use-cases or repositories layer yet. We'll add those in M3 when signing + account state arrive.

---

## 📡 RPC Method Reference

All methods are invoked via `wallet_invokeSnap` with `snapId: 'local:http://localhost:8080'` (or the published Snap ID once M6 lands).

### `cardano_*` — Cardano chain

#### `cardano_getPublicKey`

Returns the HD-derived payment + stake Ed25519 public keys.

```ts
// request
await ethereum.request({
  method: 'wallet_invokeSnap',
  params: { snapId: CMM_SNAP_ID, request: { method: 'cardano_getPublicKey' } },
});

// response
{
  payment: { pubKeyHex: '0x…', path: "m/1852'/1815'/0'/0/0" },
  stake:   { pubKeyHex: '0x…', path: "m/1852'/1815'/0'/2/0" },
}
```

#### `cardano_getAddress`

Returns a real bech32 Shelley base address for the requested network.

```ts
// request
{ method: 'cardano_getAddress', params: { network: 'preprod' } }

// response
{
  address: 'addr_test1qr…',              // CIP-19 base address
  network: 'preprod',                     // 'mainnet' | 'preprod' | 'preview'
  paymentPath: "m/1852'/1815'/0'/0/0",
  stakePath:   "m/1852'/1815'/0'/2/0",
}
```

> ⚠️ **M1 caveat**: addresses are **shape-correct** bech32 strings but **not yet interoperable with Lace/Eternl** keys because `@metamask/key-tree`'s `ed25519` curve is RFC-8032, not CIP-3 BIP32-Ed25519. Interop lands in M2. See `packages/snap/src/chains/cardano/derive.ts` for the full caveat.

#### `cardano_signTx` / `cardano_submitTx` / `cardano_signData`

Throws `CMM_NOT_YET_IMPLEMENTED`. Milestone M3.

### `midnight_*` — Midnight chain

#### `midnight_getPublicKey`

```ts
// response
{ pubKeyHex: '0x…', path: "m/44'/1296'/0'/0/0" }
```

#### `midnight_getAddress`

Returns a **placeholder** address until `midnight-js` is wired in M2.

```ts
// response
{
  address: 'mn_test_02_stub_ab12cd34ef567890',
  network: 'testnet-02',
  path: "m/44'/1296'/0'/0/0",
  placeholder: true,
  note: 'Placeholder encoding — real Midnight address ships in M2 with midnight-js viewing-key derivation.',
}
```

The `_stub_` substring is how the companion dApp detects and warns about the placeholder.

#### `midnight_getBalance` / `midnight_exportViewingKey` / `midnight_scanShielded`

Throws `CMM_NOT_YET_IMPLEMENTED`. Milestone M2 (needs viewing-key derivation).

#### `midnight_signTx` / `midnight_generateProof` / `midnight_submitTx`

Throws `CMM_NOT_YET_IMPLEMENTED`. Milestone M3.

### `common_*` — Cross-chain

#### `common_getSupportedChains`
```ts
{ chains: ['midnight', 'cardano'] }
```

#### `common_getBrand`
```ts
{ brand: 'CMM', longName: 'Cardano & Midnight' }
```

#### `common_getCapabilities`

The canonical way for dApps to feature-probe this Snap.

```ts
{
  milestone: 'M1',
  capabilities: {
    cardano: { getPublicKey: true, getAddress: true, signTx: false, submitTx: false },
    midnight: {
      getPublicKey: true,
      getAddress: 'placeholder',  // 'placeholder' | true | false
      getBalance: false,
      signTx: false,
    },
  },
}
```

---

## 🚨 Error Shape

Every non-success response is a JSON-RPC error with an `error.data` payload:

```ts
{
  message: 'CMM: …',      // human-readable
  data: {
    code: 'CMM_UNKNOWN_METHOD',            // branch on this
    chain: 'cardano' | 'midnight' | undefined,
  }
}
```

### Error codes

| Code | Meaning | Thrown by |
|---|---|---|
| `CMM_UNKNOWN_METHOD` | Method name not recognized | Dispatcher |
| `CMM_NOT_YET_IMPLEMENTED` | Method reserved for a future milestone | Chain handlers |
| `CMM_INVALID_PARAMS` | Malformed/missing params | `common/validate.ts` |
| `CMM_DERIVATION_FAILED` | Internal crypto failure | `chains/*/derive.ts` |

> 💡 **For dApp authors**: import `CmmSnapErrorShape` from `@cmm/dapp-sdk`, then branch on `err.data?.code`. Don't parse messages — they may be localized or reworded.

---

## 🔐 Security Boundary

The Snap runs in an SES-lockdown sandbox with only the permissions declared in `snap.manifest.json`. We request:

- `endowment:rpc` — to expose methods to dApps
- `endowment:network-access` — for future indexer calls
- `snap_dialog` — for user confirmation flows (M3)
- `snap_manageState` — for caching derived addresses
- `snap_notify` — for tx-submission toasts (M3)
- `snap_getBip44Entropy[coinType=1815]` — Cardano
- `snap_getBip32Entropy[m/1852'/1815' | m/44'/1815' | m/44'/1296']` — fine-grained Cardano + Midnight roots

> 🎯 Minimum-privilege principle: we request **root** entropy, then derive deeper indices in-Snap. That way the user grants us one broad permission, not a permission for every account-index path.

All RPC params are validated by `common/validate.ts` before any key derivation runs. Malformed input returns `CMM_INVALID_PARAMS` with a precise message — no silent default-to-something.

---

## 🏗️ Build & Serve

```bash
# from repo root
pnpm -F @cmm/snap build     # → dist/bundle.js
pnpm -F @cmm/snap serve     # → local:http://localhost:8080 for MetaMask Flask
pnpm -F @cmm/snap typecheck # → tsc --noEmit
```

### Testing in MetaMask Flask

1. Install [MetaMask Flask](https://docs.metamask.io/snaps/get-started/install-flask/) (Chrome/Brave/Firefox developer build)
2. `pnpm -F @cmm/snap serve` in one terminal
3. `pnpm -F @cmm/companion-dapp dev` in another
4. Open http://localhost:3000 in Flask-enabled browser
5. Click the mode-switcher → **Snap** → approve install prompt
6. Real `addr_test1…` appears in the Cardano card

---

## 🔭 Roadmap Inside the Snap Package

- **M1** (current) — key derivation, address generation
- **M2** — real Midnight encoding, CIP-3 Cardano derivation, live balances
- **M3** — signing, tx submission, keyring Snap pattern (accounts in MM UI)
- **M6** — allowlist submission via `bytewizard42i/snaps-registry-mteamask-johns-copy`

---

*For the full project context see the repo root [`README.md`](../../README.md) and [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md).*

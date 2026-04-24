# `@cmm/snap`

The CMM MetaMask Snap itself. This package is the **audited core** of the
project — all key derivation, signing, and chain-adapter logic lives here.

## Layout

```
src/
├── index.ts                    # OnRpcRequestHandler, method namespace router
├── common/
│   └── handler.ts              # Cross-chain / brand methods
├── chains/
│   ├── midnight/
│   │   └── handler.ts          # Midnight RPC methods (M1-M3)
│   └── cardano/
│       └── handler.ts          # Cardano RPC methods (M7+)
```

## Scripts

```bash
pnpm build       # bundle the Snap
pnpm dev         # watch + rebuild
pnpm serve       # serve the Snap for Flask to install
pnpm typecheck   # TS only
```

## Loading in MetaMask Flask (dev)

1. Install [MetaMask Flask](https://metamask.io/flask/)
2. From this directory: `pnpm build && pnpm serve`
3. From your dApp (or the companion dApp in `packages/companion-dapp`),
   call `wallet_requestSnaps` with `local:http://localhost:8080`

## Security notes

- **Never** store private keys in `snap_manageState`
- **Never** return raw key material from any RPC method
- **Always** require `snap_dialog` consent for irreversible operations
- All key derivation happens inside the Snap sandbox only

See `docs/ARCHITECTURE.md` §5 in the repo root for full security posture.

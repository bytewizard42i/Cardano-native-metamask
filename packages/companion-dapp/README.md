# @cmm/companion-dapp

> The **companion web dApp** for CMM. Doubles as **demoland** per [`../../docs/BUILD_STRATEGY.md`](../../docs/BUILD_STRATEGY.md) — the Mock adapter is our demo layer, no throwaway demo repo.

**Stack**: Vite 6 + React 18 + Tailwind 3. Pure SPA — no SSR (wallet state is inherently client-only). Vite chosen for consistency with the rest of DIDzMonolith (BlindOracle, DIDz-io, DiscoveryManagement all on Vite).

## 🚀 Run locally

```bash
# from repo root
pnpm install
pnpm -F @cmm/companion-dapp dev
# → http://localhost:3000
```

## 🔌 Mode Toggle

The top-of-page mode switcher (with ⓘ hover tooltips explaining each mode) picks which adapter drives the balance cards:

| Mode | Data source | Status |
|---|---|---|
| **Mock** | Deterministic fixtures | ✅ Always available |
| **Live data** | Real Cardano preprod via Blockfrost + Midnight shielded placeholder | ✅ When `.env.local` has Blockfrost config |
| **Snap** | Real CMM Snap via `wallet_invokeSnap` | ✅ M1 — requires MetaMask Flask |

See [`../../docs/BLOCKFROST_INTEGRATION.md`](../../docs/BLOCKFROST_INTEGRATION.md) for the 5-minute Blockfrost setup.

## 💡 Accessible Tooltips

Every technical term in the UI has an ⓘ icon that opens a plain-English explanation + a "Learn more →" link to authoritative docs (CIPs, MetaMask Snaps docs, Blockfrost, Midnight docs, etc.).

- **Hover** to peek
- **Click** to pin (touch + keyboard users)
- **Escape** closes
- Fully screen-reader labelled

Link URLs are centralized in `src/lib/docs-links.ts` — single source of truth, audit-friendly.

## 📁 Structure

```
index.html              # Vite entry
vite.config.ts
tailwind.config.ts
src/
├── main.tsx            # React root
├── App.tsx             # landing + balance cards + mode switcher
├── index.css           # tailwind + gradient bg
├── lib/
│   ├── adapter.ts      # resolveAdapter(mode) — wires mode → @cmm/dapp-sdk
│   └── docs-links.ts   # authoritative URL registry for InfoHint tooltips
└── components/
    ├── hero.tsx
    ├── info-hint.tsx   # accessible ⓘ popover — hover + click + keyboard
    ├── mode-switcher.tsx
    ├── chain-card.tsx  # balance-fetching card
    └── footer-note.tsx
```

## 🌐 Deployment

Target: Vercel (project `cmm-companion`), deployed as a pure static Vite build.

Two environments planned:
- `cmm-mock.vercel.app` — mock adapter only, safe to share publicly
- `cmm.wallet` (or final chosen domain) — real adapter, production
